import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';

export function SwipeHint() {
  return (
    <View style={styles.container}>
      <MaterialCommunityIcons
        name="chevron-up"
        size={64}
        color={colors.gray[400]}
      />
      <Text style={styles.text}>Swipe for more</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  text: {
    fontSize: 22,
    color: colors.gray[400],
    fontWeight: '500',
    marginTop: -12,
  },
});
