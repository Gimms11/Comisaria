import { Platform } from 'react-native';

// Helper to determine the best host IP for dev environments
const getLocalHost = () => {
  if (Platform.OS === 'android') {
    // Android emulator host loopback
    return '10.0.2.2';
  }
  return 'localhost';
};

const HOST = getLocalHost();

export const API_CONFIG = {
  // MS-01: Gateway & Auth (Policía)
  GATEWAY_BASE_URL: `http://${HOST}:8001/api/v1`,

  // MS-02: Denuncias Anónimas
  CRIME_REPORTS_BASE_URL: `http://${HOST}:8002/api/v1`,

  // MS-03: Reportes Comunitarios
  COMMUNITY_REPORTS_BASE_URL: `http://${HOST}:8003/api/v1`,

  // MS-04: Guías y Biblioteca TikTok
  GUIDES_BASE_URL: `http://${HOST}:8004/api/v1`,

  TIMEOUT_MS: 12000,
};

export const EMERGENCY_NUMBERS = [
  { name: 'Emergencias PNP', number: '105', subtitle: 'Central Nacional de Emergencias' },
  { name: 'Comisaría La Tinguiña', number: '(056) 256114', subtitle: 'Guardia y Operaciones 24/7' },
  { name: 'Línea 100', number: '100', subtitle: 'Violencia Familiar y de Género' },
  { name: 'SAMU Médica', number: '106', subtitle: 'Ambulancia y Urgencias' },
  { name: 'Bomberos La Tinguiña', number: '116', subtitle: 'Incendios y Rescates' },
];
