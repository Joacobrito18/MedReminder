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

export const tomorrowAt = (time: string, baseDate: Date = new Date()): Date => {
  const { hour, minute } = parseTime(time);
  const target = new Date(baseDate);
  target.setDate(target.getDate() + 1);
  target.setHours(hour, minute, 0, 0);
  return target;
};

export const nextScheduledDate = (
  time: string,
  days: number[],
  from: Date = new Date(),
): Date => {
  if (days.length === 0) return tomorrowAt(time, from);
  const { hour, minute } = parseTime(time);
  for (let offset = 1; offset <= 7; offset += 1) {
    const candidate = new Date(from);
    candidate.setDate(candidate.getDate() + offset);
    candidate.setHours(hour, minute, 0, 0);
    if (days.includes(candidate.getDay())) return candidate;
  }
  return tomorrowAt(time, from);
};

type SchedulableMed = Pick<Medication, 'name' | 'time' | 'dose'> | NewMedicationInput;

const buildContent = (med: SchedulableMed) => ({
  title: 'Hora de tu medicación',
  body: med.dose ? `${med.name} — ${med.dose}` : med.name,
  sound: 'default',
});

const channelId = (): string | undefined =>
  Platform.OS === 'android' ? ANDROID_CHANNEL_ID : undefined;

export const scheduleWeekly = async (med: SchedulableMed, day: number): Promise<string> => {
  const { hour, minute } = parseTime(med.time);
  return Notifications.scheduleNotificationAsync({
    content: buildContent(med),
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: day + 1,
      hour,
      minute,
      channelId: channelId(),
    },
  });
};

export const scheduleForDays = async (
  med: SchedulableMed,
  days: number[],
): Promise<string[]> => {
  const ids: string[] = [];
  for (const day of days) {
    const id = await scheduleWeekly(med, day);
    ids.push(id);
  }
  return ids;
};

export const scheduleOneShot = async (med: SchedulableMed, date: Date): Promise<string> => {
  return Notifications.scheduleNotificationAsync({
    content: buildContent(med),
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date,
      channelId: channelId(),
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

export const cancelMany = async (ids: string[] | undefined): Promise<void> => {
  if (!ids || ids.length === 0) return;
  await Promise.all(ids.map(cancel));
};
