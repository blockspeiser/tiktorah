# Repository Guidelines

## Project Structure & Module Organization
- `app/` holds Expo Router screens and layouts. Route groups live in folders like `app/(tabs)/`.
- `contexts/` and `services/` contain shared state and data-fetching logic (e.g., Sefaria data handling).
- `constants/` stores app-wide configuration such as `constants/theme.ts`.
- `data/` includes bundled JSON data files used at runtime.
- `assets/` and `public/` contain images and static web assets.
- Root config files: `app.json`, `eas.json`, `babel.config.js`, `metro.config.js`, `tsconfig.json`.

## Build, Test, and Development Commands
- `npm start`: Start Expo dev server (QR code + device/simulator options).
- `npm run ios` / `npm run android` / `npm run web`: Launch the app on a specific platform.
- `npm run build:ios` / `npm run build:android`: Run EAS builds for mobile.
- `npm run build:web`: Export a static web build to `dist/`.
- `npm run lint`: Run ESLint with `eslint-config-expo`.
- `npm test`: Run Jest (`jest-expo`).

## Coding Style & Naming Conventions
- TypeScript is enabled in strict mode; prefer typed props and functions.
- Use 2-space indentation, single quotes, and semicolons to match existing files in `app/`.
- Keep Expo Router file names route-friendly (e.g., `app/(tabs)/settings.tsx`).
- Prefer the `@/` path alias defined in `tsconfig.json` for internal imports.

## Testing Guidelines
- Test runner: Jest with `jest-expo`; React Native tests can use `@testing-library/react-native`.
- No test files are currently in the repo; place new tests under `__tests__/` or name files `*.test.ts(x)`.
- Run locally with `npm test`; keep tests deterministic and device-agnostic.

## Commit & Pull Request Guidelines
- No formal commit message convention is documented; use concise, imperative messages (e.g., `Add Sefaria cache reset`).
- PRs should describe the change, include screenshots for UI updates, and note any data or config changes.
- Link relevant issues or tasks when applicable.

## Configuration & Data Notes
- Bundled data lives in `data/` and is updated at runtime via `services/sefariaData.ts`.
- Avoid committing generated build output like `dist/` or Expo cache directories.
