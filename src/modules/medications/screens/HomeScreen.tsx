import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Feather from '@expo/vector-icons/Feather';

import DayBanner from '@/modules/medications/components/DayBanner';
import MedicationItem from '@/modules/medications/components/MedicationItem';
import {
  cancel as cancelNotification,
  scheduleDaily,
  scheduleOneShot,
  tomorrowAt,
} from '@/modules/medications/notifications/scheduler';
import {
  getMedications,
  removeMedication,
  updateMedication,
} from '@/modules/medications/storage/medications-storage';
import { Medication, NotificationKind } from '@/modules/medications/types';
import { useAuth } from '@/modules/auth/context/AuthContext';
import ScreenContainer from '@/shared/components/ScreenContainer';
import { colors, fontSize, fontWeight, radius, spacing } from '@/shared/constants/theme';
import { wasTakenToday } from '@/shared/helpers/date';
import { AppScreenProps } from '@/navigation/types';

const sortByTime = (list: Medication[]): Medication[] =>
  [...list].sort((a, b) => a.time.localeCompare(b.time));

const reconcileNotifications = async (
  username: string,
  meds: Medication[],
): Promise<Medication[]> => {
  const result: Medication[] = [];
  for (const med of meds) {
    const isStaleOneShot =
      med.notificationKind === 'oneshot' && !wasTakenToday(med.lastTakenAt);
    if (!isStaleOneShot) {
      result.push(med);
      continue;
    }
    await cancelNotification(med.notificationId);
    let newId: string | undefined;
    try {
      newId = await scheduleDaily(med);
    } catch {
      newId = undefined;
    }
    const updated = await updateMedication(username, med.id, {
      notificationId: newId,
      notificationKind: newId ? 'daily' : undefined,
    });
    result.push(updated ?? med);
  }
  return result;
};

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
        setLoading(true);
        const list = await getMedications(username);
        if (!active) return;
        const reconciled = await reconcileNotifications(username, list);
        if (!active) return;
        setMeds(sortByTime(reconciled));
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

  const handleEdit = (medication: Medication) => {
    navigation.navigate('AddMedication', { medicationId: medication.id });
  };

  const handleToggleTaken = async (medication: Medication) => {
    if (!username) return;
    const willBeTaken = !wasTakenToday(medication.lastTakenAt);

    await cancelNotification(medication.notificationId);
    let newId: string | undefined;
    let newKind: NotificationKind | undefined;
    try {
      if (willBeTaken) {
        newId = await scheduleOneShot(medication, tomorrowAt(medication.time));
        newKind = 'oneshot';
      } else {
        newId = await scheduleDaily(medication);
        newKind = 'daily';
      }
    } catch {
      newId = undefined;
      newKind = undefined;
    }

    const updated = await updateMedication(username, medication.id, {
      lastTakenAt: willBeTaken ? new Date().toISOString() : undefined,
      notificationId: newId,
      notificationKind: newKind,
    });
    if (!updated) return;
    setMeds((current) => current.map((m) => (m.id === updated.id ? updated : m)));
  };

  const goToAdd = () => navigation.navigate('AddMedication');

  const isEmpty = !loading && meds.length === 0;
  const takenCount = useMemo(
    () => meds.filter((m) => wasTakenToday(m.lastTakenAt)).length,
    [meds],
  );

  return (
    <ScreenContainer padded={false}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>BUEN DÍA</Text>
          <Text style={styles.username} numberOfLines={1}>
            {username ?? ''}
          </Text>
        </View>
        <Pressable
          onPress={signOut}
          accessibilityLabel="Cerrar sesión"
          style={({ pressed }) => [styles.logout, pressed && styles.logoutPressed]}
          hitSlop={6}
        >
          <Feather name="log-out" size={14} color={colors.textSoft} />
          <Text style={styles.logoutLabel}>Salir</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : isEmpty ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Feather name="calendar" size={34} color={colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>Empezá tu agenda</Text>
          <Text style={styles.emptyBody}>
            Agregá tu primera medicación. Te avisamos a la hora exacta, todos los días.
          </Text>
          <Pressable
            onPress={goToAdd}
            accessibilityLabel="Agregar medicación"
            style={({ pressed }) => [styles.emptyCta, pressed && styles.emptyCtaPressed]}
          >
            <Feather name="plus" size={18} color={colors.textOnPrimary} />
            <Text style={styles.emptyCtaLabel}>Agregar medicación</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <DayBanner taken={takenCount} total={meds.length} />
          <View style={styles.sectionLabelWrap}>
            <Text style={styles.sectionLabel}>HOY</Text>
          </View>
          <FlatList
            data={meds}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <MedicationItem
                medication={item}
                onDelete={handleDelete}
                onEdit={handleEdit}
                onToggleTaken={handleToggleTaken}
              />
            )}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        </>
      )}

      {!isEmpty && !loading ? (
        <Pressable
          onPress={goToAdd}
          accessibilityLabel="Agregar medicación"
          style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        >
          <Feather name="plus" size={26} color={colors.textOnPrimary} />
        </Pressable>
      ) : null}
    </ScreenContainer>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  greeting: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    letterSpacing: 0.6,
    fontWeight: fontWeight.medium,
    marginBottom: 2,
  },
  username: {
    fontSize: 28,
    fontWeight: fontWeight.bold,
    color: colors.text,
    letterSpacing: -0.6,
    lineHeight: 32,
  },
  logout: {
    height: 38,
    paddingHorizontal: spacing.md + 2,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logoutPressed: {
    opacity: 0.7,
  },
  logoutLabel: {
    color: colors.textSoft,
    fontWeight: fontWeight.medium,
    fontSize: fontSize.sm + 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: radius.xl,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl - 2,
  },
  emptyTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    letterSpacing: -0.4,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyBody: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl + 2,
  },
  emptyCta: {
    height: 52,
    paddingHorizontal: spacing.xl - 2,
    borderRadius: 14,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyCtaPressed: {
    opacity: 0.85,
  },
  emptyCtaLabel: {
    color: colors.textOnPrimary,
    fontSize: fontSize.md + 1,
    fontWeight: fontWeight.semibold,
  },
  sectionLabelWrap: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  sectionLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.textMuted,
    letterSpacing: 1,
  },
  list: {
    paddingBottom: spacing.xxxl + 60,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.xl + 8,
    width: 60,
    height: 60,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  fabPressed: {
    opacity: 0.9,
  },
});
