import React from 'react';
import { View, Image, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, sizes } from '../theme';

interface UserAvatarProps {
  uri?: string | null;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

export function UserAvatar({ uri, size = sizes.avatar, style }: UserAvatarProps) {
  const circleStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  return (
    <View style={[styles.base, circleStyle, style]}>
      {uri ? (
        <Image source={{ uri }} style={[styles.image, circleStyle]} />
      ) : (
        <View style={[styles.placeholder, circleStyle]}>
          <Ionicons name="person" size={size * 0.4} color={colors.textMuted} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
  image: {
    resizeMode: 'cover',
  },
  placeholder: {
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
