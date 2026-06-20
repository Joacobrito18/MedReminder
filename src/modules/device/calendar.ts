import * as Calendar from 'expo-calendar';
import { Platform } from 'react-native';

import { ensurePermission, notifyResourceError } from '@/modules/device/permissions';
import { nextScheduledDate } from '@/modules/medications/notifications/scheduler';
import { Medication } from '@/modules/medications/types';

const EVENT_DURATION_MS = 15 * 60 * 1000;

const getWritableCalendarId = async (): Promise<string | null> => {
  if (Platform.OS === 'ios') {
    try {
      const def = await Calendar.getDefaultCalendarAsync();
      if (def?.id) return def.id;
    } catch {
      // Si no hay calendario por defecto seguimos buscando uno editable.
    }
  }
  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  const writable = calendars.find((c) => c.allowsModifications);
  return writable?.id ?? calendars[0]?.id ?? null;
};

type IntakeMed = Pick<Medication, 'name' | 'dose' | 'time' | 'days'>;

export const addIntakeEvent = async (med: IntakeMed): Promise<string | null> => {
  const granted = await ensurePermission(
    Calendar.requestCalendarPermissionsAsync,
    'el calendario',
  );
  if (!granted) return null;

  try {
    const calendarId = await getWritableCalendarId();
    if (!calendarId) {
      notifyResourceError('el calendario');
      return null;
    }

    const startDate = nextScheduledDate(med.time, med.days);
    const endDate = new Date(startDate.getTime() + EVENT_DURATION_MS);

    return await Calendar.createEventAsync(calendarId, {
      title: `Tomar ${med.name}`,
      notes: med.dose ? `Dosis: ${med.dose}` : undefined,
      startDate,
      endDate,
      alarms: [{ relativeOffset: 0 }],
    });
  } catch {
    notifyResourceError('el calendario');
    return null;
  }
};
