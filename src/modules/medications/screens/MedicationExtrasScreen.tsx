import { useLayoutEffect, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Feather from '@expo/vector-icons/Feather';

import ScreenContainer from '@/shared/components/ScreenContainer';
import { useToast } from '@/shared/components/Toast';
import { colors, fontSize, fontWeight, radius, spacing } from '@/shared/constants/theme';
import { addIntakeEvent } from '@/modules/device/calendar';
import { pickContact } from '@/modules/device/contacts';
import { pickFromGallery, takePhoto } from '@/modules/device/image';
import { getCurrentPharmacyLocation } from '@/modules/device/location';
import { useMedicationDraftStore } from '@/modules/medications/store/medication-draft-store';
import { AppScreenProps } from '@/navigation/types';

const MedicationExtrasScreen = ({ navigation, route }: AppScreenProps<'MedicationExtras'>) => {
  const { name, dose, time, days } = route.params;
  const { showToast } = useToast();

  const photoUri = useMedicationDraftStore((s) => s.photoUri);
  const pharmacy = useMedicationDraftStore((s) => s.pharmacy);
  const contact = useMedicationDraftStore((s) => s.contact);
  const calendarEventId = useMedicationDraftStore((s) => s.calendarEventId);
  const setPhotoUri = useMedicationDraftStore((s) => s.setPhotoUri);
  const setPharmacy = useMedicationDraftStore((s) => s.setPharmacy);
  const setContact = useMedicationDraftStore((s) => s.setContact);
  const setCalendarEventId = useMedicationDraftStore((s) => s.setCalendarEventId);

  const [locating, setLocating] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const handlePhoto = () => {
    Alert.alert('Foto del medicamento', '¿De dónde querés agregar la imagen?', [
      {
        text: 'Tomar foto',
        onPress: async () => {
          const uri = await takePhoto();
          if (uri) setPhotoUri(uri);
        },
      },
      {
        text: 'Elegir de galería',
        onPress: async () => {
          const uri = await pickFromGallery();
          if (uri) setPhotoUri(uri);
        },
      },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const handleLocation = async () => {
    setLocating(true);
    try {
      const result = await getCurrentPharmacyLocation();
      if (result) {
        setPharmacy(result);
        showToast('Ubicación de la farmacia guardada');
      }
    } finally {
      setLocating(false);
    }
  };

  const handleContact = async () => {
    const result = await pickContact();
    if (result) {
      setContact(result);
      showToast('Contacto asociado');
    }
  };

  const handleCalendar = async () => {
    if (!name.trim()) {
      showToast('Primero ingresá el nombre del medicamento', 'error');
      return;
    }
    const eventId = await addIntakeEvent({ name: name.trim(), dose, time, days });
    if (eventId) {
      setCalendarEventId(eventId);
      showToast('Evento agregado al calendario');
    }
  };

  return (
    <ScreenContainer padded={false}>
      <View style={styles.topBar}>
        <Pressable
          onPress={() => navigation.goBack()}
          accessibilityLabel="Volver"
          style={({ pressed }) => [styles.backButton, pressed && styles.pressedSubtle]}
        >
          <Feather name="chevron-left" size={18} color={colors.textSoft} />
          <Text style={styles.backLabel}>Volver</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.eyebrow}>ADJUNTOS Y RECORDATORIO</Text>
        <Text style={styles.title}>{name.trim() || 'Tu medicación'}</Text>
        <Text style={styles.subtitle}>
          Opcional. Sumá una foto, la farmacia, un contacto y un evento en el calendario.
        </Text>

        {/* Foto del medicamento */}
        <Text style={styles.sectionTitle}>Foto del medicamento</Text>
        <View style={styles.photoRow}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.photoPreview} />
          ) : (
            <View style={[styles.photoPreview, styles.photoPlaceholder]}>
              <Feather name="image" size={22} color={colors.textMutedSoft} />
            </View>
          )}
          <View style={styles.photoActions}>
            <Pressable
              onPress={handlePhoto}
              accessibilityLabel="Agregar foto del medicamento"
              style={({ pressed }) => [styles.resourceButton, pressed && styles.pressedSubtle]}
            >
              <Feather name="camera" size={16} color={colors.primary} />
              <Text style={styles.resourceButtonLabel}>
                {photoUri ? 'Cambiar foto' : 'Agregar foto'}
              </Text>
            </Pressable>
            {photoUri ? (
              <Pressable onPress={() => setPhotoUri(undefined)} accessibilityLabel="Quitar foto">
                <Text style={styles.removeLink}>Quitar</Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        {/* Farmacia (ubicación) */}
        <Text style={styles.sectionTitle}>Farmacia</Text>
        <Pressable
          onPress={handleLocation}
          disabled={locating}
          accessibilityLabel="Usar mi ubicación para la farmacia"
          style={({ pressed }) => [styles.resourceButton, pressed && styles.pressedSubtle]}
        >
          <Feather name="map-pin" size={16} color={colors.primary} />
          <Text style={styles.resourceButtonLabel}>
            {locating ? 'Obteniendo ubicación…' : 'Usar mi ubicación'}
          </Text>
        </Pressable>
        {pharmacy ? (
          <View style={styles.resourceValue}>
            <Text style={styles.resourceValueText}>
              {pharmacy.address ??
                `${pharmacy.latitude.toFixed(5)}, ${pharmacy.longitude.toFixed(5)}`}
            </Text>
            <Pressable onPress={() => setPharmacy(undefined)} accessibilityLabel="Quitar ubicación">
              <Text style={styles.removeLink}>Quitar</Text>
            </Pressable>
          </View>
        ) : null}

        {/* Contacto (médico / familiar) */}
        <Text style={styles.sectionTitle}>Médico o familiar</Text>
        <Pressable
          onPress={handleContact}
          accessibilityLabel="Elegir contacto"
          style={({ pressed }) => [styles.resourceButton, pressed && styles.pressedSubtle]}
        >
          <Feather name="user" size={16} color={colors.primary} />
          <Text style={styles.resourceButtonLabel}>
            {contact ? 'Cambiar contacto' : 'Elegir contacto'}
          </Text>
        </Pressable>
        {contact ? (
          <View style={styles.resourceValue}>
            <Text style={styles.resourceValueText}>
              {contact.name}
              {contact.phone ? ` · ${contact.phone}` : ''}
            </Text>
            <Pressable onPress={() => setContact(undefined)} accessibilityLabel="Quitar contacto">
              <Text style={styles.removeLink}>Quitar</Text>
            </Pressable>
          </View>
        ) : null}

        {/* Calendario */}
        <Text style={styles.sectionTitle}>Calendario</Text>
        <Pressable
          onPress={handleCalendar}
          accessibilityLabel="Agregar la toma al calendario"
          style={({ pressed }) => [styles.resourceButton, pressed && styles.pressedSubtle]}
        >
          <Feather name="calendar" size={16} color={colors.primary} />
          <Text style={styles.resourceButtonLabel}>Agregar al calendario</Text>
        </Pressable>
        {calendarEventId ? (
          <View style={styles.resourceValue}>
            <Text style={styles.resourceValueText}>✓ Evento creado en tu calendario</Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          onPress={() => navigation.goBack()}
          accessibilityLabel="Listo"
          style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
        >
          <Text style={styles.primaryLabel}>Listo</Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
};

export default MedicationExtrasScreen;

const styles = StyleSheet.create({
  topBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    height: 38,
    paddingLeft: spacing.sm + 2,
    paddingRight: spacing.md + 2,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backLabel: {
    color: colors.textSoft,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
  pressedSubtle: {
    opacity: 0.7,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  eyebrow: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
    letterSpacing: 1,
    marginBottom: 6,
  },
  title: {
    fontSize: 28,
    fontWeight: fontWeight.bold,
    color: colors.text,
    letterSpacing: -0.7,
    lineHeight: 32,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSoft,
    marginTop: spacing.lg + 4,
    marginBottom: spacing.sm,
  },
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  photoPreview: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  photoPlaceholder: {
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoActions: {
    flex: 1,
    gap: spacing.sm,
  },
  resourceButton: {
    height: 44,
    paddingHorizontal: spacing.md + 2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'flex-start',
  },
  resourceButtonLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.primary,
  },
  resourceValue: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  resourceValueText: {
    flex: 1,
    fontSize: fontSize.sm + 1,
    color: colors.textMuted,
  },
  removeLink: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.danger,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    backgroundColor: colors.bg,
  },
  primaryButton: {
    height: 54,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonPressed: {
    opacity: 0.9,
  },
  primaryLabel: {
    color: colors.textOnPrimary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    letterSpacing: -0.2,
  },
});
