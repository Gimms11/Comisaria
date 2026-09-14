import { QueryClient, onlineManager } from '@tanstack/react-query';
import NetInfo from '@react-native-community/netinfo';
import { Platform } from 'react-native';
import { logger } from '@/utils/logger';

if (Platform.OS !== 'web') {
  onlineManager.setEventListener((setOnline) => {
    return NetInfo.addEventListener((state) => {
      setOnline(!!state.isConnected);
    });
  });
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Cold-start tolerant: hasta 2 reintentos para microservicios de Cloud Run
        if (failureCount < 2) {
          logger.warn('API', `⏳ Reintento automático de consulta (#${failureCount + 1}) por posible cold-start`);
          return true;
        }
        return false;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
      staleTime: 1000 * 60 * 3, // 3 minutos de frescura
      gcTime: 1000 * 60 * 15, // 15 minutos en caché
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 0, // Mutaciones cívicas (denuncia / reporte) no se duplican automáticamente
      onError: (error: any) => {
        logger.error('API', 'Error en mutación de datos:', error);
      },
    },
  },
});

export default queryClient;
