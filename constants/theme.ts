import { MD3LightTheme, configureFonts } from 'react-native-paper';
import { colors } from './colors';

const fontConfig = {
  fontFamily: 'System',
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
  fonts: configureFonts({ config: fontConfig }),
};
