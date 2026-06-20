import * as ImagePicker from 'expo-image-picker';

import { ensurePermission, notifyResourceError } from '@/modules/device/permissions';

const PICK_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  allowsEditing: true,
  aspect: [1, 1],
  quality: 0.6,
};

const firstAssetUri = (result: ImagePicker.ImagePickerResult): string | null => {
  if (result.canceled || !result.assets || result.assets.length === 0) return null;
  return result.assets[0].uri;
};

export const takePhoto = async (): Promise<string | null> => {
  const granted = await ensurePermission(
    ImagePicker.requestCameraPermissionsAsync,
    'la cámara',
  );
  if (!granted) return null;
  try {
    return firstAssetUri(await ImagePicker.launchCameraAsync(PICK_OPTIONS));
  } catch {
    notifyResourceError('la cámara');
    return null;
  }
};

export const pickFromGallery = async (): Promise<string | null> => {
  const granted = await ensurePermission(
    ImagePicker.requestMediaLibraryPermissionsAsync,
    'la galería',
  );
  if (!granted) return null;
  try {
    return firstAssetUri(await ImagePicker.launchImageLibraryAsync(PICK_OPTIONS));
  } catch {
    notifyResourceError('la galería');
    return null;
  }
};
