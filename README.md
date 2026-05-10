# MedReminder

App mobile para el Parcial 1 de Aplicaciones Móviles (ISTEA, 2026).
La opcion que elegi fue Recordatorio de medicación.

## Funcionalidades

- Registro y login local.
- Sesión persistente: la app recuerda al usuario hasta que cierre sesión.
- Navegación condicional: si no hay sesión, solo se ven las pantallas de auth.
- CRUD de medicaciones (nombre, dosis opcional, hora del recordatorio).
- Lista ordenada por hora con FAB para agregar.
- Edición tocando una medicación (reutiliza la pantalla de alta).
- Eliminación con confirmación (`Alert.alert`).
- Marcar "tomada hoy" con feedback visual.
- **Notificación local diaria** programada por cada medicación a su hora.
- Skip inteligente: al marcar como tomada, se cancela la noti diaria y se programa una sola para mañana. Al día siguiente se restaura la diaria automáticamente.
- Cancelación automática de la notificación al eliminar la medicación.
- Reprogramación al editar (cancela la noti vieja, crea una nueva).
- Permisos manejados con mensaje amigable si el usuario los rechaza.

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
2. **Registro** — usuario, contraseña, confirmación; valida unicidad y mínimo 4 caracteres.
3. **Home** — lista de medicaciones del usuario logueado, FAB para agregar, header con saludo y botón de salir.
4. **Alta / Edición** — form con nombre, dosis (opcional), hora (TimePicker nativo).

## Demo

_Pendiente — link al video de YouTube (≤ 1 min) cuando esté listo._
