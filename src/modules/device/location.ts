import * as Location from 'expo-location';

import { ensurePermission, notifyResourceError } from '@/modules/device/permissions';
import { PharmacyLocation } from '@/modules/medications/types';

const formatAddress = (place?: Location.LocationGeocodedAddress): string | undefined => {
  if (!place) return undefined;
  const street = [place.street, place.streetNumber].filter(Boolean).join(' ');
  const parts = [street, place.city ?? place.subregion, place.region].filter(
    (p): p is string => Boolean(p && p.length > 0),
  );
  return parts.length > 0 ? parts.join(', ') : undefined;
};

export const getCurrentPharmacyLocation = async (): Promise<PharmacyLocation | null> => {
  const granted = await ensurePermission(
    Location.requestForegroundPermissionsAsync,
    'la ubicación',
  );
  if (!granted) return null;

  try {
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    const { latitude, longitude } = position.coords;

    let address: string | undefined;
    try {
      const places = await Location.reverseGeocodeAsync({ latitude, longitude });
      address = formatAddress(places[0]);
    } catch {
      address = undefined;
    }

    return { latitude, longitude, address };
  } catch {
    notifyResourceError('la ubicación');
    return null;
  }
};
