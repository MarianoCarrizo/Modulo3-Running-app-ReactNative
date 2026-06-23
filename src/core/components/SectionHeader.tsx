import { Text, StyleSheet, StyleProp, ViewStyle, View } from 'react-native';
import { colors, fontSizes } from '../theme';

interface SectionHeaderProps {
  title: string;
  style?: StyleProp<ViewStyle>;
}

export function SectionHeader({ title, style }: SectionHeaderProps) {
  return (
    <View style={style}>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.primary,
    fontSize: fontSizes.sm,
    fontWeight: '700',
  },
});
