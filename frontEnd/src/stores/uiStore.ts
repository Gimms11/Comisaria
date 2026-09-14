import { create } from 'zustand';
import { ReportPriority, ReportStatus } from '../types';

export type ActiveTab = 'dashboard' | 'crime_reports' | 'community_map' | 'guides' | 'officers';

interface UiState {
  activeTab: ActiveTab;
  selectedCrimeReportId: string | null;
  selectedCommunityReportCode: string | null;
  statusFilter: ReportStatus | 'all';
  priorityFilter: ReportPriority | 'all';
  searchQuery: string;
  isMobileMenuOpen: boolean;
  setActiveTab: (tab: ActiveTab) => void;
  setMobileMenuOpen: (open: boolean) => void;
  toggleMobileMenu: () => void;
  openCrimeReportModal: (id: string) => void;
  closeCrimeReportModal: () => void;
  openCommunityReportModal: (code: string) => void;
  closeCommunityReportModal: () => void;
  setStatusFilter: (status: ReportStatus | 'all') => void;
  setPriorityFilter: (priority: ReportPriority | 'all') => void;
  setSearchQuery: (query: string) => void;
}

export const useUiStore = create<UiState>((set) => ({
  activeTab: 'dashboard',
  selectedCrimeReportId: null,
  selectedCommunityReportCode: null,
  statusFilter: 'all',
  priorityFilter: 'all',
  searchQuery: '',
  isMobileMenuOpen: false,

  setActiveTab: (activeTab) => set({ activeTab, isMobileMenuOpen: false }),
  setMobileMenuOpen: (isMobileMenuOpen) => set({ isMobileMenuOpen }),
  toggleMobileMenu: () => set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
  openCrimeReportModal: (id) => set({ selectedCrimeReportId: id, activeTab: 'crime_reports' }),
  closeCrimeReportModal: () => set({ selectedCrimeReportId: null }),
  openCommunityReportModal: (code) => set({ selectedCommunityReportCode: code, activeTab: 'community_map' }),
  closeCommunityReportModal: () => set({ selectedCommunityReportCode: null }),
  setStatusFilter: (statusFilter) => set({ statusFilter }),
  setPriorityFilter: (priorityFilter) => set({ priorityFilter }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
}));
