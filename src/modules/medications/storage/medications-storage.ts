import AsyncStorage from '@react-native-async-storage/async-storage';

import { Medication, NewMedicationInput } from '@/modules/medications/types';
import { generateId } from '@/shared/helpers/generate-id';

const KEY_PREFIX = '@medreminder:meds:';

const keyFor = (username: string): string => `${KEY_PREFIX}${username}`;

export const getMedications = async (username: string): Promise<Medication[]> => {
  const raw = await AsyncStorage.getItem(keyFor(username));
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Medication[]) : [];
  } catch {
    return [];
  }
};

const writeMedications = async (username: string, meds: Medication[]): Promise<void> => {
  await AsyncStorage.setItem(keyFor(username), JSON.stringify(meds));
};

export const addMedication = async (
  username: string,
  input: NewMedicationInput,
): Promise<Medication> => {
  const meds = await getMedications(username);
  const med: Medication = {
    id: generateId(),
    name: input.name,
    dose: input.dose,
    time: input.time,
    notificationId: input.notificationId,
    notificationKind: input.notificationKind,
    createdAt: new Date().toISOString(),
  };
  await writeMedications(username, [...meds, med]);
  return med;
};

export const removeMedication = async (username: string, id: string): Promise<void> => {
  const meds = await getMedications(username);
  await writeMedications(
    username,
    meds.filter((m) => m.id !== id),
  );
};

export const updateMedication = async (
  username: string,
  id: string,
  patch: Partial<Omit<Medication, 'id' | 'createdAt'>>,
): Promise<Medication | null> => {
  const meds = await getMedications(username);
  const idx = meds.findIndex((m) => m.id === id);
  if (idx === -1) return null;
  const updated: Medication = { ...meds[idx], ...patch };
  const next = [...meds];
  next[idx] = updated;
  await writeMedications(username, next);
  return updated;
};

export const markMedicationTaken = async (
  username: string,
  id: string,
): Promise<Medication | null> =>
  updateMedication(username, id, { lastTakenAt: new Date().toISOString() });

export const findMedication = async (
  username: string,
  id: string,
): Promise<Medication | null> => {
  const meds = await getMedications(username);
  return meds.find((m) => m.id === id) ?? null;
};
