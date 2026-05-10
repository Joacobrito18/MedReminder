import { useEffect, useLayoutEffect, useState } from 'react';
import {
  Alert,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import Feather from '@expo/vector-icons/Feather';

import FormInput from '@/shared/components/FormInput';
import ScreenContainer from '@/shared/components/ScreenContainer';
import { useToast } from '@/shared/components/Toast';
import { colors, fontSize, fontWeight, radius, spacing } from '@/shared/constants/theme';
import { useAuth } from '@/modules/auth/context/AuthContext';
import {
  cancelMany,
  nextScheduledDate,
  requestPermissions,
  scheduleForDays,
  scheduleOneShot,
} from '@/modules/medications/notifications/scheduler';
import {
  addMedication,
  findMedication,
  removeMedication,
  updateMedication,
} from '@/modules/medications/storage/medications-storage';
import { ALL_DAYS, NotificationKind } from '@/modules/medications/types';
import { wasTakenToday } from '@/shared/helpers/date';
import { formatTime, timeToDate } from '@/shared/helpers/format-time';
import { AppScreenProps } from '@/navigation/types';

const DEFAULT_TIME = '08:00';
const TIME_PATTERN = /^\d{2}:\d{2}$/;

const DAY_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: 'L' },
  { value: 2, label: 'M' },
  { value: 3, label: 'M' },
  { value: 4, label: 'J' },
  { value: 5, label: 'V' },
  { value: 6, label: 'S' },
  { value: 0, label: 'D' },
];

type FieldErrors = {
  name?: string;
  time?: string;
  days?: string;
};

