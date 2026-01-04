import React, { ReactNode } from 'react';
import { Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import { MobileNav, useMobileNavHeight } from '@/components/MobileNav';
import { DesktopHeader } from '@/components/DesktopHeader';
import { colors } from '@/constants/colors';

export const PHONE_ASPECT_RATIO = 9 / 16;
export const DESKTOP_HEADER_HEIGHT = 72;
export const DESKTOP_GAP = 40;

export function usePhoneViewport() {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const mobileNavHeight = useMobileNavHeight();
  const isWeb = Platform.OS === 'web';
  const isCompactWeb = isWeb && (screenWidth < 720 || screenHeight < 720);
  const showHeader = isWeb && !isCompactWeb;
  const isMobileView = !isWeb || isCompactWeb;

  const phoneHeight = showHeader
    ? Math.max(520, screenHeight - DESKTOP_HEADER_HEIGHT - (DESKTOP_GAP * 2))
    : Math.max(320, screenHeight - mobileNavHeight);
  const phoneWidth = showHeader ? phoneHeight * PHONE_ASPECT_RATIO : screenWidth;

  return {
    isWeb,
    isMobileView,
    showHeader,
    phoneHeight,
    phoneWidth,
    mobileNavHeight,
  };
}

interface PhoneViewportProps {
  children: ReactNode;
  overlay?: ReactNode;
  phoneWidth: number;
  phoneHeight: number;
  showHeader: boolean;
  mobileNavHeight: number;
}

export function PhoneViewport({
  children,
  overlay,
  phoneWidth,
  phoneHeight,
  showHeader,
  mobileNavHeight,
}: PhoneViewportProps) {
  if (showHeader) {
    return (
      <View style={styles.webWrapper}>
        <DesktopHeader />
        <View style={styles.webContent}>
          <View style={[styles.phoneContainer, { width: phoneWidth, height: phoneHeight }]}>
            {children}
          </View>
          {overlay}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.mobileContainer, { paddingBottom: mobileNavHeight }]}>
      {children}
      <MobileNav />
    </View>
  );
}

const styles = StyleSheet.create({
  webWrapper: {
    flex: 1,
    backgroundColor: colors.hotPinkLight,
    justifyContent: 'flex-start',
    alignItems: 'stretch',
  },
  webContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: DESKTOP_GAP,
    paddingBottom: DESKTOP_GAP,
  },
  phoneContainer: {
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  mobileContainer: {
    flex: 1,
    backgroundColor: colors.white,
  },
});
