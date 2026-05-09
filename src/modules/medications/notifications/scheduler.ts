import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { Medication, NewMedicationInput } from '@/modules/medications/types';

const ANDROID_CHANNEL_ID = 'med-reminders';

export const setupAndroidChannel = async (): Promise<void> => {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: 'Recordatorios de medicación',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    sound: 'default',
  });
};

export const requestPermissions = async (): Promise<boolean> => {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const next = await Notifications.requestPermissionsAsync();
  return next.granted;
};

const parseTime = (time: string): { hour: number; minute: number } => {
  const [hourStr, minuteStr] = time.split(':');
  return { hour: Number(hourStr), minute: Number(minuteStr) };
};

type SchedulableMed = Pick<Medication, 'name' | 'time' | 'dose'> | NewMedicationInput;

export const scheduleDaily = async (med: SchedulableMed): Promise<string> => {
  const { hour, minute } = parseTime(med.time);
  return Notifications.scheduleNotificationAsync({
    content: {
      title: 'Hora de tu medicación',
      body: med.dose ? `${med.name} — ${med.dose}` : med.name,
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: Platform.OS === 'android' ? ANDROID_CHANNEL_ID : undefined,
    },
  });
};

export const cancel = async (notificationId: string | undefined): Promise<void> => {
  if (!notificationId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {
    // Si la noti ya no existe, no es un error real.
  }
};
