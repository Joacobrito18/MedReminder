import { Medication } from '@/modules/medications/types';
import { wasTakenToday } from '@/shared/helpers/date';

export type MedicationStatus = 'taken' | 'due-soon' | 'pending';

const DUE_SOON_WINDOW_MINUTES = 60;

const minutesUntilTime = (time: string, now: Date): number => {
  const [hourStr, minuteStr] = time.split(':');
  const target = new Date(now);
  target.setHours(Number(hourStr), Number(minuteStr), 0, 0);
  const diffMs = target.getTime() - now.getTime();
  return Math.round(diffMs / 60000);
};

export const getMedicationStatus = (med: Medication, now: Date = new Date()): MedicationStatus => {
  if (wasTakenToday(med.lastTakenAt)) return 'taken';
  if (!med.days.includes(now.getDay())) return 'pending';
  const minutes = minutesUntilTime(med.time, now);
  if (minutes >= 0 && minutes <= DUE_SOON_WINDOW_MINUTES) return 'due-soon';
  return 'pending';
};

export const dueInLabel = (med: Medication, now: Date = new Date()): string => {
  const minutes = minutesUntilTime(med.time, now);
  if (minutes <= 0) return 'AHORA';
  if (minutes < 60) return `EN ${minutes} MIN`;
  const hours = Math.floor(minutes / 60);
  return `EN ${hours} H`;
};

export const formatTakenAt = (lastTakenAt: string | undefined): string => {
  if (!lastTakenAt) return '';
  const d = new Date(lastTakenAt);
  if (Number.isNaN(d.getTime())) return '';
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
};
