import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { AuthorCard } from '@/types/cards';
import { CardWrapper } from './CardWrapper';
import { CardLinks } from './CardLinks';
import { MarkdownText } from '@/components/MarkdownText';
import { SmartImage } from '@/components/SmartImage';
import { colors } from '@/constants/colors';
import palette from '@/constants/palette';
import { buildSefariaTopicUrl } from '@/utils/links';

interface AuthorCardViewProps {
  card: AuthorCard;
  onNextCard?: () => void;
}

// Map generation codes to readable text
function formatGeneration(gen: string | undefined): string | null {
  if (!gen) return null;

  const generationMap: Record<string, string> = {
    'T1': '1st Generation Tanna',
    'T2': '2nd Generation Tanna',
    'T3': '3rd Generation Tanna',
    'T4': '4th Generation Tanna',
    'T5': '5th Generation Tanna',
    'T6': '6th Generation Tanna',
    'A1': '1st Generation Amora',
    'A2': '2nd Generation Amora',
    'A3': '3rd Generation Amora',
    'A4': '4th Generation Amora',
    'A5': '5th Generation Amora',
    'A6': '6th Generation Amora',
    'A7': '7th Generation Amora',
    'A8': '8th Generation Amora',
    'PA1': '1st Gen. Palestinian Amora',
    'PA2': '2nd Gen. Palestinian Amora',
    'PA3': '3rd Gen. Palestinian Amora',
    'PA4': '4th Gen. Palestinian Amora',
    'PA5': '5th Gen. Palestinian Amora',
    'S': 'Savora',
    'G': 'Gaon',
    'R': 'Rishon',
    'AH': 'Acharon',
  };

  return generationMap[gen] ?? gen;
}

export function AuthorCardView({ card, onNextCard }: AuthorCardViewProps) {
  const generation = formatGeneration(card.generation);
  const accentColor = useMemo(() => palette.randomColor(), [card.id]);
  const typeLabel = card.displayType ?? 'Author';

  // Build metadata line
  const metaParts: string[] = [];
  if (generation) metaParts.push(generation);
  if (card.numSources && card.numSources > 0) {
    metaParts.push(`${card.numSources.toLocaleString()} sources on Sefaria`);
  }
  const metaLine = metaParts.join(' · ');
  const sefariaUrl = buildSefariaTopicUrl(card.slug);
  const links = [
    { label: 'Sefaria', url: sefariaUrl },
    ...(card.wikiLink ? [{ label: 'Wikipedia', url: card.wikiLink }] : []),
  ];

  return (
    <CardWrapper
      type={typeLabel}
      icon="account"
      accentColor={accentColor}
      onNextCard={onNextCard}
    >
      {/* Image with smart cropping */}
      {card.image && (
        <View style={styles.imageContainer}>
          <SmartImage
            uri={card.image.uri}
            width="100%"
            height={160}
            style={styles.image}
          />
          {card.image.caption && (
            <Text style={styles.imageCaption} numberOfLines={2}>
              {card.image.caption}
            </Text>
          )}
        </View>
      )}

      {/* Title */}
      <Text style={styles.title}>
        {card.title}
      </Text>

      {/* Metadata line */}
      {metaLine && (
        <Text style={styles.meta}>
          {metaLine}
        </Text>
      )}

      {/* Description with truncation */}
      <MarkdownText maxHeight={card.image ? 200 : 350}>{card.description}</MarkdownText>

      <CardLinks links={links} />
    </CardWrapper>
  );
}

const styles = StyleSheet.create({
  imageContainer: {
    marginBottom: 8,
  },
  image: {
    borderRadius: 4,
  },
  imageCaption: {
    fontSize: 11,
    color: colors.gray[500],
    marginTop: 6,
    fontStyle: 'italic',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.gray[900],
    marginTop: 28,
    marginBottom: 6,
  },
  meta: {
    fontSize: 14,
    color: colors.gray[500],
    marginBottom: 12,
  },
});
