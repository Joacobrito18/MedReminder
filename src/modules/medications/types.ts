export type NotificationKind = 'daily' | 'weekly' | 'oneshot';

export const ALL_DAYS: number[] = [0, 1, 2, 3, 4, 5, 6];

export type Medication = {
  id: string;
  name: string;
  dose?: string;
  time: string;
  days: number[];
  notificationIds?: string[];
  notificationKind?: NotificationKind;
  lastTakenAt?: string;
  createdAt: string;
};

export type NewMedicationInput = {
  name: string;
  dose?: string;
  time: string;
  days: number[];
  notificationIds?: string[];
  notificationKind?: NotificationKind;
};
