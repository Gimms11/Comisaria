import { Platform } from 'react-native';
import { LocalReportReceipt } from '@/types';

const STORAGE_KEY = 'comisaria_tinguina_my_reports';

// In-memory fallback
let memoryStore: LocalReportReceipt[] = [];

export const StorageService = {
  async saveReportReceipt(receipt: LocalReportReceipt): Promise<void> {
    try {
      const existing = await this.getMyReports();
      // Avoid duplicate codes
      const filtered = existing.filter((r) => r.public_code !== receipt.public_code);
      const updated = [receipt, ...filtered];

      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } else {
        memoryStore = updated;
      }
    } catch (e) {
      console.warn('StorageService.saveReportReceipt error:', e);
      memoryStore = [receipt, ...memoryStore];
    }
  },

  async getMyReports(): Promise<LocalReportReceipt[]> {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        const data = window.localStorage.getItem(STORAGE_KEY);
        if (data) {
          return JSON.parse(data) as LocalReportReceipt[];
        }
      }
      return memoryStore;
    } catch (e) {
      console.warn('StorageService.getMyReports error:', e);
      return memoryStore;
    }
  },

  async clearMyReports(): Promise<void> {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(STORAGE_KEY);
    }
    memoryStore = [];
  },
};
