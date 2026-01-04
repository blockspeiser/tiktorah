import React from 'react';
import { StyleSheet, View, Pressable, Platform, useWindowDimensions } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { colors } from '@/constants/colors';
import { MobileNav, useMobileNavHeight } from '@/components/MobileNav';
import { DesktopHeader } from '@/components/DesktopHeader';

export const options = {
  title: 'Post',
};

interface PostOptionProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
  isMobile?: boolean;
}

function PostOption({ icon, title, subtitle, onPress, isMobile }: PostOptionProps) {
  const { width: screenWidth } = useWindowDimensions();
  const buttonWidth = isMobile ? Math.min(screenWidth - 40, 360) : undefined;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.optionButton,
        isMobile && styles.optionButtonMobile,
        isMobile && { width: buttonWidth },
        pressed && styles.optionButtonPressed,
      ]}
      onPress={onPress}
    >
      <MaterialCommunityIcons name={icon} size={48} color={colors.white} />
      <Text style={styles.optionTitle}>{title}</Text>
      <Text style={styles.optionSubtitle}>{subtitle}</Text>
    </Pressable>
  );
}

export default function PostScreen() {
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isCompactWeb = isWeb && screenWidth < 720;
  const isMobileView = !isWeb || isCompactWeb;
  const mobileNavHeight = useMobileNavHeight();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const pageTitle = isAuthenticated ? 'Create a Post' : 'Post to TikTorah';

  return (
    <View style={[styles.screen, isMobileView && styles.screenMobile]}>
      <DesktopHeader />
      <View style={[styles.container, { paddingBottom: mobileNavHeight }]}>
        {authLoading ? (
          <ActivityIndicator />
        ) : (
          <Text style={styles.pageTitle}>{pageTitle}</Text>
        )}
        <View style={[styles.optionsContainer, isMobileView && styles.optionsContainerMobile]}>
          <PostOption
            icon="image"
            title="Meme"
            subtitle="Upload an image tied to a Torah source"
            onPress={() => router.push('/upload')}
            isMobile={isMobileView}
          />
          <PostOption
            icon="comment-text"
            title="Comment"
            subtitle="Make a comment on a Torah source"
            onPress={() => router.push('/comment')}
            isMobile={isMobileView}
          />
        </View>
      </View>
      <MobileNav />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.hotPinkLight,
  },
  screenMobile: {
    backgroundColor: colors.white,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.gray[900],
    marginBottom: 32,
    textAlign: 'center',
  },
  optionsContainer: {
    flexDirection: 'row',
    gap: 20,
    maxWidth: 600,
    width: '100%',
  },
  optionsContainerMobile: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  optionButton: {
    flex: 1,
    backgroundColor: colors.hotPink,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 180,
    gap: 8,
  },
  optionButtonMobile: {
    flex: 0,
    minHeight: 220,
    paddingVertical: 36,
    paddingHorizontal: 24,
  },
  optionButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  optionTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.white,
    textAlign: 'center',
  },
  optionSubtitle: {
    fontSize: 16,
    color: colors.white,
    opacity: 0.9,
    textAlign: 'center',
  },
});
