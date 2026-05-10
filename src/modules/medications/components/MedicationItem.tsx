import { useEffect, useRef } from 'react';
import {
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Feather from '@expo/vector-icons/Feather';

import { Medication } from '@/modules/medications/types';
import { colors, fontSize, fontWeight, radius, spacing } from '@/shared/constants/theme';
import {
  dueInLabel,
  formatTakenAt,
  getMedicationStatus,
} from '@/shared/helpers/medication-status';

const DELETE_WIDTH = 92;
const SWIPE_THRESHOLD = DELETE_WIDTH / 2;

type Props = {
  medication: Medication;
  onDelete: (medication: Medication) => void;
  onEdit: (medication: Medication) => void;
  onToggleTaken: (medication: Medication) => void;
};

const MedicationItem = ({ medication, onDelete, onEdit, onToggleTaken }: Props) => {
  const status = getMedicationStatus(medication);
  const isTaken = status === 'taken';
  const isDueSoon = status === 'due-soon';

  const translateX = useRef(new Animated.Value(0)).current;
  const offsetX = useRef(0);
  const isOpenRef = useRef(false);

  useEffect(() => {
    const id = translateX.addListener(({ value }) => {
      offsetX.current = value;
    });
    return () => translateX.removeListener(id);
  }, [translateX]);

  const snapTo = (toValue: number) => {
    isOpenRef.current = toValue !== 0;
    Animated.spring(translateX, {
      toValue,
      useNativeDriver: true,
      bounciness: 0,
      speed: 20,
    }).start();
  };

  const close = () => snapTo(0);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, g) =>
        Math.abs(g.dx) > 6 && Math.abs(g.dy) < 8,
      onPanResponderGrant: () => {
        translateX.stopAnimation();
        translateX.setOffset(offsetX.current);
        translateX.setValue(0);
      },
      onPanResponderMove: (_e, g) => {
        const next = Math.min(0, Math.max(-DELETE_WIDTH, g.dx));
        translateX.setValue(next);
      },
      onPanResponderRelease: (_e, g) => {
        translateX.flattenOffset();
        const final = offsetX.current + g.dx;
        if (final < -SWIPE_THRESHOLD) snapTo(-DELETE_WIDTH);
        else snapTo(0);
      },
      onPanResponderTerminate: () => {
        translateX.flattenOffset();
        snapTo(0);
      },
    }),
  ).current;

  const handleCardPress = () => {
    if (isOpenRef.current) {
      close();
      return;
    }
    onEdit(medication);
  };

  const handleDeletePress = () => {
    close();
    onDelete(medication);
  };

  const railColor = isTaken ? colors.textMutedSoft : isDueSoon ? colors.warning : colors.primary;
  const cardBg = isTaken ? colors.surfaceMuted : colors.surface;
  const borderColor = isDueSoon ? colors.warningMuted : colors.border;

  return (
    <View style={styles.wrapper}>
      <View style={styles.deleteAction}>
        <Pressable
          onPress={handleDeletePress}
          accessibilityLabel={`Eliminar ${medication.name}`}
          style={({ pressed }) => [styles.deleteButton, pressed && styles.deletePressed]}
        >
          <Feather name="trash-2" size={20} color={colors.textOnPrimary} />
          <Text style={styles.deleteLabel}>Eliminar</Text>
        </Pressable>
      </View>

      <Animated.View
        style={[styles.card, { backgroundColor: cardBg, borderColor, transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        <Pressable
          onPress={handleCardPress}
          accessibilityLabel={`Editar ${medication.name}`}
          style={styles.cardContent}
        >
          <View style={styles.rail}>
            <Text
              numberOfLines={1}
              style={[
                styles.time,
                { color: railColor },
                isTaken && styles.timeTaken,
              ]}
            >
              {medication.time}
            </Text>
            {isTaken ? (
              <Text style={styles.subLabelSuccess}>{`✓ ${formatTakenAt(medication.lastTakenAt)}`}</Text>
            ) : isDueSoon ? (
              <Text style={styles.subLabelWarning}>{dueInLabel(medication)}</Text>
            ) : (
              <Text style={styles.subLabelMuted}>PENDIENTE</Text>
            )}
          </View>

          <View style={styles.body}>
            <View style={styles.info}>
              <Text
                style={[styles.name, isTaken && styles.nameTaken]}
                numberOfLines={1}
              >
                {medication.name}
              </Text>
              <Text style={styles.dose} numberOfLines={1}>
                {medication.dose ?? 'Sin dosis indicada'}
              </Text>
            </View>

            <Pressable
              onPress={() => onToggleTaken(medication)}
              hitSlop={6}
              accessibilityLabel={isTaken ? `Quitar marca de tomada de ${medication.name}` : `Marcar ${medication.name} como tomada`}
              style={({ pressed }) => [
                styles.check,
                isTaken && styles.checkTaken,
                isDueSoon && !isTaken && styles.checkDueSoon,
                pressed && styles.checkPressed,
              ]}
            >
              <Feather
                name="check"
                size={20}
                color={isTaken ? colors.textOnPrimary : isDueSoon ? colors.warning : colors.textMutedSoft}
              />
            </Pressable>
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
};

export default MedicationItem;

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm + 2,
    borderRadius: radius.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  deleteAction: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: DELETE_WIDTH,
    backgroundColor: colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deletePressed: {
    opacity: 0.85,
  },
  deleteLabel: {
    color: colors.textOnPrimary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    marginTop: spacing.xs,
    letterSpacing: 0.4,
  },
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
  },
  rail: {
    width: 86,
    paddingVertical: spacing.md + 2,
    paddingLeft: spacing.lg,
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: colors.divider,
  },
  time: {
    fontSize: 22,
    fontWeight: fontWeight.bold,
    letterSpacing: -0.6,
    fontVariant: ['tabular-nums'],
    lineHeight: 24,
  },
  timeTaken: {
    textDecorationLine: 'line-through',
    textDecorationColor: colors.textMutedSoft,
  },
  subLabelMuted: {
    marginTop: spacing.xs + 2,
    fontSize: 11,
    fontWeight: fontWeight.medium,
    color: colors.textMuted,
    letterSpacing: 0.3,
  },
  subLabelSuccess: {
    marginTop: spacing.xs + 2,
    fontSize: 11,
    fontWeight: fontWeight.semibold,
    color: colors.success,
    letterSpacing: 0.3,
  },
  subLabelWarning: {
    marginTop: spacing.xs + 2,
    fontSize: 11,
    fontWeight: fontWeight.semibold,
    color: colors.warning,
    letterSpacing: 0.3,
  },
  body: {
    flex: 1,
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  nameTaken: {
    textDecorationLine: 'line-through',
    textDecorationColor: colors.textMutedSoft,
    color: colors.textSoft,
  },
  dose: {
    fontSize: fontSize.sm + 1,
    color: colors.textMuted,
    fontWeight: fontWeight.regular,
  },
  check: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  checkTaken: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  checkDueSoon: {
    borderColor: colors.warning,
  },
  checkPressed: {
    opacity: 0.7,
  },
});
