# MedReminder

App mobile para el Parcial 1 de Aplicaciones Móviles (ISTEA, 2026).
La opcion que elegi fue Recordatorio de medicación.

## Funcionalidades

- Registro y login local. Al crear cuenta se vuelve al Login para iniciar sesión (no entra automático).
- Sesión persistente: la app recuerda al usuario hasta que cierre sesión.
- Navegación condicional: si no hay sesión, solo se ven las pantallas de auth.
- CRUD de medicaciones (nombre, dosis opcional, hora y **días de la semana**).
- Selector de días con chips L M M J V S D + atajo "Todos / Ninguno". Al menos un día requerido.
- Lista ordenada por hora con FAB para agregar.
- Edición tocando una medicación (reutiliza la pantalla de alta).
- Eliminación con confirmación + swipe-to-delete sobre la card.
- Marcar "tomada hoy" con feedback visual (card gris + tachado + hora de toma).
- **Notificación local semanal** programada por cada día seleccionado a la hora exacta.
- Skip inteligente: al marcar como tomada, se cancelan las notis semanales y se programa una sola para el **próximo día seleccionado**. Cuando ese día pasa, se restauran las semanales automáticamente.
- Cancelación automática de las notificaciones al eliminar la medicación.
- Reprogramación al editar (cancela las notis viejas, crea las nuevas).
- Permisos manejados con mensaje amigable si el usuario los rechaza.
- Feedback rápido vía **toast** en alta, edición, eliminación y creación de cuenta.

## Parcial 2 — Novedades

Ampliación del Parcial 1 con acceso a recursos del dispositivo, testing automatizado y estado global.

### Permisos y acceso a recursos del dispositivo

Cada recurso pide su permiso **antes** de usarse y maneja los tres estados (concedido / pendiente /
denegado). Si el permiso queda rechazado se muestra un mensaje claro y el flujo se cancela sin romper.
La lógica está centralizada en `src/modules/device/`:

| Recurso | Librería | Helper | Asociado a |
|---|---|---|---|
| Cámara / Galería | `expo-image-picker` | `device/image.ts` | **Foto del medicamento** |
| Ubicación (GPS) | `expo-location` | `device/location.ts` | **Farmacia** (coords + dirección por reverse-geocoding) |
| Contactos | `expo-contacts` | `device/contacts.ts` | **Médico / familiar** |
| Calendario | `expo-calendar` | `device/calendar.ts` | **Evento de la toma** |

El helper común `device/permissions.ts` (`ensurePermission`) unifica el manejo de estados y el mensaje.
Además, cada helper está envuelto en `try/catch`: si el acceso falla (GPS apagado, calendario no
editable, etc.) se muestra un mensaje claro con `notifyResourceError` en vez de cortar la app.

- **Cámara y galería:** tomar una foto o elegir una de la galería. La imagen se guarda en el medicamento
  y se muestra como **thumbnail en la lista** (Home) y en el detalle.
- **Ubicación:** botón "Usar mi ubicación" → obtiene coordenadas y dirección aproximada de la farmacia.
- **Contactos:** botón "Elegir contacto" → selector nativo, guarda nombre y teléfono del médico/familiar.
  El nombre se reconstruye desde `firstName`/`lastName` cuando iOS no devuelve el campo `name`.
- **Calendario:** botón "Agregar al calendario" → crea un evento en el calendario del dispositivo para
  la próxima toma, con alarma.

### Pantalla "Adjuntos y recordatorio"

Para no recargar el alta, lo indispensable (nombre, dosis, hora, días) quedó en la pantalla principal y
los recursos del dispositivo se movieron a una **pantalla aparte** (`MedicationExtrasScreen`), a la que
se entra desde una fila *"Adjuntos y recordatorio ›"*. Los datos en curso se comparten entre ambas
pantallas mediante un **draft store** de Zustand (`medication-draft-store.ts`), así no se pierden al
navegar; recién se persisten al guardar la medicación.

### Estado global con Zustand

La lista de medicaciones se migró de `useState` + llamadas directas a storage hacia un **store global de
Zustand** (`src/modules/medications/store/medications-store.ts`). El store orquesta la persistencia
(AsyncStorage) y las notificaciones, y expone acciones `load`, `add`, `update`, `remove`, `toggleTaken`
y selectores (`selectMeds`, `selectTakenCount`). `HomeScreen` y `AddMedicationScreen` leen y escriben el
estado únicamente a través del store, y la pantalla de adjuntos usa el `medication-draft-store`.
(El `AuthContext` se mantuvo como estaba.)

### Testing con Jest + React Native Testing Library

3 suites (12 tests en total) en carpetas `__tests__/`, una por cada categoría que pide la consigna:

