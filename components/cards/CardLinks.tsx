import React from 'react';
import { StyleSheet, View, Pressable, Platform, Linking } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';

interface CardLink {
  label: string;
  url: string;
}

interface CardLinksProps {
  links: CardLink[];
}

function openExternalLink(url: string) {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
    return;
  }

  Linking.openURL(url);
}

export function CardLinks({ links }: CardLinksProps) {
  if (!links.length) return null;

  return (
    <View style={styles.linksContainer}>
      {links.map(link => (
        <Pressable
          key={link.label}
          style={styles.linkButton}
          onPress={() => openExternalLink(link.url)}
        >
          <Text style={styles.linkText}>{link.label}</Text>
          <MaterialCommunityIcons
            name="open-in-new"
            size={18}
            color={colors.white}
          />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  linksContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    flexWrap: 'wrap',
    gap: 12,
    alignSelf: 'flex-start',
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 0,
    borderColor: 'transparent',
    backgroundColor: colors['sefaria-blue'],
  },
  linkText: {
    fontSize: 15,
    color: colors.white,
    fontWeight: '500',
  },
});
