import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, BackHandler } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { RootStackParamList } from '../../../navigation';
import { colors, fontSizes } from '../../../core/theme';
import { useRunStore } from '../../../core/store/run.store';

type Props = NativeStackScreenProps<RootStackParamList, 'Countdown'>;

export default function CountdownScreen({ navigation, route }: Props) {
  const { countdown } = route.params;
  const startRun = useRunStore((s) => s.startRun);
  const { t } = useTranslation();

  const [current, setCurrent] = useState(countdown > 0 ? countdown : 0);
  const [finished, setFinished] = useState(countdown <= 0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const handler = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => handler.remove();
  }, []);

  useEffect(() => {
    if (countdown <= 0) {
      startRun();
      navigation.replace('Tracking');
      return;
    }

    intervalRef.current = setInterval(() => {
      setCurrent((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          setFinished(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (finished && countdown > 0) {
      const timeout = setTimeout(() => {
        startRun();
        navigation.replace('Tracking');
      }, 600);
      return () => clearTimeout(timeout);
    }
  }, [finished]);

  return (
    <View style={styles.container}>
      <Text style={styles.number}>
        {finished ? t('run.go') : current}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  number: {
    color: colors.primary,
    fontSize: 140,
    fontWeight: 'bold',
  },
});
