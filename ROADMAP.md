# Roadmap — MedReminder (Recordatorio de medicación)

App mobile para el Parcial 1 de Aplicaciones Móviles (ISTEA).
Stack: **Expo SDK 54 + React Native 0.81 + TypeScript + React Navigation Stack**.

- **Hoy:** 2026-05-08
- **Entrega:** 2026-05-12 (5 días incluyendo hoy)
- **Exposición:** 2026-05-12

---

## 1. Objetivo y alcance

App local (sin backend) para que un usuario:

1. Se **registre** y **logueé** localmente.
2. Cargue medicaciones (nombre, dosis, hora del día).
3. Vea la lista de sus medicaciones y pueda **borrarlas** (y editarlas, como extra).
4. Reciba una **notificación local diaria** a la hora configurada por cada medicación.
5. Mantenga sus datos al cerrar y reabrir la app.

**Out of scope (no lo pide la consigna y no lo voy a meter):**

- Backend / API / Firebase.
- Cifrado de credenciales.
- Sincronización entre dispositivos.
- Animaciones complejas.
- Múltiples usuarios simultáneos en el mismo device (solo cambio de sesión).

---

## 2. Stack técnico (cerrado)

| Pieza | Librería | Por qué |
|---|---|---|
| Runtime | Expo SDK 54 (managed) | Pedido por la consigna. |
| Lenguaje | TypeScript strict | Reduce bugs, integra con los skills del entorno. |
| Navegación | `@react-navigation/native` + `@react-navigation/native-stack` | La consigna pide textual "React Navigation (Stack Navigation)". |
| Estado auth | React Context API | Suficiente para 1 usuario; no amerita Zustand. |
| Persistencia | `@react-native-async-storage/async-storage` | Pedido textual. Acepta users sin cifrar (nivel inicial). |
| Notificaciones | `expo-notifications` + `expo-device` | Stándar de Expo para notis locales. |
| TimePicker | `@react-native-community/datetimepicker` | Nativo, sin overhead. |
| Estilos | `StyleSheet.create` + tokens centralizados | Pedido textual. |

**No uso:** Zustand, React Query, axios, expo-secure-store, expo-router. La consigna pide Stack Navigation explícito y no hay backend.

---

## 3. Arquitectura de carpetas

Aplico **organización por feature** (módulos) con un `shared/` para lo transversal, adaptado del skill `mobile-architecture` al stack del TP.

```
medreminder/
├── App.tsx                              # Entry: SafeAreaProvider + AuthProvider + RootNavigator
├── index.ts                             # registerRootComponent
├── app.json                             # Config Expo (incluye plugin expo-notifications)
├── tsconfig.json                        # paths: { "@/*": ["src/*"] }
├── babel.config.js                      # plugin module-resolver para alias @/
├── ROADMAP.md                           # Este archivo
├── README.md                            # Cómo correr + features + link demo
└── src/
    ├── modules/
    │   ├── auth/
    │   │   ├── context/
    │   │   │   └── AuthContext.tsx      # Provider + useAuth() hook
    │   │   ├── screens/
    │   │   │   ├── LoginScreen.tsx
    │   │   │   └── RegisterScreen.tsx
    │   │   ├── storage/
    │   │   │   └── users-storage.ts     # getUsers/saveUser/findUser (AsyncStorage)
    │   │   └── types.ts                 # User, AuthState
    │   └── medications/
    │       ├── components/
    │       │   └── MedicationItem.tsx   # Componente reutilizable (REQ obligatorio)
    │       ├── screens/
    │       │   ├── HomeScreen.tsx       # Lista + FAB "+"
    │       │   └── AddMedicationScreen.tsx
    │       ├── storage/
    │       │   └── medications-storage.ts  # CRUD por usuario
    │       ├── notifications/
    │       │   └── scheduler.ts         # schedule/cancel daily reminders
    │       └── types.ts                 # Medication
    ├── navigation/
    │   ├── RootNavigator.tsx            # Decide AuthStack vs AppStack según user
    │   ├── AuthStack.tsx                # Login + Register
    │   ├── AppStack.tsx                 # Home + AddMedication
    │   └── types.ts                     # RootStackParamList tipado
    └── shared/
        ├── components/
        │   ├── PrimaryButton.tsx        # Pressable + loading + disabled
        │   ├── FormInput.tsx            # TextInput con label + error
        │   └── ScreenContainer.tsx      # SafeArea + padding consistente
        ├── constants/
        │   └── theme.ts                 # colors, spacing, radius, fonts
        └── helpers/
            ├── generate-id.ts           # ID corto para entidades locales
            └── format-time.ts           # "08:30" ↔ Date helpers
```

