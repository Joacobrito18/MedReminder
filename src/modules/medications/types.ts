export type NotificationKind = 'daily' | 'weekly' | 'oneshot';

export const ALL_DAYS: number[] = [0, 1, 2, 3, 4, 5, 6];

export type PharmacyLocation = {
  latitude: number;
  longitude: number;
  address?: string;
};

export type MedicationContact = {
  name: string;
  phone?: string;
};

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
  photoUri?: string;
  pharmacy?: PharmacyLocation;
  contact?: MedicationContact;
  calendarEventId?: string;
};

export type NewMedicationInput = {
  name: string;
  dose?: string;
  time: string;
  days: number[];
  notificationIds?: string[];
  notificationKind?: NotificationKind;
  photoUri?: string;
  pharmacy?: PharmacyLocation;
  contact?: MedicationContact;
  calendarEventId?: string;
};
