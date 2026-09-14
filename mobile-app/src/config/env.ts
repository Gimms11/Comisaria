/**
 * Validación y configuración de variables de entorno para la aplicación móvil
 */

const DEFAULT_CLOUD_URLS = {
  MS01: 'https://comisaria-ms01-auth-264198079598.us-central1.run.app',
  MS02: 'https://comisaria-ms02-denuncias-264198079598.us-central1.run.app',
  MS03: 'https://comisaria-ms03-reportes-264198079598.us-central1.run.app',
  MS04: 'https://comisaria-ms04-guias-264198079598.us-central1.run.app',
};

export const Env = {
  MS01_URL: process.env.EXPO_PUBLIC_MS01_URL || DEFAULT_CLOUD_URLS.MS01,
  MS02_URL: process.env.EXPO_PUBLIC_MS02_URL || DEFAULT_CLOUD_URLS.MS02,
  MS03_URL: process.env.EXPO_PUBLIC_MS03_URL || DEFAULT_CLOUD_URLS.MS03,
  MS04_URL: process.env.EXPO_PUBLIC_MS04_URL || DEFAULT_CLOUD_URLS.MS04,
  API_HOST: process.env.EXPO_PUBLIC_API_HOST,
  IS_DEV: __DEV__,
} as const;

export default Env;
