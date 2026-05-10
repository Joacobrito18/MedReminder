import { useLayoutEffect, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Feather from '@expo/vector-icons/Feather';

import FormInput from '@/shared/components/FormInput';
import ScreenContainer from '@/shared/components/ScreenContainer';
import { useToast } from '@/shared/components/Toast';
import { colors, fontSize, fontWeight, radius, spacing } from '@/shared/constants/theme';
import { useAuth } from '@/modules/auth/context/AuthContext';
import { AuthScreenProps } from '@/navigation/types';

const MIN_PASSWORD = 6;

const RegisterScreen = ({ navigation }: AuthScreenProps<'Register'>) => {
  const { signUp } = useAuth();
  const { showToast } = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const trimmedUsername = username.trim().toLowerCase();
  const usernameValid = trimmedUsername.length >= 5;
  const passwordValid = password.length >= MIN_PASSWORD;
  const matches = password === confirm;
  const canSubmit = usernameValid && passwordValid && matches && !submitting;

  const handleSubmit = async () => {
    Keyboard.dismiss();
    setError(null);
    if (!usernameValid) return setError('El usuario debe tener al menos 5 caracteres.');
    if (!passwordValid) return setError(`La contraseña debe tener al menos ${MIN_PASSWORD} caracteres.`);
    if (!matches) return setError('Las contraseñas no coinciden.');

    setSubmitting(true);
    try {
      await signUp(trimmedUsername, password);
      showToast('Cuenta creada. Iniciá sesión.');
      navigation.goBack();
    } catch (e) {
      setError(
        e instanceof Error && e.message === 'USERNAME_TAKEN'
          ? 'Ese usuario ya existe.'
          : 'No pudimos registrarte. Intentá de nuevo.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenContainer padded={false}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.topBar}>
          <Pressable
            onPress={() => navigation.goBack()}
            accessibilityLabel="Volver"
            style={({ pressed }) => [styles.backButton, pressed && styles.pressedSubtle]}
          >
            <Feather name="chevron-left" size={18} color={colors.text} />
          </Pressable>
        </View>

        <View style={styles.heroBlock}>
          <Text style={styles.title}>Crear cuenta</Text>
          <Text style={styles.subtitle}>
            Tus datos quedan en este teléfono. No usamos servidor.
          </Text>
        </View>

        <View style={styles.formBlock}>
          {error ? (
            <View style={styles.errorBox}>
              <View style={styles.errorBadge}>
                <Text style={styles.errorBadgeText}>!</Text>
              </View>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <FormInput
            label="Usuario"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="Nombre de usuario"
          />
          <FormInput
            label="Contraseña"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder={`Mínimo ${MIN_PASSWORD} caracteres`}
            hint="Se guarda solo en tu dispositivo."
          />
          <FormInput
            label="Repetir contraseña"
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
            placeholder="Confirmar contraseña"
            onSubmitEditing={handleSubmit}
          />
        </View>

        <View style={styles.spacer} />

        <View style={styles.footerBlock}>
          <Pressable
            onPress={handleSubmit}
            disabled={!canSubmit}
            accessibilityLabel="Crear cuenta"
            style={({ pressed }) => [
              styles.primaryButton,
              !canSubmit && styles.primaryButtonDisabled,
              pressed && styles.primaryButtonPressed,
            ]}
          >
            {submitting ? <ActivityIndicator color={colors.textOnPrimary} /> : null}
            <Text style={styles.primaryLabel}>{submitting ? 'Creando…' : 'Crear cuenta'}</Text>
          </Pressable>
          <Text style={styles.legal}>
            Al continuar aceptás guardar tu usuario localmente.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
};

export default RegisterScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
  },
  topBar: {
    flexDirection: 'row',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressedSubtle: {
    opacity: 0.7,
  },
  heroBlock: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  title: {
    fontSize: 30,
    fontWeight: fontWeight.bold,
    color: colors.text,
    letterSpacing: -0.8,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    lineHeight: 22,
  },
  formBlock: {},
  errorBox: {
    backgroundColor: colors.dangerMuted,
    borderRadius: radius.md,
    padding: spacing.sm + 2,
    paddingHorizontal: spacing.md + 2,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: spacing.md + 2,
  },
  errorBadge: {
    width: 18,
    height: 18,
    borderRadius: radius.pill,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  errorBadgeText: {
    color: colors.textOnPrimary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  errorText: {
    flex: 1,
    color: colors.danger,
    fontSize: fontSize.sm + 1,
    fontWeight: fontWeight.medium,
    lineHeight: 20,
  },
  spacer: {
    flex: 1,
  },
  footerBlock: {
    paddingBottom: spacing.xl,
  },
  primaryButton: {
    height: 54,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonPressed: {
    opacity: 0.9,
  },
  primaryLabel: {
    color: colors.textOnPrimary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  legal: {
    fontSize: fontSize.xs + 1,
    color: colors.textMuted,
    textAlign: 'center',
    paddingTop: spacing.md,
    lineHeight: 18,
  },
});
