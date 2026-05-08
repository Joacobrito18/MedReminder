import { StyleSheet, Text, View } from 'react-native';

import PrimaryButton from '@/shared/components/PrimaryButton';
import ScreenContainer from '@/shared/components/ScreenContainer';
import { colors, fontSize, fontWeight, spacing } from '@/shared/constants/theme';
import { AppScreenProps } from '@/navigation/types';

const AddMedicationScreen = ({ navigation }: AppScreenProps<'AddMedication'>) => {
  return (
    <ScreenContainer>
      <View style={styles.container}>
        <Text style={styles.title}>Nueva medicación</Text>
        <Text style={styles.placeholder}>
          Form pendiente — se implementa el Día 2 (nombre, dosis, hora) según el roadmap.
        </Text>
        <PrimaryButton label="Volver" onPress={() => navigation.goBack()} variant="secondary" />
      </View>
    </ScreenContainer>
  );
};

export default AddMedicationScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: spacing.xl,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  placeholder: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginBottom: spacing.xl,
  },
});
