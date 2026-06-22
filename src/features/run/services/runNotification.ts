import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const RUN_NOTIFICATION_ID = 'run-active';
const RUN_CHANNEL_ID = 'run-live-v2';
const RUN_CATEGORY_ID = 'run';

export const initNotifications = async (): Promise<void> => {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(RUN_CHANNEL_ID, {
      name: 'Carrera en curso',
      importance: Notifications.AndroidImportance.LOW,
      showBadge: false,
      enableVibrate: false,
      sound: null,
    });
  }
  await Notifications.setNotificationCategoryAsync(RUN_CATEGORY_ID, [
    { identifier: 'pause', buttonTitle: 'Pausar' },
    { identifier: 'resume', buttonTitle: 'Reanudar' },
  ]);
};

export const showRunNotification = async (
  distance: string,
  pace: string,
  time: string
): Promise<void> => {
  await Notifications.scheduleNotificationAsync({
    identifier: RUN_NOTIFICATION_ID,
    content: {
      title: 'Carrera en curso',
      body: `${distance} · ${pace} · ${time}`,
      categoryIdentifier: RUN_CATEGORY_ID,
      sticky: true,
      data: {},
    },
    trigger: null,
  });
};

export const dismissRunNotification = async (): Promise<void> => {
  await Notifications.dismissNotificationAsync(RUN_NOTIFICATION_ID);
};
