import { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import MedicationItem from '@/modules/medications/components/MedicationItem';
import { cancel as cancelNotification } from '@/modules/medications/notifications/scheduler';
import {
  getMedications,
  removeMedication,
} from '@/modules/medications/storage/medications-storage';
import { Medication } from '@/modules/medications/types';
import { useAuth } from '@/modules/auth/context/AuthContext';
import PrimaryButton from '@/shared/components/PrimaryButton';
import ScreenContainer from '@/shared/components/ScreenContainer';
import { colors, fontSize, fontWeight, radius, spacing } from '@/shared/constants/theme';
import { AppScreenProps } from '@/navigation/types';

const sortByTime = (list: Medication[]): Medication[] =>
  [...list].sort((a, b) => a.time.localeCompare(b.time));

const HomeScreen = ({ navigation }: AppScreenProps<'Home'>) => {
  const { state, signOut } = useAuth();
  const username = state.status === 'signedIn' ? state.user.username : null;

  const [meds, setMeds] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const load = async () => {
        if (!username) {
          setMeds([]);
          setLoading(false);
          return;
        }
        const list = await getMedications(username);
        if (!active) return;
        setMeds(sortByTime(list));
        setLoading(false);
      };
      load();
      return () => {
        active = false;
      };
    }, [username]),
  );

  const handleDelete = (medication: Medication) => {
    Alert.alert('Eliminar medicación', `¿Seguro que querés eliminar "${medication.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          if (!username) return;
          await cancelNotification(medication.notificationId);
          await removeMedication(username, medication.id);
          setMeds((current) => current.filter((m) => m.id !== medication.id));
        },
      },
    ]);
  };

  const goToAdd = () => navigation.navigate('AddMedication');

  const isEmpty = !loading && meds.length === 0;

  return (
    <ScreenContainer padded={false}>
      <View style={styles.padded}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hola,</Text>
            <Text style={styles.username}>{username ?? ''}</Text>
          </View>
          <Pressable onPress={signOut} style={styles.logout} hitSlop={8}>
            <Text style={styles.logoutLabel}>Salir</Text>
          </Pressable>
        </View>

        {isEmpty ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Aún no tenés medicaciones</Text>
            <Text style={styles.emptyBody}>
              Agregá tu primera medicación y vamos a recordarte la hora de tomarla.
            </Text>
            <PrimaryButton label="Agregar medicación" onPress={goToAdd} style={styles.cta} />
          </View>
        ) : (
          <FlatList
            data={meds}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <MedicationItem medication={item} onDelete={handleDelete} />
            )}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {!isEmpty ? (
        <Pressable
          onPress={goToAdd}
          accessibilityLabel="Agregar medicación"
          style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        >
          <Text style={styles.fabIcon}>+</Text>
        </Pressable>
      ) : null}
    </ScreenContainer>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  padded: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
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
  list: {
    paddingBottom: spacing.xxl + 56,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  fabPressed: {
    opacity: 0.85,
  },
  fabIcon: {
    color: colors.textOnPrimary,
    fontSize: 30,
    lineHeight: 32,
    fontWeight: fontWeight.bold,
  },
});
