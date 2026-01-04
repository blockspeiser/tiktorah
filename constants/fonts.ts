import { Platform } from 'react-native';

/**
 * TikTorah Font System
 *
 * 1) Logotype: Noto Sans - Used for "TikTorah" branding
 * 2) English Serif: EB Garamond - Used for English text in text blocks
 * 3) Hebrew Serif: Cardo - Used for Hebrew text in text blocks
 * 4) English Sans: Roboto - Used everywhere else (default)
 */

// Logotype font - used for "TikTorah" branding (splash screen, header)
export const LOGOTYPE_FONT = 'NotoSans_700Bold';

// English serif font - used for English text in text blocks
export const ENGLISH_SERIF_FONT = 'EBGaramond_400Regular';
export const ENGLISH_SERIF_FONT_BOLD = 'EBGaramond_700Bold';

// Hebrew serif font - used for Hebrew text in text blocks
export const HEBREW_SERIF_FONT = 'Cardo_400Regular';
export const HEBREW_SERIF_FONT_BOLD = 'Cardo_700Bold';

// English sans font - used everywhere else (default app font)
export const ENGLISH_SANS_FONT = 'Roboto_400Regular';
export const ENGLISH_SANS_FONT_MEDIUM = 'Roboto_500Medium';
export const ENGLISH_SANS_FONT_BOLD = 'Roboto_700Bold';

// Platform-specific fallbacks for when fonts aren't loaded
export const FALLBACK_SERIF = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  default: 'serif',
});

export const FALLBACK_HEBREW_SERIF = Platform.select({
  ios: 'Times New Roman',
  android: 'serif',
  default: '"Times New Roman", Times, serif',
});

export const FALLBACK_SANS = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  default: 'sans-serif',
});
