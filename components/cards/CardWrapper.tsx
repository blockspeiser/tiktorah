import React, { ReactNode } from 'react';
import { StyleSheet, View, Platform, Pressable } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';

export const CARD_ACCENT_HEIGHT = 24;
export const CARD_PADDING = 28;
export const CARD_PADDING_TOP = 28;
export const CARD_PADDING_BOTTOM = 60;

interface CardWrapperProps {
  children: ReactNode;
  type: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  accentColor: string;
  iconColor?: string;
  onNextCard?: () => void;
}

export function CardWrapper({ children, type, icon, accentColor, iconColor, onNextCard }: CardWrapperProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.accentBar, { backgroundColor: accentColor }]} />
      <View style={styles.cardContent}>
        <View style={styles.contentWrapper}>
          {/* Type label with icon */}
          <View style={styles.typeRow}>
            <MaterialCommunityIcons
              name={icon}
              size={32}
              color={iconColor ?? accentColor}
            />
            <Text style={[styles.typeLabel, { color: accentColor }]}>
              {type.toUpperCase()}
            </Text>
          </View>

          {/* Card content */}
          <View style={styles.content}>
            {children}
          </View>
        </View>

        {/* Web-only next button */}
        {Platform.OS === 'web' && onNextCard && (
          <Pressable style={styles.nextButton} onPress={onNextCard}>
            <MaterialCommunityIcons
              name="chevron-down"
              size={32}
              color={colors.gray[400]}
            />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  accentBar: {
    height: CARD_ACCENT_HEIGHT,
    width: '100%',
  },
  cardContent: {
    flex: 1,
    padding: CARD_PADDING,
    paddingTop: CARD_PADDING_TOP,
    paddingBottom: CARD_PADDING_BOTTOM,
  },
  contentWrapper: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  typeLabel: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 2,
  },
  content: {
    overflow: 'hidden',
  },
  nextButton: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingVertical: 8,
  },
});
