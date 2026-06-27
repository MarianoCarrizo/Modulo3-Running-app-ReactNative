import { TouchableOpacity, View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { colors, spacing, fontSizes } from '../theme';

interface RadioButtonProps {
  selected: boolean;
  onPress: () => void;
  label: string;
  style?: StyleProp<ViewStyle>;
}

export function RadioButton({ selected, onPress, label, style }: RadioButtonProps) {
  return (
    <TouchableOpacity style={[styles.option, style]} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.outer, selected && styles.outerSelected]}>
        {selected && <View style={styles.inner} />}
      </View>
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  outer: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.textMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  outerSelected: {
    borderColor: colors.primary,
  },
  inner: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  label: {
    color: colors.text,
    fontSize: fontSizes.md,
  },
});
