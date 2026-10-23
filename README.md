# HB Works Mobile POS 🏍️ (React Native)

Cross-platform React Native (Expo) Point of Sale (POS) and inventory management mobile application optimized for iOS, Android, and Web in retail motor shops.

## Features

- 📱 **True Native Mobile UI**: Built with React Native & Expo with fluid gestures, native modals, safe-area notches, and rich theme styling.
- 📷 **Native Camera Barcode Scanner**: Built-in rear camera barcode scanner via `expo-camera` with targeting reticle and animated laser scanline.
- 🔫 **External Barcode Gun Ready**: Seamless background listener for Bluetooth and wireless USB HID barcode scanner guns (<50ms keystroke capture).
- 💵 **Cash Register & Change Due**: One-tap quick tender buttons (₱100, ₱200, ₱500, ₱1,000, ₱2,000, Exact), change calculation with visual feedback.
- 🧾 **Thermal Paper Receipt**: Authentic monospace thermal receipt preview with share and print integration.
- 📦 **Live Inventory & Cloud Sync**: Full integration with Supabase for real-time stock deductions, new item creation, offline queue auto-sync, and cloud sales recording.
- 🔊 **Native Haptics & Audio Chimes**: Tactile feedback with `expo-haptics` and pleasant audio chimes on scan confirmations, checkouts, and alerts.

## Project Structure

```
HB WORKS/
├── App.js                     # Root React Native application controller
├── app.json                   # Expo configuration & native permissions
├── metro.config.js            # Metro bundler config
├── src/
│   ├── theme.js               # Design tokens, color system, and typography
│   ├── state/
│   │   └── posStore.js        # AsyncStorage state engine, cart, and offline queue
│   ├── services/
│   │   ├── supabase.js        # Supabase API client & cloud sync
│   │   └── feedback.js        # Native haptics & audio synthesis
│   ├── components/
│   │   ├── Header.js          # Top navigation bar with status pills
│   │   ├── BottomTabBar.js    # Bottom navigation tabs with badge count
│   │   ├── CameraScannerModal.js # Camera barcode scanner with reticle & laser
│   │   ├── CheckoutModal.js   # Payment tender & change calculator
│   │   ├── ReceiptModal.js    # Monospace thermal paper receipt preview
│   │   ├── ReceiveStockModal.js # Add & receive inventory stock modal
│   │   └── SupabaseSettingsModal.js # Cloud database credentials & sync
│   └── screens/
│       ├── SellScreen.js      # Quick catalog grid, cart, and checkout CTA
│       ├── InventoryScreen.js # Stock list, low-stock filter, stock stepper
│       └── IncomeScreen.js    # Revenue hero, KPI stats, transaction history
├── legacy-web/                # Archived legacy HTML/CSS/JS web assets
└── supabase_schema.sql        # Database schema for Supabase
```

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the Expo Development Server**:
   ```bash
   npm start
   ```

3. **Run on specific platforms**:
   - **iOS**: `npm run ios` (or scan the QR code with Expo Go on your iPhone)
   - **Android**: `npm run android` (or scan QR code with Expo Go on Android)
   - **Web**: `npm run web` (or `npm run build:web` to generate a production web build)

4. **Database Setup**:
   Run `supabase_schema.sql` in your Supabase SQL Editor. In the app, tap the Cloud / Settings icon in the top header to configure your Supabase URL and Key.
