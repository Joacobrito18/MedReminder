# MedReminder · Brand assets

Direction: **01 Capsule Clock** (primary) + **06 Wordmark · dot** (text/social).
Color: ink blue `#2A4A87`. No gradients, no external fonts.

## Files

| file | use |
|---|---|
| `logo.svg` | full logo (mark + wordmark), light bg — headers, marketing |
| `logomark.svg` | mark only, monochrome — favicons, watermarks |
| `wordmark.svg` | "med·reminder" type-only — footers, email signatures, social bio |
| `favicon.svg` / `favicon.png` | browser tab — 64px square, white-on-blue |
| `icon.png` | **Expo `icon`** — 1024×1024, App Store, iOS home |
| `adaptive-icon.png` | **Expo `android.adaptiveIcon.foregroundImage`** — paired with bg `#2A4A87` |
| `splash.png` | **Expo `splash.image`** — 1284×2778, white bg |
| `icon-template.svg`, `adaptive-icon-foreground.svg`, `splash.svg` | sources for the PNGs above; re-render anytime |
| `icon-180.png`, `icon-120.png`, `icon-87.png`, `icon-60.png` | iOS sizes if you ever bypass Expo |

## `app.json` snippet

```json
{
  "expo": {
    "name": "MedReminder",
    "icon": "./brand/icon.png",
    "splash": {
      "image": "./brand/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#FFFFFF"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./brand/adaptive-icon.png",
        "backgroundColor": "#2A4A87"
      }
    },
    "web": {
      "favicon": "./brand/favicon.png"
    }
  }
}
```

## Color tokens

```
brand        #2A4A87
brand-dark   #1F3868
brand-tint   #E6ECF6
ink          #1A1D24
paper        #FFFFFF
```

## Don'ts

- No mover el reloj fuera de la cápsula.
- No usar el logomark sobre fondos saturados (rojo, verde lima). Ink-blue sobre blanco / warm / charcoal solamente.
- No agregar tagline pegado al wordmark — si hace falta, dejá ≥ 16px de aire.
