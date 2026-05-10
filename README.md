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
3. **Home** — banner con progreso del día, lista de medicaciones del usuario logueado, FAB para agregar, header con saludo y botón de salir.
4. **Alta / Edición** — form con nombre, dosis (opcional), hora (TimePicker nativo) y selector de días de la semana.

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
- Tocá **Crear recordatorio**. Vuelve al Home con un toast de confirmación y la medicación aparece en la lista, ordenada por hora.

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

## Demo

https://drive.google.com/file/d/1joBiFZgQqEpM-vlZeg7f5AsMJjqUx0pY/view?usp=sharing

El video se ve rapido porque tuve que ponerlo en X2 debido a que me quedo un poco largo.