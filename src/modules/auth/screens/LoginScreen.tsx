import { useState } from 'react';
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
import { colors, fontSize, fontWeight, radius, spacing } from '@/shared/constants/theme';
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
      setError(
        e instanceof Error && e.message === 'INVALID_CREDENTIALS'
          ? 'Usuario o contraseña incorrectos.'
          : 'No pudimos iniciar sesión. Intentá de nuevo.',
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
        <View style={styles.hero}>
          <View style={styles.logo}>
            <Feather name="activity" size={28} color={colors.textOnPrimary} />
          </View>
          <Text style={styles.title}>MedReminder</Text>
          <Text style={styles.subtitle}>Tu agenda de medicación, tranquila y a tiempo.</Text>
        </View>

        <View style={styles.spacer} />

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

          <Pressable
            onPress={handleSubmit}
            disabled={!canSubmit}
            accessibilityLabel="Entrar"
            style={({ pressed }) => [
              styles.primaryButton,
              !canSubmit && styles.primaryButtonDisabled,
              pressed && styles.primaryButtonPressed,
            ]}
          >
            {submitting ? <ActivityIndicator color={colors.textOnPrimary} /> : null}
            <Text style={styles.primaryLabel}>{submitting ? 'Entrando…' : 'Entrar'}</Text>
          </Pressable>
        </View>

        <Pressable onPress={() => navigation.navigate('Register')} style={styles.footer}>
          <Text style={styles.footerText}>
            ¿Primera vez? <Text style={styles.footerLink}>Crear cuenta</Text>
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
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl + spacing.md,
  },
  hero: {
    alignItems: 'center',
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl - 2,
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  title: {
    fontSize: 30,
    fontWeight: fontWeight.bold,
    color: colors.text,
    letterSpacing: -0.8,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },
  spacer: {
    flex: 1,
  },
  formBlock: {
    marginBottom: spacing.sm,
  },
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
  primaryButton: {
    height: 54,
    marginTop: spacing.md + 2,
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
    letterSpacing: -0.2,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  footerText: {
    fontSize: fontSize.sm + 1,
    color: colors.textMuted,
  },
  footerLink: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
});
