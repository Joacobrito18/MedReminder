import { create } from 'zustand';

import {
  cancelMany,
  nextScheduledDate,
  scheduleForDays,
  scheduleOneShot,
} from '@/modules/medications/notifications/scheduler';
import {
  addMedication,
  getMedications,
  removeMedication,
  updateMedication,
} from '@/modules/medications/storage/medications-storage';
import { Medication, NewMedicationInput, NotificationKind } from '@/modules/medications/types';
import { wasTakenToday } from '@/shared/helpers/date';

const sortByTime = (list: Medication[]): Medication[] =>
  [...list].sort((a, b) => a.time.localeCompare(b.time));

/**
 * Restaura las notificaciones semanales de las medicaciones cuyo recordatorio
 * "one-shot" (programado al marcarlas como tomadas) ya quedó obsoleto.
 */
const reconcileNotifications = async (
  username: string,
  meds: Medication[],
): Promise<Medication[]> => {
  const result: Medication[] = [];
  for (const med of meds) {
    const isStaleOneShot =
      med.notificationKind === 'oneshot' && !wasTakenToday(med.lastTakenAt);
    if (!isStaleOneShot) {
      result.push(med);
      continue;
    }
    await cancelMany(med.notificationIds);
    let newIds: string[] = [];
    try {
      newIds = await scheduleForDays(med, med.days);
    } catch {
      newIds = [];
    }
    const updated = await updateMedication(username, med.id, {
      notificationIds: newIds,
      notificationKind: newIds.length > 0 ? 'weekly' : undefined,
    });
    result.push(updated ?? med);
  }
  return result;
};

type MedicationsState = {
  meds: Medication[];
  loading: boolean;
  username: string | null;
  load: (username: string | null) => Promise<void>;
  add: (input: NewMedicationInput) => Promise<Medication | null>;
  update: (
    id: string,
    patch: Partial<Omit<Medication, 'id' | 'createdAt'>>,
  ) => Promise<Medication | null>;
  remove: (medication: Medication) => Promise<void>;
  toggleTaken: (medication: Medication) => Promise<void>;
  reset: () => void;
};

export const useMedicationsStore = create<MedicationsState>((set, get) => ({
  meds: [],
  loading: true,
  username: null,

  load: async (username) => {
    if (!username) {
      set({ meds: [], loading: false, username: null });
      return;
    }
    set({ loading: true, username });
    const list = await getMedications(username);
    const reconciled = await reconcileNotifications(username, list);
    // Si el usuario cambió mientras cargábamos, descartamos este resultado.
    if (get().username !== username) return;
    set({ meds: sortByTime(reconciled), loading: false });
  },

  add: async (input) => {
    const { username, meds } = get();
    if (!username) return null;
    const med = await addMedication(username, input);
    set({ meds: sortByTime([...meds, med]) });
    return med;
  },

  update: async (id, patch) => {
    const { username, meds } = get();
    if (!username) return null;
    const updated = await updateMedication(username, id, patch);
    if (!updated) return null;
    set({ meds: sortByTime(meds.map((m) => (m.id === id ? updated : m))) });
    return updated;
  },

  remove: async (medication) => {
    const { username, meds } = get();
    if (!username) return;
    await cancelMany(medication.notificationIds);
    await removeMedication(username, medication.id);
    set({ meds: meds.filter((m) => m.id !== medication.id) });
  },

  toggleTaken: async (medication) => {
    const { username } = get();
    if (!username) return;
    const willBeTaken = !wasTakenToday(medication.lastTakenAt);

    await cancelMany(medication.notificationIds);
    let newIds: string[] = [];
    let newKind: NotificationKind | undefined;
    try {
      if (willBeTaken) {
        const id = await scheduleOneShot(
          medication,
          nextScheduledDate(medication.time, medication.days),
        );
        newIds = [id];
        newKind = 'oneshot';
      } else {
        newIds = await scheduleForDays(medication, medication.days);
        newKind = newIds.length > 0 ? 'weekly' : undefined;
      }
    } catch {
      newIds = [];
      newKind = undefined;
    }

    const updated = await updateMedication(username, medication.id, {
      lastTakenAt: willBeTaken ? new Date().toISOString() : undefined,
      notificationIds: newIds,
      notificationKind: newKind,
    });
    if (!updated) return;
    set({ meds: get().meds.map((m) => (m.id === updated.id ? updated : m)) });
  },

  reset: () => set({ meds: [], loading: false, username: null }),
}));

export const selectMeds = (state: MedicationsState): Medication[] => state.meds;
export const selectLoading = (state: MedicationsState): boolean => state.loading;
export const selectTakenCount = (state: MedicationsState): number =>
  state.meds.filter((m) => wasTakenToday(m.lastTakenAt)).length;
