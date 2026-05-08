import { useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import FormInput from '@/shared/components/FormInput';
import PrimaryButton from '@/shared/components/PrimaryButton';
import ScreenContainer from '@/shared/components/ScreenContainer';
import { colors, fontSize, fontWeight, spacing } from '@/shared/constants/theme';
import { useAuth } from '@/modules/auth/context/AuthContext';
import { AuthScreenProps } from '@/navigation/types';

const LoginScreen = ({ navigation }: AuthScreenProps<'Login'>) => {
  const { signIn } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = username.trim().length > 0 && password.length > 0 && !submitting;

  const handleSubmit = async () => {
    Keyboard.dismiss();
    setError(null);
    setSubmitting(true);
    try {
      await signIn(username.trim().toLowerCase(), password);
    } catch (e) {
      setError(e instanceof Error && e.message === 'INVALID_CREDENTIALS'
        ? 'Usuario o contraseña incorrectos.'
        : 'No pudimos iniciar sesión. Intentá de nuevo.');
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
          <Text style={styles.title}>MedReminder</Text>
          <Text style={styles.subtitle}>Iniciá sesión para gestionar tus medicaciones</Text>
        </View>

        <View>
          <FormInput
            label="Usuario"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="tu_usuario"
            returnKeyType="next"
          />
          <FormInput
            label="Contraseña"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••"
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
          />
          {error ? <Text style={styles.errorBox}>{error}</Text> : null}

          <PrimaryButton
            label="Entrar"
            onPress={handleSubmit}
            loading={submitting}
            disabled={!canSubmit}
            style={styles.submit}
          />
        </View>

        <Pressable onPress={() => navigation.navigate('Register')} style={styles.footer}>
          <Text style={styles.footerText}>
            ¿No tenés cuenta? <Text style={styles.footerLink}>Registrate</Text>
          </Text>
        </Pressable>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
};

export default LoginScreen;

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
