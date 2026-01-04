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
          style={styles.linkItem}
          onPress={() => openExternalLink(link.url)}
        >
          <Text style={styles.linkText}>{link.label}</Text>
          <MaterialCommunityIcons
            name="open-in-new"
            size={18}
            color={colors['sefaria-blue']}
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
    gap: 8,
    alignSelf: 'flex-start',
    marginTop: 0,
    marginBottom: 8,
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(24, 52, 93, 0.12)',
  },
  linkText: {
    fontSize: 14,
    color: colors['sefaria-blue'],
    fontWeight: '600',
  },
});
