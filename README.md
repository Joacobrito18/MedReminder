# MedReminder

App mobile para el Parcial 1 de Aplicaciones Móviles (ISTEA, 2026).

**Opción elegida:** Recordatorio de medicación.

## Stack

- Expo SDK 54 + React Native 0.81
- TypeScript (strict)
- React Navigation (Native Stack)
- AsyncStorage para persistencia
- expo-notifications para recordatorios locales
- React Context API para sesión

## Estructura

Organización por feature en `src/modules/` + `src/shared/` para lo transversal. Detalle completo en [ROADMAP.md](./ROADMAP.md).

```
src/
  modules/
    auth/         # context, screens, storage, types
    medications/  # screens, components, storage, notifications
  navigation/     # RootNavigator + AuthStack + AppStack
  shared/         # components, constants/theme, helpers
```

Alias `@/` apunta a `src/` (configurado en `tsconfig.json` + `babel.config.js`).

## Cómo correr

Requisitos: Node 20+, npm, Expo Go en el celular **o** un emulador Android/iOS.

```bash
npm install
npx expo start
```

Escanear el QR con Expo Go (Android) o la app de cámara (iOS).

> ⚠️ Las notificaciones programadas requieren un build de development en SDK 54 (no funcionan en Expo Go en todos los casos). Para probarlas: `npx expo run:android`.

## Funcionalidades

Estado actual al 2026-05-08 (Día 1 del roadmap):

- [x] Setup inicial con TS + alias `@/`.
- [x] Estructura por feature (`modules/auth`, `modules/medications`, `shared`).
- [x] Auth local con AsyncStorage (registro, login, sesión persistente, logout).
- [x] Navegación condicional Auth/App según sesión.
- [x] Componentes reutilizables: `PrimaryButton`, `FormInput`, `ScreenContainer`.
- [ ] CRUD de medicaciones (Día 2).
- [ ] Notificaciones locales (Día 3).
- [ ] Pulido de UI + extras (Día 4).

Plan completo y por días en [ROADMAP.md](./ROADMAP.md).

## Demo

_Pendiente — link al video de YouTube (≤ 1 min) cuando esté listo._
