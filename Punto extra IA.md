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
