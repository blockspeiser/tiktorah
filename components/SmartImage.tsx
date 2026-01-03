import React, { useState, useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Platform } from 'react-native';
import smartcrop from 'smartcrop';

interface SmartImageProps {
  uri: string;
  width: number | string;
  height: number;
  style?: object;
}

interface CropPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * SmartImage component that uses smartcrop.js to intelligently
 * position images for optimal cropping (faces, subjects, etc.)
 */
export function SmartImage({ uri, width, height, style }: SmartImageProps) {
  const [cropPosition, setCropPosition] = useState<CropPosition | null>(null);
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      // On native platforms, just use center crop
      setIsLoading(false);
      return;
    }

    // On web, use smartcrop to find the best crop position
    const img = new window.Image();
    img.crossOrigin = 'anonymous';

    img.onload = async () => {
      setImageSize({ width: img.width, height: img.height });

      try {
        // Calculate the crop dimensions based on the container aspect ratio
        const containerWidth = typeof width === 'number' ? width : 300;
        const aspectRatio = containerWidth / height;

        // Determine crop size that maintains aspect ratio
        let cropWidth: number;
        let cropHeight: number;

        if (img.width / img.height > aspectRatio) {
          // Image is wider than container aspect ratio
          cropHeight = img.height;
          cropWidth = cropHeight * aspectRatio;
        } else {
          // Image is taller than container aspect ratio
          cropWidth = img.width;
          cropHeight = cropWidth / aspectRatio;
        }

        const result = await smartcrop.crop(img, {
          width: Math.round(cropWidth),
          height: Math.round(cropHeight),
        });

        setCropPosition(result.topCrop);
      } catch (error) {
        console.warn('SmartCrop failed, using center crop:', error);
      }

      setIsLoading(false);
    };

    img.onerror = () => {
      console.warn('Failed to load image for smart cropping');
      setIsLoading(false);
    };

    img.src = uri;
  }, [uri, width, height]);

  // Calculate the transform to position the image correctly
  const getImageStyle = () => {
    if (!cropPosition || !imageSize) {
      // Fallback to center positioning
      return {
        width: '100%',
        height: '100%',
        objectFit: 'cover' as const,
        objectPosition: 'center' as const,
      };
    }

    // Calculate the percentage position for object-position
    // This positions the crop area in the center of the container
    const xPercent = (cropPosition.x + cropPosition.width / 2) / imageSize.width * 100;
    const yPercent = (cropPosition.y + cropPosition.height / 2) / imageSize.height * 100;

    return {
      width: '100%',
      height: '100%',
      objectFit: 'cover' as const,
      objectPosition: `${xPercent}% ${yPercent}%`,
    };
  };

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, { height }, style]}>
        <img
          src={uri}
          style={getImageStyle()}
          alt=""
        />
      </View>
    );
  }

  // Native fallback - use standard Image with cover
  return (
    <View style={[styles.container, { height }, style]}>
      <Image
        source={{ uri }}
        style={styles.nativeImage}
        resizeMode="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  nativeImage: {
    width: '100%',
    height: '100%',
  },
});
