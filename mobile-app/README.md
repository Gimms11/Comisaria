# Mobile App - Comisaría La Tinguiña

Aplicación móvil ciudadana construida con **React Native** y **Expo (SDK 57)**.

---

## 🛠️ Requisitos Previos

- **Node.js**: >= 18.x
- **Java JDK**: 17 (Requerido por Gradle 9 / Android Gradle Plugin)
- **Android SDK**: `platform-tools`, `build-tools`, `platforms;android-35` configurados en variable de entorno `ANDROID_HOME`.

---

## 🚀 Compilación Local (APK Android)

> **Importante:** Ejecutar todos los comandos desde la carpeta `mobile-app/`, no desde la raíz del repositorio.

### Método 1: EAS Build Local

Usa la configuración de `eas.json` (perfil `preview` configurado para generar `.apk` instalable):

```bash
cd mobile-app
npm install
npx eas-cli build --profile preview --platform android --local
```

---

### Método 2: Expo Prebuild + Gradle Directo

Genera o actualiza el proyecto nativo `android/` y compila directamente con el wrapper de Gradle:

```bash
# 1. Posicionarse en mobile-app
cd mobile-app
npm install

# 2. Regenerar/actualizar código nativo Android
npx expo prebuild --platform android

# 3. Entrar a la carpeta nativa y compilar APK de release
cd android
.\gradlew assembleRelease
```

#### Ubicación del APK generado:

El archivo resultante se ubica en:

```text
mobile-app/android/app/build/outputs/apk/release/app-release.apk
```

---

## 💻 Desarrollo Local (Expo Go / Dev Client)

```bash
cd mobile-app
npm install
npm run start
```
