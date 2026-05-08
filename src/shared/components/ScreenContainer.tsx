import { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from '@/shared/constants/theme';

type Props = {
  children: ReactNode;
  padded?: boolean;
  style?: ViewStyle;
};

const ScreenContainer = ({ children, padded = true, style }: Props) => {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={[padded ? styles.padded : styles.unpadded, style]}>{children}</View>
    </SafeAreaView>
  );
};

export default ScreenContainer;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  padded: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  unpadded: {
    flex: 1,
  },
});
