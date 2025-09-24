# SmartReceipt Mobile

Expo (TypeScript) rewrite of the SmartReceipt experience. The app lets users scan receipts, review the extracted data, and store expenses locally (mock data/TBD backend).

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Run the Expo dev server
npm start
```

Then press `i` for iOS simulator, `a` for Android emulator, or scan the QR code with Expo Go.

To point the app to your OCR backend, create a `.env` file using the provided example:

```bash
cp .env.example .env
# Update the URL if your backend runs elsewhere
```

Expo automatically injects the `EXPO_PUBLIC_OCR_URL` variable into the app bundle.

## OCR Development Server

This repository ships with a lightweight Express server that performs OCR using `tesseract.js`.

```bash
cd server
npm install
# (optional) copy env file if you want to use Mindee
cp .env.example .env
# export MINDEE_API_KEY=... or edit .env
npm start
# Server listens on http://localhost:4000 by default
```

If you add a `MINDEE_API_KEY` (Mindee receipt OCR) the server forwards requests to Mindee for higher accuracy. Without a key it falls back to local Tesseract parsing.

The mobile app expects an `EXPO_PUBLIC_OCR_URL` (defaults to `http://localhost:4000/ocr`). When running on a physical device, replace `localhost` with your machine’s LAN IP.

## Project Structure

```
src/
  components/      # Shared UI primitives (glass surface, buttons, inputs, etc.)
  screens/         # Dashboard / Scan / Result flows
  navigation/      # React Navigation stack setup
  store/           # Redux slices for expenses and scan state
  theme/           # Color and spacing tokens
```

## Tech Stack

- Expo SDK 54 with React Native 0.81
- TypeScript
- React Navigation (native stack)
- Redux Toolkit for local state
- Expo modules: ImagePicker, LinearGradient

## Requirements

- Node.js ≥ 20.19 (matches Expo SDK requirement)
- npm (or yarn/pnpm) for package management
- Xcode + iOS simulator and/or Android Studio for device testing (optional but recommended)

## Licensing

Internal project (no license specified yet).
