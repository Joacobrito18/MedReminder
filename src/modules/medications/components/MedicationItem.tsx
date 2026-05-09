import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Medication } from '@/modules/medications/types';
import { colors, fontSize, fontWeight, radius, spacing } from '@/shared/constants/theme';

type Props = {
  medication: Medication;
  onDelete: (medication: Medication) => void;
};

const MedicationItem = ({ medication, onDelete }: Props) => {
  return (
    <View style={styles.card}>
      <View style={styles.timeBlock}>
        <Text style={styles.time}>{medication.time}</Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {medication.name}
        </Text>
        {medication.dose ? (
          <Text style={styles.dose} numberOfLines={1}>
            {medication.dose}
          </Text>
        ) : null}
      </View>

      <Pressable
        onPress={() => onDelete(medication)}
        hitSlop={8}
        accessibilityLabel={`Eliminar ${medication.name}`}
        style={({ pressed }) => [styles.delete, pressed && styles.deletePressed]}
      >
        <Text style={styles.deleteLabel}>Eliminar</Text>
      </Pressable>
    </View>
  );
};

export default MedicationItem;

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  timeBlock: {
    backgroundColor: colors.primaryMuted,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.lg,
  },
  time: {
    color: colors.primary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    fontVariant: ['tabular-nums'],
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: 2,
  },
  dose: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  delete: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    backgroundColor: colors.dangerMuted,
    marginLeft: spacing.sm,
  },
  deletePressed: {
    opacity: 0.7,
  },
  deleteLabel: {
    color: colors.danger,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
});
