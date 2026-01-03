import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View, Animated, Easing } from 'react-native';
import { Text } from 'react-native-paper';
import { colors } from '@/constants/colors';

interface SplashScreenProps {
  width?: number;
  height?: number;
}

export function SplashScreen({ width, height }: SplashScreenProps) {
  const containerStyle = width && height
    ? [styles.container, { width, height }]
    : styles.container;
  const rotation = useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => animation.stop();
  }, [rotation]);

  const rotate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={containerStyle}>
      <Animated.Image
        source={require('@/assets/splash-icon.png')}
        style={[styles.logo, { transform: [{ rotate }] }]}
        resizeMode="contain"
      />
      <Text style={styles.title}>TikTorah</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.hotPink,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.white,
    marginTop: 24,
    letterSpacing: 2,
  },
});
