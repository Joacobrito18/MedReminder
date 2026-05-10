import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from '@expo/vector-icons/Feather';

import { colors, fontSize, fontWeight, radius, spacing } from '@/shared/constants/theme';

type ToastKind = 'success' | 'error' | 'info';

type ToastState = {
  id: number;
  message: string;
  kind: ToastKind;
};

type ToastContextValue = {
  showToast: (message: string, kind?: ToastKind) => void;
};

const DURATION_MS = 2500;
const ToastContext = createContext<ToastContextValue | null>(null);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toast, setToast] = useState<ToastState | null>(null);
  const counter = useRef(0);

  const showToast = useCallback((message: string, kind: ToastKind = 'success') => {
    counter.current += 1;
    setToast({ id: counter.current, message, kind });
  }, []);

  const value = useMemo<ToastContextValue>(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <ToastView
          key={toast.id}
          message={toast.message}
          kind={toast.kind}
          onDismiss={() => setToast((current) => (current?.id === toast.id ? null : current))}
        />
      ) : null}
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
};

type ToastViewProps = {
  message: string;
  kind: ToastKind;
  onDismiss: () => void;
};

const ToastView = ({ message, kind, onDismiss }: ToastViewProps) => {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-80)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, bounciness: 6, speed: 14 }),
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();

    const timeout = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, { toValue: -80, duration: 200, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start(({ finished }) => {
        if (finished) onDismiss();
      });
    }, DURATION_MS);

    return () => clearTimeout(timeout);
  }, [opacity, onDismiss, translateY]);

  const accent =
    kind === 'success' ? colors.success : kind === 'error' ? colors.danger : colors.primary;
  const iconName =
    kind === 'success' ? 'check-circle' : kind === 'error' ? 'alert-circle' : 'info';

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.wrapper,
        { paddingTop: insets.top + spacing.sm, transform: [{ translateY }], opacity },
      ]}
    >
      <Pressable onPress={onDismiss} style={styles.toast} accessibilityRole="alert">
        <View style={[styles.iconBubble, { backgroundColor: accent }]}>
          <Feather name={iconName} size={16} color={colors.textOnPrimary} />
        </View>
        <Text style={styles.message} numberOfLines={2}>
          {message}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    zIndex: 9999,
    elevation: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
    backgroundColor: colors.text,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md + 2,
    borderRadius: radius.md,
    minWidth: 220,
    maxWidth: 480,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  iconBubble: {
    width: 26,
    height: 26,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    flex: 1,
    color: colors.textOnPrimary,
    fontSize: fontSize.sm + 1,
    fontWeight: fontWeight.medium,
    lineHeight: 18,
  },
});