const AddMedicationScreen = ({ navigation, route }: AppScreenProps<'AddMedication'>) => {
  const { state } = useAuth();
  const { showToast } = useToast();
  const username = state.status === 'signedIn' ? state.user.username : null;
  const editingId = route.params?.medicationId;
  const isEditing = Boolean(editingId);

  const [name, setName] = useState('');
  const [dose, setDose] = useState('');
  const [time, setTime] = useState(DEFAULT_TIME);
  const [days, setDays] = useState<number[]>(ALL_DAYS);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(isEditing);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [originalNotificationIds, setOriginalNotificationIds] = useState<string[] | undefined>();
  const [originalLastTakenAt, setOriginalLastTakenAt] = useState<string | undefined>();

  const allSelected = days.length === 7;
  const sortedDays = [...days].sort((a, b) => a - b);

  const toggleDay = (value: number) => {
    setDays((current) =>
      current.includes(value) ? current.filter((d) => d !== value) : [...current, value],
    );
    if (errors.days) setErrors((prev) => ({ ...prev, days: undefined }));
  };

  const toggleAllDays = () => setDays(allSelected ? [] : ALL_DAYS);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  useEffect(() => {
    if (!isEditing || !editingId || !username) return;
    let active = true;
    const load = async () => {
      const med = await findMedication(username, editingId);
      if (!active) return;
      if (!med) {
        Alert.alert('No encontrada', 'No pudimos cargar la medicación.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
        return;
      }
      setName(med.name);
      setDose(med.dose ?? '');
      setTime(med.time);
      setDays(med.days.length > 0 ? med.days : ALL_DAYS);
      setOriginalNotificationIds(med.notificationIds);
      setOriginalLastTakenAt(med.lastTakenAt);
      setLoading(false);
    };
    load();
    return () => {
      active = false;
    };
  }, [editingId, isEditing, navigation, username]);

  const handleTimeChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') {
      setPickerVisible(false);
    }
    if (event.type === 'dismissed' || !selected) return;
    setTime(formatTime(selected));
    if (errors.time) setErrors((prev) => ({ ...prev, time: undefined }));
  };

  const handleSave = async () => {
    if (!username) return;

    const nextErrors: FieldErrors = {};
    if (!name.trim()) nextErrors.name = 'Ingresá el nombre';
    if (!TIME_PATTERN.test(time)) nextErrors.time = 'Hora inválida';
    if (days.length === 0) nextErrors.days = 'Elegí al menos un día';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const cleanName = name.trim();
    const cleanDose = dose.trim() || undefined;
    const cleanDays = sortedDays;

    setSubmitting(true);
    let newNotificationIds: string[] = [];
    let newKind: NotificationKind | undefined;
    const skipToday = isEditing && wasTakenToday(originalLastTakenAt);

    try {
      const granted = await requestPermissions();
      if (granted) {
        try {
          if (skipToday) {
            const id = await scheduleOneShot(
              { name: cleanName, dose: cleanDose, time },
              nextScheduledDate(time, cleanDays),
            );
            newNotificationIds = [id];
            newKind = 'oneshot';
          } else {
            newNotificationIds = await scheduleForDays(
              { name: cleanName, dose: cleanDose, time, days: cleanDays },
              cleanDays,
            );
            newKind = newNotificationIds.length > 0 ? 'weekly' : undefined;
          }
        } catch {
          newNotificationIds = [];
          newKind = undefined;
        }
      } else {
        Alert.alert(
          'Sin permisos de notificaciones',
          'Vamos a guardar la medicación, pero no podremos avisarte. Activá las notificaciones desde los ajustes del dispositivo.',
        );
      }

      try {
        if (isEditing && editingId) {
          await updateMedication(username, editingId, {
            name: cleanName,
            dose: cleanDose,
            time,
            days: cleanDays,
            notificationIds: newNotificationIds,
            notificationKind: newKind,
          });
          await cancelMany(originalNotificationIds);
          showToast('Cambios guardados');
        } else {
          await addMedication(username, {
            name: cleanName,
            dose: cleanDose,
            time,
            days: cleanDays,
            notificationIds: newNotificationIds,
            notificationKind: newKind,
          });
          showToast('Recordatorio agregado');
        }
        navigation.goBack();
      } catch {
        await cancelMany(newNotificationIds);
        Alert.alert('Error', 'No pudimos guardar la medicación. Intentá de nuevo.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (!isEditing || !editingId || !username) return;
    Alert.alert('Eliminar medicación', `¿Seguro que querés eliminar "${name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await cancelMany(originalNotificationIds);
          await removeMedication(username, editingId);
          showToast('Recordatorio eliminado', 'info');
          navigation.goBack();
        },
      },
    ]);
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
        {isEditing ? (
          <Pressable
            onPress={handleDelete}
            accessibilityLabel="Eliminar medicación"
            style={({ pressed }) => [styles.trashButton, pressed && styles.pressedSubtle]}
          >
            <Feather name="trash-2" size={16} color={colors.danger} />
          </Pressable>
        ) : null}
      </View>

      {loading ? (
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Cargando…</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.eyebrow}>{isEditing ? 'EDITAR' : 'NUEVA MEDICACIÓN'}</Text>
          <Text style={styles.title}>
            {isEditing ? name || 'Medicación' : '¿Qué tomás y a qué hora?'}
          </Text>

          <View style={styles.form}>
            <FormInput
              label="Nombre"
              placeholder="Ej. Ibuprofeno 400"
              value={name}
              onChangeText={(value) => {
                setName(value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
              }}
              error={errors.name}
              autoCapitalize="sentences"
              returnKeyType="next"
            />

            <FormInput
              label="Dosis"
              placeholder="Ej. 1 comprimido"
              value={dose}
              onChangeText={setDose}
              autoCapitalize="sentences"
              returnKeyType="next"
              hint="Opcional. Sirve para no confundirte si tenés varias presentaciones."
            />

            <Text style={styles.timeLabel}>Hora del recordatorio</Text>
            <Pressable
              onPress={() => {
                Keyboard.dismiss();
                setPickerVisible((current) => !current);
              }}
              accessibilityLabel="Elegir hora del recordatorio"
              style={({ pressed }) => [
                styles.timeHero,
                errors.time ? styles.timeHeroError : null,
                pressed && styles.timeHeroPressed,
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.timeHeroValue}>{time}</Text>
                <Text style={styles.timeHeroHint}>Tocá para cambiar</Text>
              </View>
              <View style={styles.timeHeroIcon}>
                <Feather name="clock" size={22} color={colors.textOnPrimary} />
              </View>
            </Pressable>
            {errors.time ? <Text style={styles.error}>{errors.time}</Text> : null}

            {pickerVisible ? (
              <DateTimePicker
                value={timeToDate(time)}
                mode="time"
                is24Hour
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleTimeChange}
              />
            ) : null}

            <View style={styles.daysHeader}>
              <Text style={styles.daysLabel}>Días de la semana</Text>
              <Pressable
                onPress={toggleAllDays}
                accessibilityLabel={allSelected ? 'Quitar todos los días' : 'Seleccionar todos los días'}
                style={({ pressed }) => [styles.daysToggle, pressed && styles.pressedSubtle]}
              >
                <Text style={styles.daysToggleLabel}>
                  {allSelected ? 'Ninguno' : 'Todos'}
                </Text>
              </Pressable>
            </View>
            <View style={styles.daysRow}>
              {DAY_OPTIONS.map((opt) => {
                const selected = days.includes(opt.value);
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => toggleDay(opt.value)}
                    accessibilityLabel={`Día ${opt.label}`}
                    accessibilityState={{ selected }}
                    style={({ pressed }) => [
                      styles.dayChip,
                      selected && styles.dayChipSelected,
                      pressed && styles.pressedSubtle,
                    ]}
                  >
                    <Text style={[styles.dayChipLabel, selected && styles.dayChipLabelSelected]}>
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {errors.days ? <Text style={styles.error}>{errors.days}</Text> : null}
          </View>
        </ScrollView>
      )}

      {!loading ? (
        <View style={styles.footer}>
          <Pressable
            onPress={handleSave}
            disabled={submitting || !username}
            accessibilityLabel={isEditing ? 'Guardar cambios' : 'Crear recordatorio'}
            style={({ pressed }) => [
              styles.primaryButton,
              (submitting || !username) && styles.primaryButtonDisabled,
              pressed && styles.primaryButtonPressed,
            ]}
          >
            <Text style={styles.primaryLabel}>
              {submitting
                ? 'Guardando…'
                : isEditing
                  ? 'Guardar cambios'
                  : 'Crear recordatorio'}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => navigation.goBack()}
            accessibilityLabel="Cancelar"
            style={({ pressed }) => [styles.ghostButton, pressed && styles.pressedSubtle]}
          >
            <Text style={styles.ghostLabel}>Cancelar</Text>
          </Pressable>
        </View>
      ) : null}
    </ScreenContainer>
  );
};

export default AddMedicationScreen;

const styles = StyleSheet.create({
  topBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  trashButton: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: colors.dangerMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressedSubtle: {
    opacity: 0.7,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
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
    marginBottom: spacing.xl,
  },
  form: {
    gap: 0,
  },
  timeLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSoft,
    marginBottom: 6,
  },
  timeHero: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg + 6,
    paddingVertical: spacing.lg + 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeHeroError: {
    borderWidth: 2,
    borderColor: colors.danger,
  },
  timeHeroPressed: {
    opacity: 0.92,
  },
  timeHeroValue: {
    fontSize: fontSize.hero,
    fontWeight: fontWeight.bold,
    color: colors.textOnPrimary,
    letterSpacing: -1.5,
    fontVariant: ['tabular-nums'],
    lineHeight: 52,
  },
  timeHeroHint: {
    fontSize: fontSize.sm,
    color: '#FFFFFF99',
    marginTop: 6,
    fontWeight: fontWeight.medium,
  },
  timeHeroIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: '#FFFFFF20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: {
    marginTop: spacing.xs,
    fontSize: fontSize.xs,
    color: colors.danger,
  },
  daysHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg + 4,
    marginBottom: spacing.sm,
  },
  daysLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSoft,
  },
  daysToggle: {
    height: 30,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  daysToggleLabel: {
    fontSize: fontSize.xs + 1,
    fontWeight: fontWeight.semibold,
    color: colors.textSoft,
    letterSpacing: 0.2,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  dayChip: {
    flex: 1,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayChipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  dayChipLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textSoft,
  },
  dayChipLabelSelected: {
    color: colors.textOnPrimary,
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
  primaryButtonDisabled: {
    opacity: 0.6,
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
  ghostButton: {
    height: 48,
    marginTop: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostLabel: {
    color: colors.textSoft,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
});