**Reglas que aplico:**
- Screens viven dentro de su feature module, no en una carpeta global `screens/`.
- Si algo lo usa solo `medications/` → vive ahí. Si lo usan ≥2 features → sube a `shared/`.
- Tipos colocalizados con el módulo. Solo los compartidos (ej: `RootStackParamList`) viven aparte.
- Sin barrel files (`index.ts` reexportando todo) — rompen tree-shaking y crean ciclos.
- Imports con alias `@/` para evitar `../../../`.

---

## 4. Modelo de datos

```ts
// src/modules/auth/types.ts
type User = {
  username: string;       // unique, lowercase
  password: string;       // plano, sin cifrado (consigna lo permite)
  createdAt: string;      // ISO
};

// src/modules/medications/types.ts
type Medication = {
  id: string;
  name: string;           // "Ibuprofeno 400mg"
  dose?: string;          // "1 comprimido"
  time: string;           // "HH:mm" (24h) → hora del recordatorio diario
  notificationId?: string; // ID de expo-notifications para poder cancelarla
  createdAt: string;      // ISO
};
```

### Layout de AsyncStorage

| Key | Valor | Notas |
|---|---|---|
| `@medreminder:users` | `User[]` | Todos los usuarios registrados en el device. |
| `@medreminder:session` | `{ username }` o ausente | Sesión actual. Se borra en logout. |
| `@medreminder:meds:${username}` | `Medication[]` | Una clave por usuario para que no se mezclen. |

Prefijo `@medreminder:` para no chocar con otras apps en testing.

---

## 5. Pantallas

### 5.1 LoginScreen
- Inputs: `username`, `password`.
- Validación: ambos requeridos, no vacíos.
- Acción: busca en `users-storage`, si match → setea sesión, navega a Home.
- Link a Register.
- Botón "Entrar" deshabilitado si los campos están vacíos.

### 5.2 RegisterScreen
- Inputs: `username`, `password`, `confirmPassword`.
- Validación: username único (no existe ya), password ≥ 4 chars, confirmación coincide.
- Acción: guarda user, auto-login, navega a Home.
- Link a Login.

### 5.3 HomeScreen (App principal)
- Header: saludo "Hola, {username}" + botón Logout (icono).
- Body:
  - Si no hay medicaciones → empty state ilustrado con CTA "Agregá tu primera medicación".
  - Si hay → `FlatList` de `MedicationItem`.
- FAB flotante "+" abajo a la derecha → AddMedicationScreen.
- Cada item: nombre, dosis, hora grande, botón eliminar (con confirm).

### 5.4 AddMedicationScreen
- Form con: nombre*, dosis (opcional), hora* (TimePicker).
- Botón "Guardar":
  1. Valida.
  2. Pide permiso de notificaciones si no lo tiene.
  3. Programa notificación diaria a la hora.
  4. Guarda en AsyncStorage con `notificationId`.
  5. Vuelve a Home (`navigation.goBack()`).
- Botón "Cancelar" → goBack.

---

## 6. Plan por días

### Día 1 — 2026-05-08 (HOY)

**Foco:** Setup completo + auth funcionando end-to-end.

- [x] Crear proyecto Expo TS.
- [ ] Instalar dependencias.
- [ ] Configurar alias `@/` (tsconfig + babel).
- [ ] Crear estructura de carpetas y `theme.ts`.
- [ ] Implementar `users-storage.ts` y `AuthContext`.
- [ ] Pantallas Login y Register funcionales (sin estilos finos aún).
- [ ] `RootNavigator` que cambia entre AuthStack / AppStack según sesión.
- [ ] HomeScreen placeholder ("Sesión iniciada como X" + Logout).
- [ ] **Hito:** registrarse, cerrar la app, reabrir, seguir logueado. Logout vuelve a Login.

### Día 2 — 2026-05-09

**Foco:** Medications CRUD local + persistencia.

- [ ] `medications-storage.ts` (get / add / remove / update por usuario).
- [ ] `Medication` types y helpers (`generate-id`, `format-time`).
- [ ] `MedicationItem` reutilizable (cumple REQ "≥1 componente reutilizable").
- [ ] `HomeScreen` con FlatList + empty state + FAB.
- [ ] `AddMedicationScreen` con form completo (nombre, dosis, TimePicker).
- [ ] Eliminar medicación con `Alert.alert` confirm.
- [ ] **Hito:** agregar/listar/eliminar medicaciones; persisten al reabrir.

### Día 3 — 2026-05-10

**Foco:** Notificaciones locales.

