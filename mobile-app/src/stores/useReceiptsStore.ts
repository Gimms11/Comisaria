import { create } from 'zustand';
import { LocalReportReceipt } from '@/types';
import { StorageService } from '@/services/storageService';
import { logger } from '@/utils/logger';

interface ReceiptsState {
  receipts: LocalReportReceipt[];
  isLoading: boolean;
  loadReceipts: () => Promise<void>;
  addReceipt: (receipt: LocalReportReceipt) => Promise<void>;
  clearReceipts: () => Promise<void>;
}

export const useReceiptsStore = create<ReceiptsState>((set, get) => ({
  receipts: [],
  isLoading: false,

  loadReceipts: async () => {
    set({ isLoading: true });
    try {
      const items = await StorageService.getMyReports();
      set({ receipts: items, isLoading: false });
      logger.info('STORAGE', `Recibos cargados en memoria reactiva: ${items.length} items`);
    } catch (err) {
      logger.error('STORAGE', 'Error cargando recibos en store:', err);
      set({ isLoading: false });
    }
  },

  addReceipt: async (receipt) => {
    await StorageService.saveReportReceipt(receipt);
    const updated = [receipt, ...get().receipts.filter((r) => r.public_code !== receipt.public_code)];
    set({ receipts: updated });
  },

  clearReceipts: async () => {
    await StorageService.clearMyReports();
    set({ receipts: [] });
  },
}));

export default useReceiptsStore;
