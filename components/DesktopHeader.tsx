import React, { useState } from 'react';
import { Image, Platform, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Avatar, Menu, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { colors } from '@/constants/colors';

const COMPACT_WEB_WIDTH = 720;

export function DesktopHeader() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isCompactWeb = isWeb && width < COMPACT_WEB_WIDTH;
  const showHeader = isWeb && !isCompactWeb;
  const { user, isAuthenticated, signOutUser, signInWithGoogle } = useAuth();
  const { profile } = useProfile(user?.uid);
  const [menuVisible, setMenuVisible] = useState(false);

  if (!showHeader) return null;

  const accountName = profile?.displayName || user?.displayName || user?.email || 'Account';
  const userPhoto = user?.photoURL ?? null;

  return (
    <View style={styles.header}>
      <View style={styles.headerInner}>
        <Pressable style={styles.headerBrand} onPress={() => router.push('/(tabs)')}>
          <Image source={require('@/assets/splash-icon.png')} style={styles.brandLogo} />
          <Text style={styles.brandText}>TikTorah</Text>
        </Pressable>
        <View style={styles.headerRight}>
          <Pressable style={styles.uploadButton} onPress={() => router.push('/upload')}>
            <MaterialCommunityIcons name="plus" size={18} color={colors.white} />
            <Text style={styles.uploadButtonText}>Upload</Text>
          </Pressable>
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchorPosition="bottom"
            contentStyle={styles.menuContent}
            anchor={(
              isAuthenticated ? (
                <Pressable style={styles.accountButton} onPress={() => setMenuVisible(true)}>
                  {userPhoto ? (
                    <Avatar.Image size={36} source={{ uri: userPhoto }} />
                  ) : (
                    <Avatar.Text size={36} label={(accountName[0] || 'A').toUpperCase()} />
                  )}
                  <Text style={styles.accountName} numberOfLines={1}>{accountName}</Text>
                </Pressable>
              ) : (
                <Pressable style={styles.gearButton} onPress={() => setMenuVisible(true)}>
                  <MaterialCommunityIcons name="cog-outline" size={22} color={colors.gray[900]} />
                </Pressable>
              )
            )}
          >
            {isAuthenticated ? (
              <>
                <Menu.Item
                  onPress={() => { setMenuVisible(false); router.push('/profile'); }}
                  title="Profile"
                  leadingIcon="account"
                />
                <Menu.Item
                  onPress={() => { setMenuVisible(false); router.push('/(tabs)/settings'); }}
                  title="Settings"
                  leadingIcon="cog"
                />
                <Menu.Item
                  onPress={() => { setMenuVisible(false); signOutUser(); }}
                  title="Log out"
                  leadingIcon="logout"
                />
              </>
            ) : (
              <>
                <Menu.Item
                  onPress={() => { setMenuVisible(false); router.push('/(tabs)/settings'); }}
                  title="Settings"
                  leadingIcon="cog"
                />
                <Menu.Item
                  onPress={() => { setMenuVisible(false); signInWithGoogle(); }}
                  title="Login with Google"
                  leadingIcon="google"
                />
              </>
            )}
          </Menu>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    width: '100%',
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  headerInner: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  brandText: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.hotPink,
    letterSpacing: 0.5,
  },
  brandLogo: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  accountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray[200],
    backgroundColor: colors.white,
  },
  accountName: {
    fontSize: 15,
    color: colors.gray[900],
    fontWeight: '600',
    maxWidth: 200,
  },
  menuContent: {
    backgroundColor: colors.white,
  },
  gearButton: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray[200],
    backgroundColor: colors.white,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: colors.hotPink,
    minHeight: 44,
  },
  uploadButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 14,
  },
});