| # | Categoría | Qué testea | Ruta |
|---|---|---|---|
| 1 | Lógica de negocio | `formatDays` (función pura) | `src/shared/helpers/__tests__/format-days.test.ts` |
| 2 | Componente reutilizable | `<DayBanner />` (render con RNTL) | `src/modules/medications/components/__tests__/DayBanner.test.tsx` |
| 3 | Store global (Zustand) | acciones `add`/`update`/`remove` + orden, con AsyncStorage y el scheduler mockeados | `src/modules/medications/store/__tests__/medications-store.test.ts` |

Config de Jest en `jest.config.js` (preset `jest-expo` + RNTL). Se corren todos con un comando:

```bash
npm test
```

## Cómo correr

### Requisitos

- Node 20+
- pnpm 10 (o npm — ver nota)
- Expo Go en el celular físico (Android o iOS), conectado a la **misma Wi-Fi** que la PC

### Instalación

```bash
pnpm install
```

> El proyecto incluye `.npmrc` con `node-linker=hoisted` para evitar problemas con symlinks de pnpm en Metro/React Native. 
> De todas formas si preferís npm: `npm install` también funciona.

### Levantar el dev server

```bash
pnpm start
```

Escanear el QR con Expo Go. La primera vez que abras la app te va a pedir permiso para enviar notificaciones — aceptá si querés probar los recordatorios.

### Si falla la conexión LAN (timeout en Expo Go)

```bash
pnpm exec expo start --tunnel
```

EN MI CASO SIEMPRE OPTO DIRECTAMENTE POR LA VERSION --TUNNEL. NUNCA PUDE USARLO DE OTRA FORMA PARA VERLO EN EL CEL

La primera vez te pide instalar `@expo/ngrok` — aceptá. El bundle es un poco más lento pero funciona detrás de cualquier firewall.

### Probar notificaciones

1. Crear una medicación con hora **2-3 minutos en el futuro** desde la hora del celular.
2. Aceptar el permiso de notificaciones.
3. Bloquear la pantalla del celular (las notis se ven mejor con la app fuera de foreground).
4. Esperar hasta la hora configurada → debería llegar la notificación local.

> Las **notificaciones locales programadas funcionan en Expo Go** en SDK 54. Lo que dejó de funcionar en Expo Go fueron las push remotas (no las usamos acá).

## Pantallas

1. **Login** — usuario + contraseña; link a registro.
2. **Registro** — usuario (mín. 5), contraseña + confirmación (mín. 6); valida unicidad. Después del registro vuelve al Login.
3. **Home** — banner con progreso del día, lista de medicaciones del usuario logueado (con thumbnail de la foto si la tiene), FAB para agregar, header con saludo y botón de salir.
4. **Alta / Edición** — form con nombre, dosis (opcional), hora (TimePicker nativo) y selector de días + acceso a "Adjuntos y recordatorio".
5. **Adjuntos y recordatorio** — foto del medicamento, ubicación de la farmacia, contacto del médico/familiar y evento en el calendario.

## Cómo usar la app

### 1. Crear tu cuenta

La primera vez que abrís la app vas a ver la pantalla de **Login**.

- Tocá **"¿Primera vez? Crear cuenta"** abajo.
- Elegí un nombre de usuario (mínimo 5 caracteres) y una contraseña (mínimo 6). Confirmala.
- Tocá **Crear cuenta**. Te muestra un toast confirmando y te devuelve al Login para entrar con tus credenciales recién creadas.

> Los datos se guardan **solo en este teléfono** (AsyncStorage). No hay servidor, no se sincroniza con nada.

### 2. Permitir notificaciones

Apenas entrás al Home, Android te va a pedir permiso para enviar notificaciones. **Aceptá** — sin esto los recordatorios no van a sonar.

Si lo rechazaste sin querer, andá a Ajustes del celular → Apps → Expo Go → Notificaciones, y activalas.

### 3. Agregar tu primera medicación

- En el Home, tocá el **botón azul redondo (+)** abajo a la derecha.
- Completá:
  - **Nombre** (obligatorio): ej. "Ibuprofeno".
  - **Dosis** (opcional): ej. "400mg" o "1 comprimido".
  - **Hora**: tocá la card azul para abrir el TimePicker nativo y elegí la hora.
  - **Días de la semana**: por default vienen los 7 seleccionados. Tocá un chip para des/seleccionarlo, o usá **"Todos / Ninguno"** para alternar todos a la vez. Tiene que haber al menos uno marcado.
- (Opcional) Tocá **"Adjuntos y recordatorio ›"** para sumarle una **foto**, la **ubicación de la farmacia**, un **contacto** (médico/familiar) y un **evento en el calendario**. La primera vez, el celular te va a pedir el permiso de cada recurso. Tocá **Listo** para volver.
- Tocá **Crear recordatorio**. Vuelve al Home con un toast de confirmación y la medicación aparece en la lista, ordenada por hora (con el thumbnail de la foto si le pusiste una).

