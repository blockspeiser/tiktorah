import React from 'react';
import { Image, Platform, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isCompactWeb = isWeb && width < COMPACT_WEB_WIDTH;
  const isMobileView = !isWeb || isCompactWeb;

  if (!isMobileView) return null;

  return (
    <View style={[styles.nav, { height: MOBILE_NAV_HEIGHT + insets.bottom, paddingBottom: insets.bottom }]}>
      <Pressable style={styles.navButton} onPress={() => router.push('/upload')}>
        <MaterialCommunityIcons name="plus" size={24} color={colors.hotPink} />
      </Pressable>
      <Pressable style={styles.navButton} onPress={() => router.push('/(tabs)')}>
        <Image source={require('@/assets/splash-icon.png')} style={styles.navLogo} />
      </Pressable>
      <Pressable style={styles.navButton} onPress={() => router.push('/(tabs)/settings')}>
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
    borderTopColor: colors.gray[200],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
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
});
