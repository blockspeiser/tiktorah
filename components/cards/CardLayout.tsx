import React, { ReactNode, useMemo, useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { CARD_ACCENT_HEIGHT, CARD_PADDING_BOTTOM, CARD_PADDING_TOP } from './CardWrapper';

interface CardLayoutProps {
  cardHeight?: number;
  gap?: number;
  minExtraHeight?: number;
  forceExtra?: boolean;
  header?: ReactNode;
  description?: (maxHeight?: number) => ReactNode;
  extra?: (maxHeight?: number) => ReactNode;
  footer?: ReactNode;
}

function countGaps(hasHeader: boolean, hasDescription: boolean, hasExtra: boolean, hasFooter: boolean) {
  let gaps = 0;
  if (hasHeader && (hasDescription || hasExtra)) gaps += 1;
  if (hasDescription && hasExtra) gaps += 1;
  if ((hasDescription || hasExtra) && hasFooter) gaps += 1;
  return gaps;
}

export function CardLayout({
  cardHeight,
  gap = 8,
  minExtraHeight = 140,
  forceExtra = false,
  header,
  description,
  extra,
  footer,
}: CardLayoutProps) {
  const { height: screenHeight } = useWindowDimensions();
  const [headerHeight, setHeaderHeight] = useState(0);
  const [footerHeight, setFooterHeight] = useState(0);
  const [descriptionNaturalHeight, setDescriptionNaturalHeight] = useState(0);

  const hasHeader = Boolean(header);
  const hasDescription = Boolean(description);
  const hasExtra = Boolean(extra);
  const hasFooter = Boolean(footer);

  const contentHeight = useMemo(() => {
    const baseHeight = cardHeight ?? screenHeight;
    return Math.max(0, baseHeight - CARD_ACCENT_HEIGHT - CARD_PADDING_TOP - CARD_PADDING_BOTTOM);
  }, [cardHeight, screenHeight]);

  const baseHeight = Math.max(0, contentHeight - headerHeight - footerHeight);
  const gapsWithExtra = countGaps(hasHeader, hasDescription, hasExtra, hasFooter) * gap;

  const shouldShowExtra = useMemo(() => {
    if (!hasExtra) return false;
    if (forceExtra) return true;
    if (!hasDescription) return true;
    if (descriptionNaturalHeight === 0) return true;
    const availableForDesc = baseHeight - gapsWithExtra - minExtraHeight;
    return descriptionNaturalHeight <= availableForDesc;
  }, [baseHeight, descriptionNaturalHeight, forceExtra, gapsWithExtra, hasDescription, hasExtra, minExtraHeight]);

  const gaps = countGaps(hasHeader, hasDescription, shouldShowExtra, hasFooter) * gap;
  const available = Math.max(0, baseHeight - gaps);

  const maxDescriptionHeight = useMemo(() => {
    if (!hasDescription) return undefined;
    if (!shouldShowExtra) return available;
    return Math.max(0, available - minExtraHeight - gap);
  }, [available, gap, hasDescription, minExtraHeight, shouldShowExtra]);

  const maxExtraHeight = useMemo(() => {
    if (!shouldShowExtra) return undefined;
    if (!hasDescription) return available;
    const descriptionHeight = Math.min(descriptionNaturalHeight || 0, maxDescriptionHeight ?? 0);
    return Math.max(0, available - descriptionHeight - gap);
  }, [available, descriptionNaturalHeight, gap, hasDescription, maxDescriptionHeight, shouldShowExtra]);

  return (
    <View style={styles.container}>
      {hasHeader && (
        <View onLayout={(event) => setHeaderHeight(event.nativeEvent.layout.height)}>
          {header}
        </View>
      )}

      {hasDescription && (
        <View style={hasHeader ? { marginTop: gap } : undefined}>
          {description?.(maxDescriptionHeight)}
        </View>
      )}

      {shouldShowExtra && (
        <View style={{ marginTop: hasDescription || hasHeader ? gap : 0 }}>
          {extra?.(maxExtraHeight)}
        </View>
      )}

      {hasFooter && (
        <View
          style={{ marginTop: hasDescription || shouldShowExtra || hasHeader ? gap : 0 }}
          onLayout={(event) => setFooterHeight(event.nativeEvent.layout.height)}
        >
          {footer}
        </View>
      )}

      {hasDescription && (
        <View style={styles.measure}>
          <View onLayout={(event) => setDescriptionNaturalHeight(event.nativeEvent.layout.height)}>
            {description?.(undefined)}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  measure: {
    position: 'absolute',
    left: 0,
    right: 0,
    opacity: 0,
    pointerEvents: 'none',
  },
});
