import { forwardRef } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

import { colors, fontSize, fontWeight, radius, spacing } from '@/shared/constants/theme';

type Props = TextInputProps & {
  label?: string;
  error?: string;
  hint?: string;
};

const FormInput = forwardRef<TextInput, Props>(({ label, error, hint, style, ...rest }, ref) => {
  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        ref={ref}
        placeholderTextColor={colors.textMutedSoft}
        style={[styles.input, error ? styles.inputError : null, style]}
        {...rest}
      />
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
});

FormInput.displayName = 'FormInput';

export default FormInput;

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.md + 2,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSoft,
    marginBottom: 6,
    letterSpacing: 0.1,
  },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md + 2,
    fontSize: fontSize.md + 1,
    color: colors.text,
  },
  inputError: {
    borderColor: colors.danger,
  },
  error: {
    marginTop: spacing.xs + 2,
    fontSize: fontSize.xs,
    color: colors.danger,
  },
  hint: {
    marginTop: spacing.xs + 2,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    paddingLeft: spacing.xs,
  },
});
