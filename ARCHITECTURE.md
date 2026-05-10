# MedReminder — Arquitectura del código

Documento técnico para uso personal. Explica cómo está armado el proyecto por dentro: stack, capas, flujo de datos, decisiones, convenciones y deuda conocida.

---

## 1. Stack

| Capa | Elección | Por qué |
|---|---|---|
| Runtime | Expo SDK 54 + React Native 0.81 | Permite correr en Expo Go sin build nativo. Cumple el requisito del parcial ("Expo o APK"). |
| Lenguaje | TypeScript estricto (`"strict": true`) | Catch de errores en compile-time. Tipado de Medication, AuthState, navegación. |
| Navegación | `@react-navigation/native-stack` v7 | Stack nativo. Dos stacks separados según el estado de auth. |
| Storage local | `@react-native-async-storage/async-storage` 2.x | Persistencia simple key-value. No hace falta SQLite para este scope. |
| Notificaciones | `expo-notifications` 0.32 | Locales programadas (DAILY + DATE). En SDK 54 siguen funcionando en Expo Go (sólo las push remotas dejaron de andar). |
| Picker de hora | `@react-native-community/datetimepicker` | Time picker nativo Android/iOS. |
| Iconos | `@expo/vector-icons/Feather` | Ya viene con Expo, sin dep extra. |
| Package manager | pnpm 10 con `node-linker=hoisted` | Sin symlinks → Metro no se queja. |

**Path alias:** `@/` → `src/` (configurado en `babel.config.js` con `babel-plugin-module-resolver` + `tsconfig.json` `paths`). Hay que mantener los dos en sync — el de Babel resuelve en runtime, el de TS sólo para el editor.

---

## 2. Estructura de carpetas

```
MedReminder/
├── App.tsx                    # entry: Providers + setup de notificaciones
├── index.ts                   # registerRootComponent(App)
├── app.json                   # config de Expo (plugins, iconos, splash)
├── babel.config.js            # preset-expo + module-resolver
├── tsconfig.json              # extends expo/tsconfig.base + strict + paths
├── .npmrc                     # node-linker=hoisted (pnpm)
└── src/
    ├── modules/               # features verticales (cada una con su storage, types, screens)
    │   ├── auth/
    │   │   ├── context/AuthContext.tsx
    │   │   ├── screens/{Login,Register}Screen.tsx
    │   │   ├── storage/users-storage.ts
    │   │   └── types.ts
    │   └── medications/
    │       ├── components/{DayBanner,MedicationItem}.tsx
    │       ├── notifications/scheduler.ts
    │       ├── screens/{Home,AddMedication}Screen.tsx
    │       ├── storage/medications-storage.ts
    │       └── types.ts
    ├── navigation/            # stacks, root navigator, tipos de rutas
    │   ├── AppStack.tsx       # signedIn → Home + AddMedication
    │   ├── AuthStack.tsx      # signedOut → Login + Register
    │   ├── RootNavigator.tsx  # decide cuál mostrar según AuthState
    │   └── types.ts           # AuthStackParamList, AppStackParamList
    └── shared/                # cross-cutting (sin dependencias a modules)
        ├── components/{FormInput,ScreenContainer,PrimaryButton}.tsx
        ├── constants/theme.ts # colors, spacing, radius, fontSize, fontWeight
        └── helpers/{date,format-time,generate-id,medication-status}.ts
```

**Regla de import:**
- `shared/` no importa de `modules/` ni de `navigation/`.
- `modules/auth/` y `modules/medications/` no se importan entre sí (la única conexión es `useAuth()` desde `medications/screens/*` para leer el `username` del usuario logueado).
- `navigation/` importa screens de `modules/*`.

---

## 3. Entrada y bootstrap (`App.tsx`)

```ts
Notifications.setNotificationHandler({...});  // muestra banner + sonido en foreground

<SafeAreaProvider>
  <AuthProvider>             // restaura sesión desde AsyncStorage
    <StatusBar style="dark" />
    <RootNavigator />        // muestra Auth o App según AuthState
  </AuthProvider>
</SafeAreaProvider>
```

