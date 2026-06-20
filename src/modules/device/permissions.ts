import { Alert } from 'react-native';

export type PermissionLike = {
  granted: boolean;
  canAskAgain?: boolean;
};

/**
 * Pide un permiso y maneja los tres estados (concedido / pendiente / denegado).
 * `request` re-pregunta si todavía está pendiente; si queda denegado mostramos
 * un mensaje claro y devolvemos false para que el flujo se cancele sin romper.
 */
export const ensurePermission = async (
  request: () => Promise<PermissionLike>,
  resourceName: string,
): Promise<boolean> => {
  const result = await request();
  if (result.granted) return true;
  Alert.alert(
    `Permiso de ${resourceName} requerido`,
    `MedReminder necesita acceso a ${resourceName} para esta función. ` +
      `Podés activarlo desde los ajustes del dispositivo.`,
  );
  return false;
};

/** Mensaje claro cuando el acceso al recurso falla por un error inesperado. */
export const notifyResourceError = (resourceName: string): void => {
  Alert.alert(
    'Algo salió mal',
    `No pudimos acceder a ${resourceName}. Intentá de nuevo.`,
  );
};
