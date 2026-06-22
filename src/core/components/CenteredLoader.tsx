import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { colors } from '../theme';

interface CenteredLoaderProps {
  color?: string;
  size?: number | 'small' | 'large';
}

export function CenteredLoader({ color = colors.primary, size = 'large' }: CenteredLoaderProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator color={color} size={size} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