`useEffect(setupAndroidChannel, [])` crea el canal `med-reminders` (nombre, importance HIGH, vibración, sound default). En iOS es no-op.

---

## 4. Auth

### Flujo

```
App.tsx
 └─ AuthProvider (mount)
     ├─ getSession() → lee @medreminder:session
     │   ├─ found  → setState({ status: 'signedIn', user })
     │   └─ none   → setState({ status: 'signedOut' })
     │
     └─ expone signIn / signUp / signOut

RootNavigator
 ├─ status: 'loading'   → ActivityIndicator full-screen
 ├─ status: 'signedIn'  → AppStack
 └─ status: 'signedOut' → AuthStack
```

### Storage (`users-storage.ts`)

Dos keys en AsyncStorage:
- `@medreminder:users` → `User[]` (lista de cuentas registradas en este device)
- `@medreminder:session` → `{ username }` (sesión activa, si existe)

```ts
type User = {
  username: string;
  password: string;          // ⚠ guardada en plano (ver §10)
  createdAt: string;         // ISO
};
```

API: `getUsers`, `findUser`, `createUser`, `validateCredentials`, `getSession`, `saveSession`, `clearSession`.

### Errors

`createUser` tira `'USERNAME_TAKEN'`, `signIn` tira `'INVALID_CREDENTIALS'`. Las screens los matchean por `e.message` y muestran mensaje en español.

---

## 5. Medications

### Modelo (`types.ts`)

```ts
type NotificationKind = 'daily' | 'oneshot';

type Medication = {
  id: string;                       // generateId(): timestamp36 + random36
  name: string;
  dose?: string;
  time: string;                     // 'HH:MM' 24h
  notificationId?: string;          // ID que devolvió expo-notifications
  notificationKind?: 'daily' | 'oneshot';
  lastTakenAt?: string;             // ISO de la última vez marcada como tomada
  createdAt: string;                // ISO
};
```

### Storage (`medications-storage.ts`)

Una key por usuario: `@medreminder:meds:<username>` → `Medication[]`.

API: `getMedications`, `addMedication`, `removeMedication`, `updateMedication` (patch parcial), `markMedicationTaken`, `findMedication`.

`updateMedication` recibe un `Partial<Omit<Medication, 'id' | 'createdAt'>>` y mergea sobre el record existente. Es el único lugar donde se mutan campos como `notificationId`, `notificationKind`, `lastTakenAt`.

---

## 6. Notificaciones — la parte que más cuesta entender

### Helpers (`scheduler.ts`)

| Función | Qué hace |
|---|---|
| `setupAndroidChannel()` | Crea canal `med-reminders` con importance HIGH. Llamado en `App.tsx` mount. |
| `requestPermissions()` | Pide permiso, devuelve boolean. Si ya tenía, no vuelve a pedir. |
| `scheduleDaily(med)` | Schedule recurrente con `SchedulableTriggerInputTypes.DAILY`. Devuelve `notificationId`. |
| `scheduleOneShot(med, date)` | Schedule único con `SchedulableTriggerInputTypes.DATE`. Devuelve `notificationId`. |
| `tomorrowAt(time)` | Helper: devuelve `Date` de mañana a la hora `HH:MM`. Para programar la oneshot. |
| `cancel(notificationId)` | Cancela. Si el ID ya no existe, swallow del error (no es real). |
| `parseTime(time)`, `buildContent(med)` | Helpers internos privados. |

### Skip inteligente (lo más sutil)

Cuando el usuario marca una medicación como tomada **hoy**, no quiero que la noti diaria suene de nuevo hoy. Pero sí necesito que vuelva a sonar mañana.

**Estrategia híbrida:**

1. **Al marcar tomada** (`HomeScreen.handleToggleTaken`):
   - Cancelo la noti actual (era `daily`).
   - Programo una `oneshot` para mañana a la misma hora.
   - Persisto `notificationKind: 'oneshot'` + `lastTakenAt: now`.

2. **Al desmarcar** (mismo handler, branch inverso):
   - Cancelo la `oneshot`.
   - Reprogramo la `daily`.
   - Persisto `notificationKind: 'daily'` + `lastTakenAt: undefined`.

