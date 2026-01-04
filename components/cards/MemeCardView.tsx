import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { Image, Linking, Modal, PanResponder, Platform, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Avatar, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MemeFeedCard } from '@/types/cards';
import { CardWrapper, CARD_ACCENT_HEIGHT, CARD_PADDING_BOTTOM, CARD_PADDING_TOP } from './CardWrapper';
import { CardLayout } from './CardLayout';
import { colors } from '@/constants/colors';
import palette from '@/constants/palette';
import { sanitizeText } from '@/services/sefariaText';
import { TextBlock, TEXT_BLOCK_LINE_HEIGHT, TEXT_BLOCK_MARGIN_TOP, TEXT_BLOCK_REF_GAP, TEXT_BLOCK_VERTICAL_PADDING } from './TextBlock';
import { buildSefariaRefUrl } from '@/utils/links';

interface MemeCardViewProps {
  card: MemeFeedCard;
  onNextCard?: () => void;
  cardHeight?: number;
}

export function MemeCardView({ card, onNextCard, cardHeight }: MemeCardViewProps) {
  const { height: screenHeight } = useWindowDimensions();
  const accentColor = palette.categoryColor(card.citationCategory || card.title);
  const title = card.caption?.trim() || card.title || 'Meme';
  const ownerName = card.ownerDisplayName ?? 'Anonymous';
  const ownerInitial = ownerName?.[0]?.toUpperCase() || 'U';
  const [imageAspectRatio, setImageAspectRatio] = useState<number | null>(null);
  const [imageWidth, setImageWidth] = useState<number | null>(null);
  const [isImageOpen, setIsImageOpen] = useState(false);
  const citationText = useMemo(() => {
    if (!card.citationText) return null;
    return sanitizeText(card.citationText);
  }, [card.citationText]);
  const sourceDomain = useMemo(() => {
    if (!card.memeLink) return null;
    try {
      const url = new URL(card.memeLink);
      return url.hostname.replace(/^www\./, '');
    } catch {
      return null;
    }
  }, [card.memeLink]);

  const openLink = (url: string) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }
    Linking.openURL(url);
  };

  const contentHeight = useMemo(() => {
    const baseHeight = cardHeight ?? screenHeight;
    return Math.max(0, baseHeight - CARD_ACCENT_HEIGHT - CARD_PADDING_TOP - CARD_PADDING_BOTTOM);
  }, [cardHeight, screenHeight]);

  useEffect(() => {
    if (!card.imageUrl) {
      setImageAspectRatio(null);
      return;
    }
    let active = true;
    Image.getSize(
      card.imageUrl,
      (width, height) => {
        if (active && width && height) {
          setImageAspectRatio(width / height);
        }
      },
      () => {
        if (active) setImageAspectRatio(null);
      }
    );
    return () => {
      active = false;
    };
  }, [card.imageUrl]);

  const handleImageLayout = useCallback((event: any) => {
    const width = event?.nativeEvent?.layout?.width;
    if (typeof width === 'number' && width > 0) {
      setImageWidth(width);
    }
  }, []);

  const swipeDismissResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 12,
    onPanResponderRelease: (_, gesture) => {
      if (Math.abs(gesture.dy) > 80) {
        setIsImageOpen(false);
      }
    },
  }), []);

  const renderDescription = (maxHeight?: number) => {
    const metaHeight = 52;
    const availableHeight = maxHeight ?? Math.max(0, contentHeight - 8);
    const imageMaxHeight = card.imageUrl ? Math.max(0, availableHeight - metaHeight) : 0;
    const naturalImageHeight = (card.imageUrl && imageAspectRatio && imageWidth)
      ? imageWidth / imageAspectRatio
      : undefined;
    let scaledWidth = imageWidth ?? 0;
    let scaledHeight = naturalImageHeight ?? 0;
    if (naturalImageHeight && imageMaxHeight > 0 && naturalImageHeight > imageMaxHeight) {
      const scale = imageMaxHeight / naturalImageHeight;
      scaledWidth = (imageWidth ?? 0) * scale;
      scaledHeight = naturalImageHeight * scale;
    }
    const leftOffset = imageWidth && scaledWidth
      ? Math.max(0, (imageWidth - scaledWidth) / 2)
      : 0;
    return (
      <View style={[
        styles.metaBlock,
        maxHeight ? styles.metaBlockClamped : null,
        maxHeight ? { maxHeight } : null,
      ]}>
        {card.imageUrl ? (
          <View onLayout={handleImageLayout} style={styles.imageContainer}>
            {scaledWidth > 0 && scaledHeight > 0 ? (
              <Pressable onPress={() => setIsImageOpen(true)}>
                <Image
                  source={{ uri: card.imageUrl }}
                  style={[styles.image, { width: scaledWidth, height: scaledHeight }, imageMaxHeight ? { maxHeight: imageMaxHeight } : null]}
                  resizeMode="contain"
                />
              </Pressable>
            ) : null}
          </View>
        ) : null}
        <View style={leftOffset ? { paddingLeft: leftOffset } : undefined}>
          <Text style={styles.caption} numberOfLines={1}>{title}</Text>
          <View style={styles.byline}>
            <Pressable
              disabled={!card.ownerProfileLink}
              onPress={() => card.ownerProfileLink && openLink(card.ownerProfileLink)}
              style={styles.bylineUser}
            >
              {card.ownerPhotoURL ? (
                <Avatar.Image size={24} source={{ uri: card.ownerPhotoURL }} />
              ) : (
                <Avatar.Text size={24} label={ownerInitial} />
              )}
              <Text style={[styles.bylineLink, !card.ownerProfileLink && styles.bylineText]} numberOfLines={1}>
                {ownerName}
              </Text>
            </Pressable>
            {sourceDomain && card.memeLink ? (
              <Text style={styles.bylineText}>
                {' '}from{' '}
                <Text style={styles.bylineLink} onPress={() => openLink(card.memeLink!)}>
                  {sourceDomain}
                </Text>
              </Text>
            ) : null}
          </View>
        </View>
      </View>
    );
  };

  const renderCitation = (maxHeight?: number) => {
    if (!citationText) return null;
    const handlePress = () => {
      if (!card.citation) return;
      const url = buildSefariaRefUrl(card.citation);
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.open(url, '_blank', 'noopener,noreferrer');
        return;
      }
      Linking.openURL(url);
    };
    return (
      <TextBlock
        reference={card.citation ?? null}
        text={citationText}
        accentColor={accentColor}
        maxHeight={maxHeight}
        maxLines={3}
        onPress={card.citation ? handlePress : undefined}
      />
    );
  };

  return (
    <CardWrapper
      type="Meme"
      icon="image"
      accentColor={accentColor}
      iconColor={accentColor}
      onNextCard={onNextCard}
    >
      <CardLayout
        cardHeight={cardHeight}
        minExtraHeight={
          TEXT_BLOCK_MARGIN_TOP
          + TEXT_BLOCK_VERTICAL_PADDING
          + (TEXT_BLOCK_LINE_HEIGHT * 3)
          + (card.citation ? TEXT_BLOCK_LINE_HEIGHT + TEXT_BLOCK_REF_GAP : 0)
        }
        forceExtra={Boolean(citationText)}
        description={renderDescription}
        extra={citationText ? renderCitation : undefined}
        footer={undefined}
      />
      <Modal visible={isImageOpen} transparent animationType="fade" onRequestClose={() => setIsImageOpen(false)}>
        <View style={styles.modalOverlay} {...swipeDismissResponder.panHandlers}>
          <Pressable style={styles.closeButton} onPress={() => setIsImageOpen(false)}>
            <MaterialCommunityIcons name="close" size={28} color={colors.white} />
          </Pressable>
          <View style={styles.modalImageWrap}>
            {card.imageUrl ? (
              <Image source={{ uri: card.imageUrl }} style={styles.modalImage} resizeMode="contain" />
            ) : null}
          </View>
        </View>
      </Modal>
    </CardWrapper>
  );
}

const styles = StyleSheet.create({
  image: {
    maxWidth: '100%',
    backgroundColor: colors.gray[100],
    borderRadius: 10,
  },
  imageContainer: {
    width: '100%',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImageWrap: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: 24,
    right: 24,
    zIndex: 2,
    padding: 8,
  },
  metaBlock: {
    gap: 6,
  },
  metaBlockClamped: {
    overflow: 'hidden',
  },
  caption: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray[900],
  },
  byline: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 6,
  },
  bylineUser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bylineText: {
    fontSize: 14,
    color: colors.gray[600],
  },
  bylineLink: {
    fontSize: 14,
    color: colors['sefaria-blue'],
    fontWeight: '600',
  },
});
