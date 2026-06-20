import { create } from 'zustand';

import { MedicationContact, PharmacyLocation } from '@/modules/medications/types';

/**
 * Estado temporal de los "Adjuntos y recordatorio" mientras se crea o edita una
 * medicación. Vive en un store aparte para que el formulario principal y la
 * pantalla de adjuntos compartan los datos sin perderlos al navegar entre ellas.
 */
export type DraftExtras = {
  photoUri?: string;
  pharmacy?: PharmacyLocation;
  contact?: MedicationContact;
  calendarEventId?: string;
};

const EMPTY: DraftExtras = {
  photoUri: undefined,
  pharmacy: undefined,
  contact: undefined,
  calendarEventId: undefined,
};

type MedicationDraftState = DraftExtras & {
  init: (extras: DraftExtras) => void;
  setPhotoUri: (uri: string | undefined) => void;
  setPharmacy: (pharmacy: PharmacyLocation | undefined) => void;
  setContact: (contact: MedicationContact | undefined) => void;
  setCalendarEventId: (id: string | undefined) => void;
  reset: () => void;
};

export const useMedicationDraftStore = create<MedicationDraftState>((set) => ({
  ...EMPTY,
  init: (extras) => set({ ...EMPTY, ...extras }),
  setPhotoUri: (photoUri) => set({ photoUri }),
  setPharmacy: (pharmacy) => set({ pharmacy }),
  setContact: (contact) => set({ contact }),
  setCalendarEventId: (calendarEventId) => set({ calendarEventId }),
  reset: () => set({ ...EMPTY }),
}));

export const selectHasAnyExtra = (state: MedicationDraftState): boolean =>
  Boolean(state.photoUri || state.pharmacy || state.contact || state.calendarEventId);
