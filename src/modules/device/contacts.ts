import * as Contacts from 'expo-contacts';

import { ensurePermission, notifyResourceError } from '@/modules/device/permissions';
import { MedicationContact } from '@/modules/medications/types';

// El picker de iOS no siempre devuelve `name`; lo reconstruimos desde los campos disponibles.
const resolveName = (contact: Contacts.Contact): string => {
  const parts = [contact.firstName, contact.middleName, contact.lastName].filter(Boolean);
  const fullName = parts.join(' ').trim();
  return (
    contact.name?.trim() ||
    fullName ||
    contact.nickname?.trim() ||
    contact.company?.trim() ||
    contact.phoneNumbers?.[0]?.number ||
    'Contacto sin nombre'
  );
};

export const pickContact = async (): Promise<MedicationContact | null> => {
  const granted = await ensurePermission(
    Contacts.requestPermissionsAsync,
    'los contactos',
  );
  if (!granted) return null;

  try {
    const contact = await Contacts.presentContactPickerAsync();
    if (!contact) return null;

    return {
      name: resolveName(contact),
      phone: contact.phoneNumbers?.[0]?.number,
    };
  } catch {
    notifyResourceError('los contactos');
    return null;
  }
};
