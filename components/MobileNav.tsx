import React, { useMemo } from 'react';
import { Image, Platform, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/constants/colors';

const MOBILE_NAV_HEIGHT = 64;
const COMPACT_WEB_WIDTH = 720;

export function useMobileNavHeight() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isCompactWeb = isWeb && width < COMPACT_WEB_WIDTH;
  const isMobileView = !isWeb || isCompactWeb;
  return isMobileView ? MOBILE_NAV_HEIGHT + insets.bottom : 0;
}

export function MobileNav() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isCompactWeb = isWeb && width < COMPACT_WEB_WIDTH;
  const isMobileView = !isWeb || isCompactWeb;

  const activeTab = useMemo(() => {
    if (pathname === '/post' || pathname === '/upload' || pathname === '/comment') return 'post';
    if (pathname.startsWith('/(tabs)/settings') || pathname === '/settings') return 'settings';
    return 'home';
  }, [pathname]);

  if (!isMobileView) return null;

  return (
    <View
      style={[
        styles.nav,
        { height: MOBILE_NAV_HEIGHT + insets.bottom, paddingBottom: insets.bottom },
        isCompactWeb && styles.navCompactWeb,
      ]}
    >
      <View
        pointerEvents="none"
        style={[
          styles.activeIndicator,
          activeTab === 'post' && styles.activeIndicatorPost,
          activeTab === 'home' && styles.activeIndicatorHome,
          activeTab === 'settings' && styles.activeIndicatorSettings,
        ]}
      />
      <Pressable
        style={styles.navButton}
        onPress={() => router.push('/post')}
      >
        <MaterialCommunityIcons name="plus-thick" size={24} color={colors.hotPink} />
      </Pressable>
      <Pressable
        style={styles.navButton}
        onPress={() => router.push('/(tabs)')}
      >
        <Image source={require('@/assets/splash-icon.png')} style={styles.navLogo} />
      </Pressable>
      <Pressable
        style={styles.navButton}
        onPress={() => router.push('/(tabs)/settings')}
      >
        <MaterialCommunityIcons name="cog-outline" size={24} color={colors.hotPink} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  nav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray[300],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  navCompactWeb: {
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[300],
  },
  navButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  navLogo: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  activeIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '33.333%',
    height: 3,
    backgroundColor: colors.hotPink,
  },
  activeIndicatorPost: {
    left: '0%',
  },
  activeIndicatorHome: {
    left: '33.333%',
  },
  activeIndicatorSettings: {
    left: '66.666%',
  },
});
