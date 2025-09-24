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
