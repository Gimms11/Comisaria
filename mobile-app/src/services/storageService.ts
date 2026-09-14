import AsyncStorage from '@react-native-async-storage/async-storage';
import { LocalReportReceipt } from '@/types';
import { logger } from '@/utils/logger';

const STORAGE_KEY = '@comisaria_tinguina:saved_reports';

// Fallback en memoria si el módulo nativo no está disponible o falla
let memoryFallback: LocalReportReceipt[] = [];

export const StorageService = {
  async saveReportReceipt(receipt: LocalReportReceipt): Promise<void> {
    try {
      const existing = await this.getMyReports();
      const filtered = existing.filter((r) => r.public_code !== receipt.public_code);
      const updated = [receipt, ...filtered];
      memoryFallback = updated;

      if (AsyncStorage) {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      }
      logger.info('STORAGE', `Comprobante guardado con éxito: ${receipt.public_code}`, {
        type: receipt.type,
        category: receipt.category_name,
      });
    } catch (e: any) {
      logger.warn('STORAGE', 'Persistencia nativa falló, mantenido en memoria:', e?.message || e);
    }
  },

  async getMyReports(): Promise<LocalReportReceipt[]> {
    try {
      if (AsyncStorage) {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as LocalReportReceipt[];
          memoryFallback = parsed;
          return parsed;
        }
      }
      return memoryFallback;
    } catch (e: any) {
      logger.warn('STORAGE', 'No se pudo leer AsyncStorage nativo, usando memoria:', e?.message || e);
      return memoryFallback;
    }
  },

  async clearMyReports(): Promise<void> {
    memoryFallback = [];
    try {
      if (AsyncStorage) {
        await AsyncStorage.removeItem(STORAGE_KEY);
      }
      logger.info('STORAGE', 'Todos los comprobantes locales han sido eliminados');
    } catch (e: any) {
      logger.warn('STORAGE', 'Error al limpiar almacenamiento nativo:', e?.message || e);
    }
  },
};

export default StorageService;

