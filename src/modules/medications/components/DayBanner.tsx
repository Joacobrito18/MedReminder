import { StyleSheet, Text, View } from 'react-native';

import { colors, fontSize, fontWeight, radius, spacing } from '@/shared/constants/theme';
import { formatLongDate } from '@/shared/helpers/date';

type Props = {
  taken: number;
  total: number;
};

const DayBanner = ({ taken, total }: Props) => {
  const allDone = total > 0 && taken === total;
  const headline = total === 0
    ? 'Sin medicaciones hoy'
    : allDone
      ? 'Día completo'
      : `Quedan ${total - taken} de hoy`;
  const pct = total === 0 ? 0 : Math.min(100, Math.round((taken / total) * 100));

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={[styles.counter, allDone && styles.counterDone]}>
          <Text style={[styles.counterText, allDone && styles.counterTextDone]}>
            {taken}/{total}
          </Text>
        </View>
        <View style={styles.body}>
          <Text style={styles.headline}>{headline}</Text>
          <Text style={styles.date}>{formatLongDate()}</Text>
        </View>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${pct}%` }]} />
      </View>
    </View>
  );
};

export default DayBanner;

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  counter: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.divider,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterDone: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  counterText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  counterTextDone: {
    color: colors.textOnPrimary,
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  headline: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: 2,
  },
  date: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textTransform: 'capitalize',
  },
  progressTrack: {
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.divider,
    marginTop: spacing.md,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: radius.pill,
  },
});