3. **Al volver al Home** (`useFocusEffect` → `reconcileNotifications`):
   - Para cada med con `notificationKind === 'oneshot'`:
     - Si `lastTakenAt` ya **no es de hoy** (porque pasó la medianoche), la oneshot es "stale": ya disparó (o va a disparar y luego nada más).
     - La cancelo y la reemplazo por una `daily` fresca.
     - Update del record con el nuevo `notificationId` y `notificationKind: 'daily'`.

### Trade-off conocido

La reconciliación corre en `useFocusEffect`, no en background. **Si el usuario marca tomada un lunes y no abre la app hasta el miércoles**, el martes no recibe nada (la oneshot ya disparó el martes a las HH:MM y luego no hay daily reprogramada hasta que abra).

Aceptable para el parcial. Fix real requiere dev build con background task (`expo-task-manager` + `expo-background-fetch`), que rompe Expo Go.

### Flujo cuando se edita una medicación

`AddMedicationScreen.handleSave` en modo edit:

1. Decide si la nueva noti debe ser `oneshot` o `daily`:
   - `skipToday = isEditing && wasTakenToday(originalLastTakenAt)` → si la original ya estaba tomada hoy, mantengo el skip.
2. Programa la nueva noti (`scheduleOneShot` o `scheduleDaily`).
3. `updateMedication` con los nuevos campos.
4. **Después** cancela la noti vieja (`originalNotificationId`). Importante: se cancela después de programar la nueva — si fallara la nueva, la vieja sigue activa.
5. Si todo el bloque tira, intenta cancelar la nueva noti que sí se llegó a programar (cleanup).

### Flujo al eliminar

Hay dos puntos de delete:
- **Swipe en Home** → `HomeScreen.handleDelete`: Alert.alert → cancel + remove + setMeds.
- **Botón basurero en Edit** → `AddMedicationScreen.handleDelete`: Alert.alert → cancel + remove + goBack.

Los dos cancelan la noti antes de borrar el record.

---

## 7. Pantallas

### `HomeScreen`

- Carga: `useFocusEffect` corre `getMedications` + `reconcileNotifications` cada vez que se enfoca (volver desde AddMedication también).
- Render condicional:
  - `loading` → ActivityIndicator.
  - `meds.length === 0` → empty state con CTA grande.
  - default → `<DayBanner taken total />` + lista `<FlatList>` de `<MedicationItem>`.
- Estado local: `meds`, `loading`. No hay state global de medicaciones — todo flujo es load-on-focus.
- `takenCount` se calcula con `useMemo` filtrando por `wasTakenToday`.

### `AddMedicationScreen`

Reutilizada para alta y edición. La distingue `route.params?.medicationId`.

- En edit: `useEffect` hace `findMedication` y popula los campos + guarda `originalNotificationId` y `originalLastTakenAt` para el flujo de skip-noti al guardar.
- TimePicker: en Android se abre como modal y se cierra solo al elegir; en iOS se renderiza inline con `display='spinner'`.
- Validación inline: nombre no vacío, time matchea `/^\d{2}:\d{2}$/`.
- `useLayoutEffect(setOptions { headerShown: false })` es defensivo — el AppStack ya lo tiene global, pero esto previene flicker si en algún momento se cambia.

### `LoginScreen` / `RegisterScreen`

Idénticos en estructura. `useAuth().signIn / signUp`. Errores se mappean por `e.message`. Submit deshabilitado con `canSubmit` (todos los campos válidos + no submitting). En Login el username se normaliza con `.trim().toLowerCase()` para evitar que "Joaco" y "joaco" sean cuentas distintas.

---

## 8. Componentes compartidos

| Componente | Responsabilidad |
|---|---|
| `ScreenContainer` | SafeAreaView + padding opcional. Edges: top/left/right (no bottom — los footers manejan su propio safe area). |
| `FormInput` | Input + label + error/hint. `forwardRef` para que el padre pueda enfocar. |
| `PrimaryButton` | **Sin uso actual** — quedó del primer pase. Cada screen tiene su botón inline porque cambian alturas/colores. Candidato a borrar. |
| `MedicationItem` | Card con time-rail + body + check + swipe-to-delete (PanResponder + Animated.spring). |
| `DayBanner` | Card con counter circular X/Y + headline + fecha + barra de progreso. |

