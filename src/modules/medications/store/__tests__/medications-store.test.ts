import AsyncStorage from '@react-native-async-storage/async-storage';

import { useMedicationsStore } from '@/modules/medications/store/medications-store';
import { NewMedicationInput } from '@/modules/medications/types';

// Aislamos el store de las notificaciones (expo-notifications) y la persistencia real.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('@/modules/medications/notifications/scheduler', () => ({
  cancelMany: jest.fn(() => Promise.resolve()),
  scheduleForDays: jest.fn(() => Promise.resolve([])),
  scheduleOneShot: jest.fn(() => Promise.resolve('noti-id')),
  nextScheduledDate: jest.fn(() => new Date('2026-06-18T08:00:00.000Z')),
}));

const baseInput: NewMedicationInput = {
  name: 'Ibuprofeno',
  dose: '1 comprimido',
  time: '08:00',
  days: [1, 2, 3, 4, 5],
};

describe('useMedicationsStore', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    useMedicationsStore.setState({ meds: [], loading: false, username: 'tester' });
  });

  it('add() agrega una medicación al estado', async () => {
    const created = await useMedicationsStore.getState().add(baseInput);

    const { meds } = useMedicationsStore.getState();
    expect(meds).toHaveLength(1);
    expect(meds[0].name).toBe('Ibuprofeno');
    expect(created?.id).toBe(meds[0].id);
  });

  it('update() modifica una medicación existente', async () => {
    const created = await useMedicationsStore.getState().add(baseInput);
    await useMedicationsStore.getState().update(created!.id, { dose: '2 comprimidos' });

    const { meds } = useMedicationsStore.getState();
    expect(meds[0].dose).toBe('2 comprimidos');
  });

  it('remove() elimina la medicación del estado', async () => {
    const created = await useMedicationsStore.getState().add(baseInput);
    await useMedicationsStore.getState().remove(
      useMedicationsStore.getState().meds.find((m) => m.id === created!.id)!,
    );

    expect(useMedicationsStore.getState().meds).toHaveLength(0);
  });

  it('ordena las medicaciones por hora', async () => {
    await useMedicationsStore.getState().add({ ...baseInput, name: 'Tarde', time: '20:00' });
    await useMedicationsStore.getState().add({ ...baseInput, name: 'Mañana', time: '07:00' });

    const names = useMedicationsStore.getState().meds.map((m) => m.name);
    expect(names).toEqual(['Mañana', 'Tarde']);
  });
});
