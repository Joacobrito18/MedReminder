export type NotificationKind = 'daily' | 'oneshot';

export type Medication = {
  id: string;
  name: string;
  dose?: string;
  time: string;
  notificationId?: string;
  notificationKind?: NotificationKind;
  lastTakenAt?: string;
  createdAt: string;
};

export type NewMedicationInput = {
  name: string;
  dose?: string;
  time: string;
  notificationId?: string;
  notificationKind?: NotificationKind;
};
