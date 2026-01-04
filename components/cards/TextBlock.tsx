import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Text as PaperText } from 'react-native-paper';
import { colors } from '@/constants/colors';
import {
  ENGLISH_SERIF_FONT,
  HEBREW_SERIF_FONT,
} from '@/constants/fonts';
import { SEGMENT_MARKER_PREFIX } from '@/services/sefariaText';

interface TextBlockProps {
  reference?: string | null;
  text: string;
  accentColor?: string;
  maxHeight?: number;
  maxLines?: number;
  onPress?: () => void;
}

export const TEXT_BLOCK_LINE_HEIGHT = 30;
export const TEXT_BLOCK_REF_GAP = 8;
export const TEXT_BLOCK_VERTICAL_PADDING = 28;
export const TEXT_BLOCK_MARGIN_TOP = 16;

/**
 * Check if text is primarily Hebrew by looking for Hebrew characters.
 * Hebrew Unicode ranges: \u0590-\u05FF (Hebrew block), \uFB1D-\uFB4F (presentation forms)
 */
function isHebrewText(text: string): boolean {
  const hebrewPattern = /[\u0590-\u05FF\uFB1D-\uFB4F]/;
  // Check first 100 chars to determine language
  const sample = text.slice(0, 100);
  const hebrewChars = (sample.match(/[\u0590-\u05FF\uFB1D-\uFB4F]/g) || []).length;
  const latinChars = (sample.match(/[a-zA-Z]/g) || []).length;
  // If more Hebrew chars than Latin, consider it Hebrew
  return hebrewChars > latinChars && hebrewPattern.test(text);
}

/**
 * Parse text containing segment markers and return an array of parts.
 * Each part is either { type: 'text', content: string } or { type: 'marker', content: string }
 */
function parseTextWithMarkers(text: string): Array<{ type: 'text' | 'marker'; content: string }> {
  if (!text.includes(SEGMENT_MARKER_PREFIX)) {
    return [{ type: 'text', content: text }];
  }

  const parts: Array<{ type: 'text' | 'marker'; content: string }> = [];
  const segments = text.split(SEGMENT_MARKER_PREFIX);

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    if (segment.length === 0) continue;

    // Check if this segment starts with a marker like "(2)"
    const markerMatch = segment.match(/^(\(\d+\))\s*(.*)/);
    if (markerMatch) {
      const [, marker, rest] = markerMatch;
      parts.push({ type: 'marker', content: marker });
      if (rest.length > 0) {
        parts.push({ type: 'text', content: rest });
      }
    } else {
      parts.push({ type: 'text', content: segment });
    }
  }

  return parts;
}

export function TextBlock({ reference, text, accentColor, maxHeight, maxLines, onPress }: TextBlockProps) {
  const hasRef = Boolean(reference);
  const lineHeight = TEXT_BLOCK_LINE_HEIGHT;
  const refHeight = hasRef ? lineHeight + TEXT_BLOCK_REF_GAP : 0;
  const padding = TEXT_BLOCK_VERTICAL_PADDING;
  const available = maxHeight ? Math.max(0, maxHeight - refHeight - padding) : undefined;
  const computedLines = available ? Math.max(1, Math.floor(available / lineHeight)) : undefined;
  const lines = maxLines ?? computedLines;

  // Detect Hebrew text for RTL styling
  const isHebrew = useMemo(() => isHebrewText(text), [text]);

  const containerStyles = [
    styles.container,
    accentColor ? { borderLeftColor: accentColor } : null,
    maxHeight ? { maxHeight } : null,
  ];

  // Parse text with segment markers
  const textParts = useMemo(() => parseTextWithMarkers(text), [text]);

  // Get text style based on language
  const textStyle = isHebrew ? styles.textHebrew : styles.textEnglish;
  const markerStyle = isHebrew ? styles.segmentMarkerHebrew : styles.segmentMarkerEnglish;
  const referenceStyle = styles.referenceEnglish;

  // Render text content with styled markers (using RN Text for proper font support)
  const renderTextContent = () => (
    <Text style={textStyle} numberOfLines={lines} ellipsizeMode="tail">
      {textParts.map((part, index) => (
        part.type === 'marker' ? (
          <Text key={index} style={markerStyle}>{part.content} </Text>
        ) : (
          <Text key={index}>{part.content}</Text>
        )
      ))}
    </Text>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ([
          ...containerStyles,
          pressed ? styles.pressed : null,
        ])}
      >
        {hasRef && <PaperText style={referenceStyle}>{reference}</PaperText>}
        {renderTextContent()}
      </Pressable>
    );
  }

  return (
    <View style={containerStyles}>
      {hasRef && <PaperText style={referenceStyle}>{reference}</PaperText>}
      {renderTextContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: TEXT_BLOCK_MARGIN_TOP,
    padding: TEXT_BLOCK_VERTICAL_PADDING / 2,
    borderWidth: 1,
    borderLeftWidth: 6,
    borderColor: colors.gray[300],
    borderRadius: 6,
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.8,
  },
  referenceEnglish: {
    fontSize: 20,
    lineHeight: TEXT_BLOCK_LINE_HEIGHT,
    color: colors.gray[500],
    marginBottom: TEXT_BLOCK_REF_GAP,
    fontFamily: ENGLISH_SERIF_FONT,
    textAlign: 'left',
    writingDirection: 'ltr',
  },
  textEnglish: {
    fontSize: 22,
    lineHeight: TEXT_BLOCK_LINE_HEIGHT + 2,
    color: colors.gray[700],
    fontFamily: ENGLISH_SERIF_FONT,
    textAlign: 'left',
    writingDirection: 'ltr',
  },
  textHebrew: {
    fontSize: 24,
    lineHeight: TEXT_BLOCK_LINE_HEIGHT + 6,
    color: colors.gray[700],
    fontFamily: HEBREW_SERIF_FONT,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  segmentMarkerEnglish: {
    fontSize: 18,
    color: colors.gray[400],
    fontFamily: ENGLISH_SERIF_FONT,
    textAlign: 'left',
    writingDirection: 'ltr',
  },
  segmentMarkerHebrew: {
    fontSize: 18,
    color: colors.gray[400],
    fontFamily: HEBREW_SERIF_FONT,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});