> **Tip para probar las notis ya:** poné una hora 2-3 minutos en el futuro, dejá los 7 días marcados, bloqueá el celu, y esperá.

### 4. Marcar una medicación como tomada

En cada card del Home, a la derecha hay un **botón circular con check**.

- Tocalo cuando tomes la medicación. La card se pone gris, el nombre tachado y aparece **"✓ HH:MM"** abajo de la hora.
- Las notificaciones de hoy quedan **canceladas automáticamente** y se programa una sola para el **próximo día seleccionado** a la misma hora (si la med es solo Lun-Mié-Vie y la marcaste un lunes, la próxima cae el miércoles).
- Cuando ese día pasa sin marcar, las notificaciones semanales se restauran solas la próxima vez que abras la app.
- Si tocás el check de vuelta, se desmarca.

### 5. Editar o eliminar una medicación

**Editar:** tocá la card (no el check) → se abre el form con los datos cargados → modificá → Guardar.

**Eliminar:** dos formas:

- **Swipe a la izquierda** sobre la card → aparece el botón rojo **Eliminar** → tocalo.
- O abrí la card en modo edición → tocá el ícono de **basurero** arriba a la derecha → confirmá.

Al eliminar se cancela la notificación programada también.

### 6. Cerrar sesión

Arriba a la derecha del Home hay un botón **Salir**. Te devuelve al Login. Tu cuenta y medicaciones quedan guardadas para la próxima vez.

## Punto extra: IA aplicada al desarrollo

Usé un asistente de IA en una **tarea puntual** (el selector de contactos con `expo-contacts`): el
detalle de las herramientas, los prompts y la comparación entre el código generado y el integrado está
en **[Punto Extra IA.md](IA.md)**.

## Demo

**Parcial 1:**
https://drive.google.com/file/d/1joBiFZgQqEpM-vlZeg7f5AsMJjqUx0pY/view?usp=sharing

**Parcial 2:**
https://drive.google.com/file/d/1lr_uZULbKqlJBFahGs3QORPX96ntPCde/view?usp=sharing



# Punto extra: IA aplicada al desarrollo

## Herramienta utilizada

- **Claude Code** corriendo dentro del editor, con acceso al repo para leer y proponer cambios.

## La tarea

Necesitaba que, desde la pantalla de adjuntos de una medicación, el usuario pudiera **elegir un
contacto de la agenda del dispositivo** (médico/familiar) y guardar su nombre y teléfono. Es uno de los
recursos que pide la consigna (`expo-contacts`).

Archivo resultante: [`src/modules/device/contacts.ts`](src/modules/device/contacts.ts).

## Cómo lo trabajé con la IA (prompts efectivos)

Lo que mejor funcionó fue dar **contexto + restricciones**, y después **iterar a partir de lo que
probé en el celular**.

### 1. Generación inicial, siguiendo un patrón existente

> *"Hacé un helper `pickContact` con `expo-contacts` que pida permiso, abra el selector nativo y
> devuelva nombre y teléfono. Manejá el caso de permiso rechazado con un mensaje claro, siguiendo el
> patrón de `requestPermissions` que ya existe."*

Pedirle que imitara un patrón ya presente en el repo hizo que el código quedara consistente con el
resto del proyecto (mismo estilo de manejo de permisos).

### 2. Iteración a partir de un bug real

Al probarlo en el iPhone, el contacto se guardaba con el teléfono pero el nombre aparecía como
"Contacto sin nombre". Le describí exactamente eso:

> *"Seleccioné un contacto y agregó el número, pero me decía 'Contacto sin nombre'."*

El problema era que el selector de iOS no siempre devuelve el campo `name`. La IA agregó una función
`resolveName` que reconstruye el nombre desde los campos disponibles (`firstName` + `middleName` +
`lastName`, y como respaldo `nickname`, `company` o el teléfono).

### 3. Revisión de buenas prácticas

Una vez que funcionaba, le pedí que **revisara el código de los helpers** buscando mejoras de
estructura o robustez:

> *"Fijate si hay algo que se podría mejorar en cuanto a estructura o buenas prácticas y decime."*

Detectó que los helpers de `device/` (ubicación, contactos, calendario, cámara) podían **lanzar una
excepción sin capturar** —por ejemplo si el GPS está apagado o el calendario no es editable—, lo que
podía romper la app. A partir de eso envolví cada helper en `try/catch`, devolviendo `null` y mostrando
un mensaje claro con un helper común `notifyResourceError` ([`src/modules/device/permissions.ts`](src/modules/device/permissions.ts)).
Yo decidí cuáles sugerencias aplicar (apliqué la de robustez y dejé otras de lado).