// Barcode Scanner Module: Bluetooth / USB HID Gun & iOS Camera Viewfinder
import { initAudio } from './audio.js';

let html5QrCode = null;
let isTorchOn = false;
let onScanCallback = null;

export function registerOnScan(cb) {
    onScanCallback = cb;
}

// External Bluetooth/USB HID barcode guns send rapid keystrokes (<50ms) terminating with 'Enter'
export function setupBluetoothScannerListener() {
    let barcodeBuffer = '';
    let lastKeyTime = Date.now();
    let isScanning = false;

    window.addEventListener('keydown', (event) => {
        const currentTime = Date.now();
        const timeDiff = currentTime - lastKeyTime;
        lastKeyTime = currentTime;

        initAudio();

        if (timeDiff < 50 && timeDiff > 0) {
            isScanning = true;
        } else if (timeDiff > 200) {
            barcodeBuffer = '';
            isScanning = false;
        }

        if (event.key === 'Enter') {
            const scannedCode = barcodeBuffer.trim();
            if (scannedCode.length >= 3) {
                event.preventDefault();
                console.log('Bluetooth Gun Scanned:', scannedCode);
                if (onScanCallback) onScanCallback(scannedCode, 'gun');
            }
            barcodeBuffer = '';
            isScanning = false;
            return;
        }

        if (event.key.length === 1) {
            barcodeBuffer += event.key;
        }
    });
}

export function setupCameraScanner() {
    const openCameraBtn = document.getElementById('open-camera-btn');
    const closeCameraBtn = document.getElementById('close-camera-btn');
    const toggleTorchBtn = document.getElementById('toggle-torch-btn');
    const manualBarcodeSubmit = document.getElementById('manual-scanner-submit-btn');
    const manualBarcodeInput = document.getElementById('manual-scanner-barcode');

    if (openCameraBtn) {
        openCameraBtn.addEventListener('click', () => {
            initAudio();
            startCameraScanner();
        });
    }

    if (closeCameraBtn) {
        closeCameraBtn.addEventListener('click', stopCameraScanner);
    }

    if (toggleTorchBtn) {
        toggleTorchBtn.addEventListener('click', toggleTorch);
    }

    if (manualBarcodeSubmit && manualBarcodeInput) {
        const handleManualSubmit = () => {
            const code = manualBarcodeInput.value.trim();
            if (code) {
                stopCameraScanner();
                if (onScanCallback) onScanCallback(code, 'manual');
                manualBarcodeInput.value = '';
            }
        };
        manualBarcodeSubmit.addEventListener('click', handleManualSubmit);
        manualBarcodeInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') handleManualSubmit();
        });
    }
}

export async function startCameraScanner() {
    const cameraModal = document.getElementById('camera-modal');
    if (!cameraModal) return;

    cameraModal.classList.remove('hidden');

    if (typeof Html5Qrcode === 'undefined') {
        alert('Scanner library is loading. Please try again in a moment.');
        return;
    }

    try {
        if (!html5QrCode) {
            html5QrCode = new Html5Qrcode('camera-reader');
        }

        const config = {
            fps: 15,
            qrbox: { width: 260, height: 180 },
            aspectRatio: 1.0,
            videoConstraints: {
                facingMode: 'environment',
                focusMode: 'continuous'
            }
        };

        await html5QrCode.start(
            { facingMode: 'environment' },
            config,
            (decodedText) => {
                console.log('Camera Barcode Detected:', decodedText);
                stopCameraScanner();
                if (onScanCallback) onScanCallback(decodedText, 'camera');
            },
            () => {
                // scanning frame...
            }
        );
    } catch (err) {
        console.error('Camera Scanner start error:', err);
        alert('Could not open iPhone camera. Please allow camera access in Safari Settings.');
    }
}

export async function stopCameraScanner() {
    const cameraModal = document.getElementById('camera-modal');
    if (cameraModal) cameraModal.classList.add('hidden');

    if (html5QrCode && html5QrCode.isScanning) {
        try {
            await html5QrCode.stop();
        } catch (e) {
            console.warn('Error stopping scanner:', e);
        }
    }
    isTorchOn = false;
}

export async function toggleTorch() {
    if (!html5QrCode || !html5QrCode.isScanning) return;
    try {
        isTorchOn = !isTorchOn;
        await html5QrCode.applyVideoConstraints({
            advanced: [{ torch: isTorchOn }]
        });
    } catch (e) {
        console.warn('Torch not supported on this device/browser:', e);
        alert('Flashlight toggle is not supported by your current browser.');
    }
}
