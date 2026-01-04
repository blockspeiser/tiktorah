import React, { useState, useEffect } from 'react';
import { Linking, View, LayoutChangeEvent } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { colors } from '@/constants/colors';

interface MarkdownTextProps {
  children: string;
  maxHeight?: number;
}

export function MarkdownText({ children, maxHeight }: MarkdownTextProps) {
  const [displayText, setDisplayText] = useState(children);
  const [truncateRange, setTruncateRange] = useState<{
    low: number;
    high: number;
    current: number;
  } | null>(null);

  const handleLinkPress = (url: string) => {
    Linking.openURL(url);
    return false; // Prevent default navigation
  };

  useEffect(() => {
    setDisplayText(children);
    setTruncateRange(null);
  }, [children, maxHeight]);

  const handleLayout = (event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    if (!maxHeight) return;

    if (height <= maxHeight && !truncateRange) {
      return;
    }

    if (!truncateRange && height > maxHeight) {
      const initial = Math.max(0, Math.floor(children.length * 0.7));
      setTruncateRange({ low: 0, high: children.length, current: initial });
      setDisplayText(`${children.slice(0, initial).trimEnd()}...`);
      return;
    }

    if (!truncateRange) return;

    const { low, high, current } = truncateRange;
    if (high <= low + 1) {
      setDisplayText(`${children.slice(0, low).trimEnd()}...`);
      setTruncateRange(null);
      return;
    }

    if (height > maxHeight) {
      const nextHigh = Math.max(low + 1, current - 1);
      const next = Math.floor((low + nextHigh) / 2);
      setTruncateRange({ low, high: nextHigh, current: next });
      setDisplayText(`${children.slice(0, next).trimEnd()}...`);
      return;
    }

    const nextLow = current;
    const next = Math.floor((nextLow + high) / 2);
    setTruncateRange({ low: nextLow, high, current: next });
    setDisplayText(`${children.slice(0, next).trimEnd()}...`);
  };

  return (
    <View>
      <View onLayout={handleLayout}>
        <Markdown
          style={{
            body: {
              fontSize: 20,
              lineHeight: 30,
              color: colors.gray[700],
            },
            paragraph: {
              marginTop: 0,
              marginBottom: 6,
            },
            link: {
              color: colors['sefaria-blue'],
              textDecorationLine: 'underline',
            },
            strong: {
              fontWeight: 'bold',
            },
            em: {
              fontStyle: 'italic',
            },
            heading1: {
              fontSize: 20,
              fontWeight: 'bold',
              color: colors.gray[900],
              marginBottom: 8,
            },
            heading2: {
              fontSize: 18,
              fontWeight: 'bold',
              color: colors.gray[900],
              marginBottom: 6,
            },
            heading3: {
              fontSize: 16,
              fontWeight: 'bold',
              color: colors.gray[900],
              marginBottom: 4,
            },
            bullet_list: {
              marginBottom: 12,
            },
            ordered_list: {
              marginBottom: 12,
            },
            list_item: {
              marginBottom: 4,
            },
            blockquote: {
              backgroundColor: colors.gray[100],
              borderLeftWidth: 3,
              borderLeftColor: colors.gray[300],
              paddingLeft: 12,
              paddingVertical: 8,
              marginBottom: 12,
            },
            code_inline: {
              backgroundColor: colors.gray[100],
              paddingHorizontal: 4,
              paddingVertical: 2,
              borderRadius: 3,
              fontFamily: 'monospace',
              fontSize: 14,
            },
            fence: {
              backgroundColor: colors.gray[100],
              padding: 12,
              borderRadius: 4,
              fontFamily: 'monospace',
              fontSize: 14,
              marginBottom: 12,
            },
          }}
          onLinkPress={handleLinkPress}
        >
          {displayText}
        </Markdown>
      </View>
    </View>
  );
}
