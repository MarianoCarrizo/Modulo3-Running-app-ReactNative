import './src/core/i18n';
import { LogBox } from 'react-native';
import React from 'react';

LogBox.ignoreLogs([
  'InteractionManager has been deprecated',
]);
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import RootNavigator from './src/navigation';
import { useAuthListener } from './src/core/hooks/useAuthListener';

function AppContent() {
  useAuthListener();
  return (
    <>
      <StatusBar style="light" />
      <RootNavigator />
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
