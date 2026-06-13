import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../../core/theme';

export default function ChallengesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Challenges — TODO</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  text: { color: colors.text },
});
