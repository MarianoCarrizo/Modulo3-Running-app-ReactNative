import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../core/store/auth.store';
import { colors } from '../core/theme';
import DrawerContent from './DrawerContent';

import AuthScreen from '../features/auth/screens/AuthScreen';
import OnboardingScreen from '../features/onboarding/screens/OnboardingScreen';
import QuickStartScreen from '../features/run/screens/QuickStartScreen';
import HistoryScreen from '../features/history/screens/HistoryScreen';
import StatsScreen from '../features/stats/screens/StatsScreen';
import LeaderboardScreen from '../features/leaderboard/screens/LeaderboardScreen';
import ChallengesScreen from '../features/challenges/screens/ChallengesScreen';
import ProfileScreen from '../features/profile/screens/ProfileScreen';
import RunnerProfileScreen from '../features/profile/screens/RunnerProfileScreen';
import SettingsScreen from '../features/settings/screens/SettingsScreen';
import CountdownScreen from '../features/run/screens/CountdownScreen';
import TrackingScreen from '../features/run/screens/TrackingScreen';
import RunDetailScreen from '../features/run/screens/RunDetailScreen';
import { RunConfig } from '../core/types';

export type RootStackParamList = {
  Auth: undefined;
  Onboarding: undefined;
  Main: undefined;
  RunDetail: { runId: string };
  Tracking: undefined;
  Countdown: { countdown: number; config: RunConfig; goalDistance: number };
  Settings: undefined;
  Language: undefined;
  RunnerProfile: { uid: string };
};

export type MainDrawerParamList = {
  Carrera: undefined;
  Actividad: undefined;
  Estadísticas: undefined;
  TablaLideres: undefined;
  Desafios: undefined;
  Profile: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Drawer = createDrawerNavigator<MainDrawerParamList>();

function MainDrawer() {
  const { t } = useTranslation();
  return (
    <Drawer.Navigator
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: 'bold', fontSize: 20 },
        drawerStyle: { backgroundColor: colors.background, width: '75%' },
        drawerType: 'front',
        overlayColor: colors.modalScrim.medium,
      }}
    >
      <Drawer.Screen name="Carrera"       component={QuickStartScreen}  options={{ title: t('drawer.run') }} />
      <Drawer.Screen name="Actividad"     component={HistoryScreen}     options={{ title: t('drawer.activity') }} />
      <Drawer.Screen name="Estadísticas"  component={StatsScreen}       options={{ title: t('drawer.stats') }} />
      <Drawer.Screen name="TablaLideres"  component={LeaderboardScreen} options={{ title: t('drawer.leaderboard') }} />
      <Drawer.Screen name="Desafios"      component={ChallengesScreen}  options={{ title: t('drawer.challenges') }} />
      <Drawer.Screen name="Profile"       component={ProfileScreen}     options={{ title: 'Perfil', drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="Settings"      component={SettingsScreen}    options={{ title: t('drawer.settings'), drawerItemStyle: { display: 'none' } }} />
    </Drawer.Navigator>
  );
}

function SplashScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

export default function RootNavigator() {
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);

  if (isLoading) return <SplashScreen />;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user == null ? (
          <Stack.Screen name="Auth" component={AuthScreen} />
        ) : !user.onboardingCompleted ? (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : (
          <>
            <Stack.Screen name="Main" component={MainDrawer} />
            <Stack.Screen name="RunnerProfile" component={RunnerProfileScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Countdown" component={CountdownScreen} options={{ headerShown: false, gestureEnabled: false }} />
            <Stack.Screen name="Tracking" component={TrackingScreen} options={{ headerShown: false, gestureEnabled: false }} />
            <Stack.Screen name="RunDetail" component={RunDetailScreen} options={{ headerShown: false }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
