import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { AuthorCard } from '@/types/cards';
import { CardWrapper } from './CardWrapper';
import { colors } from '@/constants/colors';

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

  // Build metadata line
  const metaParts: string[] = [];
  if (generation) metaParts.push(generation);
  if (card.numSources && card.numSources > 0) {
    metaParts.push(`${card.numSources.toLocaleString()} sources`);
  }
  const metaLine = metaParts.join(' · ');

  return (
    <CardWrapper type="Author" icon="account" onNextCard={onNextCard}>
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

      {/* Description */}
      {card.description ? (
        <Text style={styles.description}>
          {card.description}
        </Text>
      ) : (
        <Text style={styles.descriptionEmpty}>
          A scholar in the Jewish tradition.
        </Text>
      )}
    </CardWrapper>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: 12,
  },
  meta: {
    fontSize: 14,
    color: colors.gray[500],
    marginBottom: 24,
  },
  description: {
    fontSize: 16,
    lineHeight: 26,
    color: colors.gray[700],
  },
  descriptionEmpty: {
    fontSize: 16,
    lineHeight: 26,
    color: colors.gray[500],
    fontStyle: 'italic',
  },
});
