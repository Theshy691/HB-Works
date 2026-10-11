# HB Works Mobile POS 🏍️

Modern, mobile-first Point of Sale (POS) and inventory management web application optimized for iOS devices (iPhone) and physical retail motor shops.

## Features

- 📱 **Native-like iOS PWA**: Full-screen standalone operation, safe area notch handling, Apple touch icons, and offline caching via Service Worker.
- 📷 **Live Camera Barcode Scanner**: Built-in rear-camera barcode scanner with continuous autofocus, targeting reticle, and laser scanning animation.
- 🔫 **External Barcode Gun Ready**: Automatic background listener for Bluetooth and wireless USB HID barcode scanner guns (<50ms keystroke capture).
- 💵 **Cash Register & Change Due**: One-tap quick tender buttons (₱100, ₱500, ₱1,000, etc.), change calculations, and instant thermal receipt preview.
- 📦 **Live Inventory & Cloud Sync**: Seamless integration with Supabase for real-time stock deductions, new item creation, and cloud transaction recording.
- 🔊 **Web Audio POS Chimes**: Synthesized audio feedback for scan confirmations, cash register chimes, and error buzzers.

## Project Structure

```
HB WORKS/
├── js/
│   ├── state.js      # Central reactive store & localStorage persistence
│   ├── audio.js      # Web Audio API scanner & checkout chimes
│   ├── scanner.js    # Bluetooth gun listener & camera viewfinder controls
│   ├── supabase.js   # Cloud database client & bidirectional synchronization
│   └── ui.js         # Cart, inventory, checkout modal, & receipt renderers
├── app.js            # Main application controller
├── index.html        # Main POS interface
├── style.css         # iOS Human Interface Guidelines stylesheet
├── manifest.webmanifest # PWA configuration
├── sw.js             # Service Worker offline asset cache
├── server.js         # Lightweight local dev server
├── supabase_schema.sql # Database schema for Supabase
└── icons/            # App icons
```

## Getting Started

1. Clone repository:
   ```bash
   git clone https://github.com/Theshy691/HB-Works.git
   cd HB-Works
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Setup environment variables:
   Copy `.env.example` to `.env` and fill in your Supabase credentials:
   ```bash
   cp .env.example .env
   ```

4. Database Setup:
   Run `supabase_schema.sql` in your Supabase SQL Editor to create the `products` and `sales` tables.

5. Start the local server:
   ```bash
   npm start
   ```
   Open `http://localhost:3000` in your browser or iPhone.
