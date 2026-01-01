import React, { ReactNode } from 'react';
import { StyleSheet, View, Platform, Pressable } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';

interface CardWrapperProps {
  children: ReactNode;
  type: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  onNextCard?: () => void;
}

export function CardWrapper({ children, type, icon, onNextCard }: CardWrapperProps) {
  const theme = useTheme();

  return (
    <View style={styles.cardContent}>
      {/* Type label with icon */}
      <View style={styles.typeRow}>
        <MaterialCommunityIcons
          name={icon}
          size={14}
          color={colors.gray[500]}
        />
        <Text style={styles.typeLabel}>
          {type.toUpperCase()}
        </Text>
      </View>

      {/* Card content */}
      <View style={styles.content}>
        {children}
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
  );
}

const styles = StyleSheet.create({
  cardContent: {
    flex: 1,
    padding: 28,
    paddingTop: 24,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
  },
  typeLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    color: colors.gray[500],
  },
  content: {
    flex: 1,
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
