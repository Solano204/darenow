# Instalar

```bash
cd app
npm install
npx expo start
```

Ya está. No hace falta `--fix`: las versiones del `package.json` son exactamente las que pide el SDK 57.

## Si algo falla

**`ERESOLVE unable to resolve dependency tree`**

El proyecto trae un `.npmrc` con `legacy-peer-deps=true` que lo evita. Si lo borraste:

```bash
npm install --legacy-peer-deps
```

**`Cannot find module 'babel-preset-expo'`**

```bash
npm install --save-dev babel-preset-expo
```

**Metro se queda con caché vieja**

```bash
npx expo start -c
```

**Empezar de cero**

```bash
rm -rf node_modules package-lock.json
npm install
npx expo start -c
```

En Windows con Git Bash, `rm -rf` funciona igual.

## En el teléfono

Desde el rediseño Goma y Magnesia la app usa módulos nativos (Reanimated, Skia y el inicio de sesión de Google), así que **ya no corre en Expo Go**. Compila un cliente de desarrollo una vez (`npx expo run:android`, o `eas build --profile development`) y luego usa `npx expo start --dev-client`. La carpeta `android/` local es de una compilación anterior (con la firma editada a mano para `scripts/build-local-aab.sh`): no la regeneres con `prebuild`. Para que el splash sea oscuro en compilaciones locales, cambia `splashscreen_background` y `activityBackground` a `#1B1C1E` en `android/app/src/main/res/values/colors.xml`; EAS lo toma de `app.json`.

Lo que sigue solo aplica a versiones anteriores al rediseño.

Instala **Expo Go** (Play Store o App Store) y escanea el QR. En iPhone se escanea con la cámara normal, no desde dentro de Expo Go.

El teléfono y la computadora tienen que estar en el mismo WiFi. Si no conecta:

```bash
npx expo start --tunnel
```
