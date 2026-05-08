import { Pressable, StyleSheet, Text, View } from 'react-native';

import PrimaryButton from '@/shared/components/PrimaryButton';
import ScreenContainer from '@/shared/components/ScreenContainer';
import { colors, fontSize, fontWeight, radius, spacing } from '@/shared/constants/theme';
import { useAuth } from '@/modules/auth/context/AuthContext';
import { AppScreenProps } from '@/navigation/types';

const HomeScreen = ({ navigation }: AppScreenProps<'Home'>) => {
  const { state, signOut } = useAuth();
  const username = state.status === 'signedIn' ? state.user.username : '';

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hola,</Text>
          <Text style={styles.username}>{username}</Text>
        </View>
        <Pressable onPress={signOut} style={styles.logout} hitSlop={8}>
          <Text style={styles.logoutLabel}>Salir</Text>
        </Pressable>
      </View>

      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>Aún no tenés medicaciones</Text>
        <Text style={styles.emptyBody}>
          Agregá tu primera medicación y vamos a recordarte la hora de tomarla.
        </Text>
        <PrimaryButton
          label="Agregar medicación"
          onPress={() => navigation.navigate('AddMedication')}
          style={styles.cta}
        />
      </View>
    </ScreenContainer>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  greeting: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  username: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  logout: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryMuted,
  },
  logoutLabel: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
    fontSize: fontSize.sm,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptyBody: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  cta: {
    alignSelf: 'stretch',
  },
});
