# TikTorah

A cross-platform React Native app built with Expo that runs on iOS, Android, and Web for undoomscrolling Torah.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or later) - [Download](https://nodejs.org/)
- **npm** or **yarn** - Comes with Node.js
- **Git** - [Download](https://git-scm.com/)

### Platform-Specific Requirements

#### iOS (macOS only)
- **Xcode** (v15 or later) - Install from the Mac App Store
- **Xcode Command Line Tools** - Run `xcode-select --install`
- **CocoaPods** - Run `sudo gem install cocoapods`

#### Android
- **Android Studio** - [Download](https://developer.android.com/studio)
- **Android SDK** (API 34 or later)
- **Android Emulator** or physical device with USB debugging enabled

#### Web
- Any modern web browser (Chrome, Firefox, Safari, Edge)

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd tiktorah
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

## Running the App

### Start the Development Server

```bash
npm start
```

This launches the Expo development server and displays a QR code and menu options.

### iOS

**Option 1: iOS Simulator (macOS only)**
```bash
npm run ios
```
This automatically opens the app in the iOS Simulator.

**Option 2: Physical Device**
1. Install the **Expo Go** app from the App Store
2. Run `npm start`
3. Scan the QR code with your iPhone camera

### Android

**Option 1: Android Emulator**
```bash
npm run android
```
Ensure you have an Android emulator running or it will prompt you to start one.

**Option 2: Physical Device**
1. Install the **Expo Go** app from the Google Play Store
2. Enable USB debugging on your device
3. Run `npm start`
4. Scan the QR code with the Expo Go app

### Web

```bash
npm run web
```

This opens the app in your default web browser at `http://localhost:8081`.

## Sefaria Data

The app includes bundled data from [Sefaria.org](https://sefaria.org) and automatically checks for updates on startup.

### Data Sources

| Data | API Endpoint | Description |
|------|--------------|-------------|
| Library Index | `/api/index` | Complete catalog of texts (~4MB) |
| Topics | `/api/topics` | Topic taxonomy and metadata (~1.3MB) |

### How It Works

1. **Bundled Data**: The app ships with pre-downloaded JSON data files in `/data/`
2. **Instant Loading**: On startup, data loads immediately from bundled or cached files
3. **Background Updates**: After loading, the app checks for updates in the background (non-blocking)
4. **Hash Comparison**: Uses SHA256 hashing to detect if remote data has changed
5. **Automatic Caching**: Updated data is persisted locally for future use

### Storage

| Platform | Storage Method |
|----------|----------------|
| iOS | File system (`expo-file-system`) |
| Android | File system (`expo-file-system`) |
| Web | LocalStorage via AsyncStorage |

### Usage in Code

```tsx
import { useSefaria } from '@/contexts/SefariaContext';

function MyComponent() {
  const { index, topics, isLoading, isCheckingForUpdates } = useSefaria();

  if (isLoading) return <Loading />;

  // Use index and topics data...
}
```

### Manual Data Management

Users can manage data from Settings:
- **Check for Updates**: Manually trigger an update check
- **Reset to Bundled**: Clear cached data and revert to bundled version

## Project Structure

```
tiktorah/
├── app/                    # App screens (Expo Router)
│   ├── _layout.tsx         # Root layout with providers
│   ├── index.tsx           # Entry point redirect
│   └── (tabs)/             # Tab-based navigation
│       ├── _layout.tsx     # Tab bar configuration
│       ├── index.tsx       # Home screen
│       ├── components.tsx  # UI component showcase
│       └── settings.tsx    # Settings screen
├── contexts/
│   └── SefariaContext.tsx  # Sefaria data provider and hooks
├── services/
│   └── sefariaData.ts      # Data loading, caching, and updates
├── data/
│   ├── sefaria-index.json  # Bundled library index
│   └── sefaria-topics.json # Bundled topics data
├── assets/                 # Images, fonts, and icons
├── constants/
│   └── theme.ts            # App theme configuration
├── app.json                # Expo configuration
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── babel.config.js         # Babel configuration
├── metro.config.js         # Metro bundler configuration
└── eas.json                # EAS Build configuration
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start the Expo development server |
| `npm run ios` | Run on iOS simulator |
| `npm run android` | Run on Android emulator |
| `npm run web` | Run in web browser |
| `npm run lint` | Run ESLint |
| `npm test` | Run tests |

## Building for Production

### Using EAS Build (Recommended)

First, install the EAS CLI and log in:
```bash
npm install -g eas-cli
eas login
```

**Build for iOS:**
```bash
eas build --platform ios
```

**Build for Android:**
```bash
eas build --platform android
```

**Build for both platforms:**
```bash
eas build --platform all
```

### Web Export

```bash
npm run build:web
```

This creates a static export in the `dist/` folder that can be deployed to any static hosting service.

## Testing

### Running Tests

```bash
npm test
```

### Running Linter

```bash
npm run lint
```

## Troubleshooting

### Common Issues

**Metro bundler cache issues:**
```bash
npm start -- --clear
```

**iOS build fails:**
```bash
cd ios && pod install && cd ..
```

**Android build fails:**
- Ensure Android SDK is properly configured
- Check that `ANDROID_HOME` environment variable is set
- Try `npm run android -- --clear`

**Web styles not working:**
- Clear browser cache
- Restart the development server with `npm start -- --clear`

### Resetting the Project

If you encounter persistent issues:
```bash
rm -rf node_modules
rm -rf .expo
npm install
npm start -- --clear
```

## Tech Stack

- **React Native** 0.76 - Cross-platform mobile framework
- **Expo** SDK 52 - Development platform and tools
- **React** 18.3 - UI library
- **TypeScript** 5.6 - Type-safe JavaScript
- **Expo Router** 4 - File-based navigation
- **React Native Paper** 5 - Material Design 3 components
- **React Native Reanimated** 3 - Animations
- **@expo/vector-icons** - Icon library
- **expo-file-system** - Native file storage
- **expo-crypto** - SHA256 hashing for update detection
- **AsyncStorage** - Cross-platform key-value storage

## Data Attribution

This app uses data from [Sefaria.org](https://sefaria.org), a free living library of Jewish texts.

## License

MIT
