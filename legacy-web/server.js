import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.mjs': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.webmanifest': 'application/manifest+json; charset=UTF-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon'
};

// Files or extensions strictly forbidden from being served
const BLOCKED_EXTENSIONS = new Set(['.env', '.sql', '.exe', '.lock', '.log', '.md', '.ts', '.git']);
const BLOCKED_FILENAMES = new Set([
  'package.json',
  'package-lock.json',
  'server.js',
  'cloudflared.exe',
  'supabase_schema.sql',
  'skills-lock.json',
  'license'
]);

function setSecurityHeaders(res, contentType, filePath) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(self), microphone=(), geolocation=()');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://cdn.jsdelivr.net; " +
    "img-src 'self' data: blob:; " +
    "media-src 'self' blob:; " +
    "object-src 'none'; " +
    "base-uri 'self'; " +
    "form-action 'self';"
  );

  // Cache Control: no-cache for index.html and sw.js; static asset caching for others
  const basename = path.basename(filePath).toLowerCase();
  if (basename === 'index.html' || basename === 'sw.js') {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  } else {
    res.setHeader('Cache-Control', 'public, max-age=3600');
  }

  res.setHeader('Content-Type', contentType);
}

const server = http.createServer((req, res) => {
  // Only permit safe read methods
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { 'Content-Type': 'text/plain', 'Allow': 'GET, HEAD' });
    res.end('405 Method Not Allowed');
    return;
  }

  // Health check endpoint
  if (req.url === '/health' || req.url === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', uptime: process.uptime() }));
    return;
  }

  let decodedPathname;
  try {
    const rawPath = req.url.split('?')[0];
    decodedPathname = decodeURIComponent(rawPath);
  } catch (err) {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    res.end('400 Bad Request: Malformed URI');
    return;
  }

  // Prevent null byte injections
  if (decodedPathname.includes('\0')) {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    res.end('400 Bad Request');
    return;
  }

  // Map root to index.html
  const requestPath = decodedPathname === '/' ? '/index.html' : decodedPathname;

  // Resolve target absolute path within sandbox
  const safePath = path.resolve(__dirname, '.' + requestPath);

  // Path Traversal Defense: Ensure target is strictly within __dirname
  if (!safePath.startsWith(__dirname)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden: Access Denied');
    return;
  }

  // Information Disclosure Defense: Block dotfiles/hidden dirs (.env, .git, .agents)
  const relativeParts = path.relative(__dirname, safePath).split(path.sep);
  if (relativeParts.some(part => part.startsWith('.'))) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden: Hidden files cannot be accessed');
    return;
  }

  // Block node_modules access
  if (relativeParts.includes('node_modules')) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  const filename = path.basename(safePath).toLowerCase();
  const ext = path.extname(safePath).toLowerCase();

  // Block sensitive files and unauthorized extensions
  if (BLOCKED_FILENAMES.has(filename) || BLOCKED_EXTENSIONS.has(ext)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden: Protected resource');
    return;
  }

  const contentType = MIME_TYPES[ext];
  if (!contentType) {
    res.writeHead(415, { 'Content-Type': 'text/plain' });
    res.end('415 Unsupported Media Type');
    return;
  }

  fs.stat(safePath, (statErr, stats) => {
    if (statErr) {
      if (statErr.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end(`500 Server Error: ${statErr.code}`);
      }
      return;
    }

    if (stats.isDirectory()) {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('403 Forbidden: Directory listing disabled');
      return;
    }

    setSecurityHeaders(res, contentType, safePath);

    if (req.method === 'HEAD') {
      res.writeHead(200);
      res.end();
      return;
    }

    const stream = fs.createReadStream(safePath);
    stream.on('error', (streamErr) => {
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
      }
      res.end('500 Server Stream Error');
    });
    stream.pipe(res);
  });
});

server.listen(PORT, HOST, () => {
  console.log(`HB Works POS Server running securely at http://${HOST}:${PORT}`);
});