- [ ] `scheduler.ts`: `requestPermissions`, `scheduleDaily(med)`, `cancel(notificationId)`.
- [ ] Integrar al crear (programar) y al eliminar (cancelar) medicación.
- [ ] Manejo de permisos denegados (mostrar alerta amigable).
- [ ] Configurar canal Android (`expo-notifications` lo requiere).
- [ ] Testear en device físico (notificaciones locales programadas no andan en simulador iOS web).
- [ ] **Hito:** crear medicación con hora futura cercana, esperar, ver la noti dispararse.

### Día 4 — 2026-05-11

**Foco:** Pulido + entrega.

- [ ] Estilos finos: theme aplicado coherentemente, espaciados, contraste, headers.
- [ ] Estados de carga / vacío / error en cada pantalla.
- [ ] **Extras de exposición** (ver §7).
- [ ] README final con: opción elegida, cómo correr, features, link demo.
- [ ] Grabar **video demo ≤ 1 min** y subirlo a YouTube (no listado, link en README).
- [ ] Crear repo público en GitHub, subir todo, validar que se clona y corre limpio.
- [ ] **Hito:** repo listo + video subido.

### Día 5 — 2026-05-12 (entrega y exposición)

**Foco:** Margen para fixes + envío.

- [ ] Última prueba en device físico desde un clon limpio del repo.
- [ ] Mail a `martin.cornejo@istea.com.ar` con link al repo y al video.
- [ ] Ensayar exposición (5 min): demo + decisiones técnicas.

---

## 7. Extras de exposición (post-mínimo)

Solo entran si los Días 1-3 cierran a tiempo. Se priorizan en este orden:

1. **Editar medicación** (no solo borrar) → reusar `AddMedicationScreen` en modo edición vía param.
2. **Confirm dialog** antes de eliminar (`Alert.alert`).
3. **Múltiples horarios** por medicación (array de `HH:mm`) — agrega complejidad al modelo, decidir sólo si Día 3 cerró antes.
4. **Marcar "tomada hoy"** con feedback visual en el item.
5. **Empty state** con icono y CTA prominente.

Si algo de §7 no entra, no es bloqueante para la entrega.

---

## 8. Checklist de entrega (consigna ↔ implementación)

| Requisito de la consigna | Cumplimiento |
|---|---|
| View, Text, TextInput, Button, TouchableOpacity | Uso `Pressable` (mejor feedback) en lugar de `TouchableOpacity`, los demás sí. |
| StyleSheet | Sí, en cada componente. |
| ≥1 componente reutilizable | `MedicationItem` + `PrimaryButton` + `FormInput` (3, supero el mínimo). |
| React Navigation Stack | `@react-navigation/native-stack`. |
| 4 pantallas: Login, Registro, Home, Alta | Las 4 (+ stack condicional auth/app). |
| Auth local con AsyncStorage | `users-storage.ts` + `AuthContext`. |
| No permitir acceso sin login | `RootNavigator` decide qué stack montar según sesión. |
| AsyncStorage para datos principales | `medications-storage.ts` por usuario. |
| Agregar / listar / eliminar | Sí en HomeScreen + AddMedicationScreen. |
| Persistir al cerrar app | Sí, AsyncStorage. |
| ≥1 notificación local | Programada al crear medicación, cancelada al eliminar. |
| Repo público + README + video YouTube | Día 4. |

---

## 9. Riesgos y contingencias

| Riesgo | Probabilidad | Mitigación |
|---|---|---|
| Permisos de notis denegados en Android Expo Go | Alta | Documentar en README; probar también en build de development. SDK 54 puede requerir dev build para notis programadas — verificar Día 3 temprano. |
| TimePicker comportamiento distinto Android/iOS | Media | Manejar `mode='time'` y tener fallback simple si rompe. |
| Babel module-resolver no resuelve en runtime | Baja | Si falla, vuelvo a imports relativos — el alias es nice-to-have. |
| Quedarme corto de tiempo | Media | Días 1-3 son el path crítico. Día 4 es buffer. Si voy retrasado, descarto §7 entero. |

---

## 10. Convenciones de código

- **Naming:**
  - Componentes y screens: `PascalCase.tsx` (`HomeScreen.tsx`, `MedicationItem.tsx`).
  - Hooks / helpers / storage: `kebab-case.ts` (`users-storage.ts`, `format-time.ts`).
  - Tipos: `PascalCase` (`User`, `Medication`).
- **Imports:** orden externos → `@/modules/...` → `@/shared/...` → relativos.
- **Sin `any`.** Donde no sé el tipo, `unknown` y narrowing.
- **Sin barrel files** en módulos.
- **Comentarios:** solo cuando el "porqué" no es evidente. Nada de comentarios que repiten el código.
- **`StyleSheet.create` al final del archivo**, una sola const `styles`.
- **Theme tokens centralizados.** Cero colores hardcodeados en componentes.
