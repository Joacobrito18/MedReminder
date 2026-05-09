import { useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

import FormInput from '@/shared/components/FormInput';
import PrimaryButton from '@/shared/components/PrimaryButton';
import ScreenContainer from '@/shared/components/ScreenContainer';
import { colors, fontSize, fontWeight, radius, spacing } from '@/shared/constants/theme';
import { useAuth } from '@/modules/auth/context/AuthContext';
import {
  cancel as cancelNotification,
  requestPermissions,
  scheduleDaily,
} from '@/modules/medications/notifications/scheduler';
import { addMedication } from '@/modules/medications/storage/medications-storage';
import { formatTime, timeToDate } from '@/shared/helpers/format-time';
import { AppScreenProps } from '@/navigation/types';

const DEFAULT_TIME = '08:00';
const TIME_PATTERN = /^\d{2}:\d{2}$/;

type FieldErrors = {
  name?: string;
  time?: string;
};

const AddMedicationScreen = ({ navigation }: AppScreenProps<'AddMedication'>) => {
  const { state } = useAuth();
  const username = state.status === 'signedIn' ? state.user.username : null;

  const [name, setName] = useState('');
  const [dose, setDose] = useState('');
  const [time, setTime] = useState(DEFAULT_TIME);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

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
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const cleanName = name.trim();
    const cleanDose = dose.trim() || undefined;

    setSubmitting(true);
    let notificationId: string | undefined;

    try {
      const granted = await requestPermissions();
      if (granted) {
        try {
          notificationId = await scheduleDaily({ name: cleanName, dose: cleanDose, time });
        } catch {
          notificationId = undefined;
        }
      } else {
        Alert.alert(
          'Sin permisos de notificaciones',
          'Vamos a guardar la medicación, pero no podremos avisarte. Activá las notificaciones desde los ajustes del dispositivo.',
        );
      }

      try {
        await addMedication(username, {
          name: cleanName,
          dose: cleanDose,
          time,
          notificationId,
        });
        navigation.goBack();
      } catch {
        await cancelNotification(notificationId);
        Alert.alert('Error', 'No pudimos guardar la medicación. Intentá de nuevo.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenContainer>
      <View style={styles.container}>
        <FormInput
          label="Nombre"
          placeholder="Ibuprofeno 400mg"
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
          label="Dosis (opcional)"
          placeholder="1 comprimido"
          value={dose}
          onChangeText={setDose}
          autoCapitalize="sentences"
          returnKeyType="next"
        />

        <Text style={styles.label}>Hora del recordatorio</Text>
        <Pressable
          onPress={() => setPickerVisible((current) => !current)}
          accessibilityLabel="Elegir hora"
          style={({ pressed }) => [
            styles.timeButton,
            errors.time ? styles.timeButtonError : null,
            pressed && styles.timeButtonPressed,
          ]}
        >
          <Text style={styles.timeText}>{time}</Text>
          <Text style={styles.timeHint}>Tocá para cambiar</Text>
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

        <View style={styles.actions}>
          <PrimaryButton
            label="Guardar"
            onPress={handleSave}
            loading={submitting}
            disabled={!username}
          />
          <PrimaryButton
            label="Cancelar"
            onPress={() => navigation.goBack()}
            variant="secondary"
            style={styles.cancel}
          />
        </View>
      </View>
    </ScreenContainer>
  );
};

export default AddMedicationScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: spacing.md,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  timeButton: {
    minHeight: 56,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    justifyContent: 'center',
  },
  timeButtonError: {
    borderColor: colors.danger,
  },
  timeButtonPressed: {
    opacity: 0.85,
  },
  timeText: {
    fontSize: fontSize.lg,
    color: colors.text,
    fontWeight: fontWeight.bold,
    fontVariant: ['tabular-nums'],
  },
  timeHint: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  error: {
    marginTop: spacing.xs,
    fontSize: fontSize.xs,
    color: colors.danger,
  },
  actions: {
    marginTop: 'auto',
  },
  cancel: {
    marginTop: spacing.md,
  },
});
