import { useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import FormInput from '@/shared/components/FormInput';
import PrimaryButton from '@/shared/components/PrimaryButton';
import ScreenContainer from '@/shared/components/ScreenContainer';
import { colors, fontSize, fontWeight, spacing } from '@/shared/constants/theme';
import { useAuth } from '@/modules/auth/context/AuthContext';
import { AuthScreenProps } from '@/navigation/types';

const MIN_PASSWORD = 4;

const RegisterScreen = ({ navigation }: AuthScreenProps<'Register'>) => {
  const { signUp } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const trimmedUsername = username.trim().toLowerCase();
  const usernameValid = trimmedUsername.length >= 3;
  const passwordValid = password.length >= MIN_PASSWORD;
  const matches = password === confirm;
  const canSubmit = usernameValid && passwordValid && matches && !submitting;

  const handleSubmit = async () => {
    Keyboard.dismiss();
    setError(null);
    if (!usernameValid) return setError('El usuario debe tener al menos 3 caracteres.');
    if (!passwordValid) return setError(`La contraseña debe tener al menos ${MIN_PASSWORD} caracteres.`);
    if (!matches) return setError('Las contraseñas no coinciden.');

    setSubmitting(true);
    try {
      await signUp(trimmedUsername, password);
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
    <ScreenContainer>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Crear cuenta</Text>
          <Text style={styles.subtitle}>Datos guardados localmente en tu dispositivo</Text>
        </View>

        <View>
          <FormInput
            label="Usuario"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="tu_usuario"
          />
          <FormInput
            label="Contraseña"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="mínimo 4 caracteres"
          />
          <FormInput
            label="Confirmar contraseña"
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
            placeholder="repetí la contraseña"
            onSubmitEditing={handleSubmit}
          />
          {error ? <Text style={styles.errorBox}>{error}</Text> : null}

          <PrimaryButton
            label="Crear cuenta"
            onPress={handleSubmit}
            loading={submitting}
            disabled={!canSubmit}
            style={styles.submit}
          />
        </View>

        <Pressable onPress={() => navigation.goBack()} style={styles.footer}>
          <Text style={styles.footerText}>
            ¿Ya tenés cuenta? <Text style={styles.footerLink}>Iniciá sesión</Text>
          </Text>
        </Pressable>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
};

export default RegisterScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  subtitle: {
    marginTop: spacing.xs,
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
  },
  submit: {
    marginTop: spacing.md,
  },
  errorBox: {
    marginBottom: spacing.sm,
    color: colors.danger,
    fontSize: fontSize.sm,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  footerText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  footerLink: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
});