### `MedicationItem` — swipe-to-delete

Implementado con `PanResponder` + `Animated.Value` (sin Reanimated). Lógica:
- `translateX` se mueve entre 0 y `-DELETE_WIDTH` (-92).
- `onMoveShouldSetPanResponder` solo activa si `|dx| > 6` y `|dy| < 8` (filtra scroll vertical).
- Al soltar: si pasó el `SWIPE_THRESHOLD`, snap a `-DELETE_WIDTH`; si no, snap a 0.
- `isOpenRef` previene que un tap en la card abra edit cuando está abierto el botón delete (primer tap cierra).

---

## 9. Theme

Toda la paleta vive en `src/shared/constants/theme.ts`. **Nunca** hardcodear colores en componentes — siempre referenciar `colors.X`.

Nombres clave:
- `primary` (#2A4A87 azul tinta), `primaryMuted` (fondo cápsulas), `primaryDark` (no se usa hoy).
- `bg / surface` (#FFFFFF) y `surfaceMuted` (#FAF7F1, beige cálido para cards "tomadas").
- `text / textSoft / textMuted / textMutedSoft` — escalera de jerarquía tipográfica.
- `border` (#E6E8EC) vs `divider` (#F0F1F4) — border es de cards, divider es de líneas internas.
- `success / warning / danger` + sus `Muted` (background pastel para badges).

Tokens:
- `spacing.{xs:4, sm:8, md:12, lg:16, xl:24, xxl:32, xxxl:48}`.
- `radius.{sm:8, md:12, lg:16, xl:22, pill:999}`.
- `fontSize.{xs:12, sm:13, md:15, lg:17, xl:22, xxl:30, hero:48}`.
- `fontWeight.{regular:400, medium:500, semibold:600, bold:700}`.

---

## 10. Cosas que sé que están mal / deuda

- **Contraseñas en plano** en AsyncStorage. El parcial no pidió hash y no hay servidor, pero un hash con `expo-crypto` (SHA-256 + salt) sería trivial. Trade-off de tiempo.
- **Sin tests**. No se pidieron. Si los agregara, los primeros serían: `medications-storage` (puro), `medication-status` (puro), `scheduler.tomorrowAt` (puro). Las screens irían con react-native-testing-library.
- **`PrimaryButton` sin uso** — borrar.
- **Reconcile sólo on focus** (ver §6 — trade-off del skip inteligente).
- **No hay i18n** — strings hardcodeadas en español. Para esta app monolingüe está bien.
- **No hay tipos explícitos en los `Stack.Navigator`** más allá de `ParamList` — algunos `screenOptions` se podrían tipar mejor.
- **`getMedications` no cachea** — cada `useFocusEffect` lee AsyncStorage. Para 10 records está bien; si llegaran a ser cientos, conviene un context o `react-query`.

---

## 11. Convenciones

- **Naming archivos**: `PascalCase.tsx` para componentes y screens, `kebab-case.ts` para helpers/storage.
- **Default export** para componentes y screens; **named exports** para helpers, storage, types.
- **Imports** ordenados: react/RN/libs primero, luego `@/...` (alias), separados por línea en blanco.
- **`async/await`** siempre, nunca `.then()`.
- **Errors de domain** se lanzan como `new Error('CODE_EN_MAYUSCULAS')` y se matchean con `e.message` arriba. No hay clases de error custom — overkill para el scope.
- **Sin `any`**. Si TS no infiere, anotar.
- **Sin librerías de animación** (Reanimated, Moti). PanResponder + Animated alcanzan.
- **Sin librerías de form** (React Hook Form, Formik). useState + validación manual a mano alcanza para 3 campos.

---

## 12. Comandos útiles

```bash
pnpm start                    # expo start
pnpm exec expo start --tunnel # cuando LAN no funciona (mi caso default)
pnpm exec tsc --noEmit        # type-check sin emitir
```

No hay lint, ni format, ni test scripts configurados — fuera de scope para el parcial.
