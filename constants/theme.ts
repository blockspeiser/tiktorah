import { MD3LightTheme, configureFonts } from 'react-native-paper';
import { colors } from './colors';
import {
  ENGLISH_SANS_FONT,
  ENGLISH_SANS_FONT_MEDIUM,
  ENGLISH_SANS_FONT_BOLD,
} from './fonts';

const fontConfig = {
  fontFamily: ENGLISH_SANS_FONT,
};

// Custom font variants for React Native Paper
const customFonts = {
  regular: {
    fontFamily: ENGLISH_SANS_FONT,
    fontWeight: '400' as const,
  },
  medium: {
    fontFamily: ENGLISH_SANS_FONT_MEDIUM,
    fontWeight: '500' as const,
  },
  bold: {
    fontFamily: ENGLISH_SANS_FONT_BOLD,
    fontWeight: '700' as const,
  },
};

export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.hotPink,
    primaryContainer: colors.hotPinkLight,
    secondary: colors.gray[700],
    secondaryContainer: colors.gray[200],
    surface: colors.white,
    surfaceVariant: colors.gray[100],
    background: colors.white,
    error: '#B3261E',
    onPrimary: colors.white,
    onPrimaryContainer: colors.hotPink,
    onSecondary: colors.white,
    onSurface: colors.gray[900],
    onSurfaceVariant: colors.gray[600],
    onBackground: colors.gray[900],
    outline: colors.gray[400],
    outlineVariant: colors.gray[200],
  },
  fonts: configureFonts({
    config: {
      ...fontConfig,
      displayLarge: customFonts.regular,
      displayMedium: customFonts.regular,
      displaySmall: customFonts.regular,
      headlineLarge: customFonts.regular,
      headlineMedium: customFonts.medium,
      headlineSmall: customFonts.medium,
      titleLarge: customFonts.medium,
      titleMedium: customFonts.medium,
      titleSmall: customFonts.medium,
      labelLarge: customFonts.medium,
      labelMedium: customFonts.medium,
      labelSmall: customFonts.medium,
      bodyLarge: customFonts.regular,
      bodyMedium: customFonts.regular,
      bodySmall: customFonts.regular,
    },
  }),
};
