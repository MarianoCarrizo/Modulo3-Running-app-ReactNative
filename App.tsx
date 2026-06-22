import './src/features/run/tasks/locationTask';
import './src/core/i18n';
import { LogBox } from 'react-native';
import React, { useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import RootNavigator from './src/navigation';
import { useAuthListener } from './src/core/hooks/useAuthListener';
import { loadCheckpoint } from './src/features/run/services/checkpoint';
import RunRecoveryDialog from './src/features/run/components/RunRecoveryDialog';
import { RunCheckpoint } from './src/core/types';
import { useRunStore } from './src/core/store/run.store';

LogBox.ignoreLogs(['InteractionManager has been deprecated']);

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

function AppContent() {
  useAuthListener();
  const pauseRun = useRunStore((s) => s.pauseRun);
  const resumeRun = useRunStore((s) => s.resumeRun);
  const loadConfig = useRunStore((s) => s.loadConfig);
  const [checkpoint, setCheckpoint] = useState<RunCheckpoint | null>(null);
  const [checkpointChecked, setCheckpointChecked] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  useEffect(() => {
    loadCheckpoint().then((cp) => {
      setCheckpoint(cp);
      setCheckpointChecked(true);
    }).catch(() => {
      setCheckpointChecked(true);
    });
  }, []);

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const actionId = response.actionIdentifier;
      if (actionId === 'pause') pauseRun();
      else if (actionId === 'resume') resumeRun();
    });
    return () => subscription.remove();
  }, [pauseRun, resumeRun]);

  return (
    <>
      <StatusBar style="light" />
      <RootNavigator />
      {checkpointChecked && checkpoint && (
        <RunRecoveryDialog
          checkpoint={checkpoint}
          onDismiss={() => setCheckpoint(null)}
        />
      )}
    </>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppContent />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
