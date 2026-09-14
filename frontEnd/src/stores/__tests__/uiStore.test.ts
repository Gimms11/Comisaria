import { describe, it, expect, beforeEach } from 'vitest';
import { useUiStore } from '../uiStore';

describe('useUiStore', () => {
  beforeEach(() => {
    useUiStore.setState({
      activeTab: 'dashboard',
      selectedCrimeReportId: null,
      selectedCommunityReportCode: null,
      isMobileMenuOpen: false,
    });
  });

  it('navigates to crime_reports and sets selectedCrimeReportId when opening crime modal', () => {
    const { openCrimeReportModal } = useUiStore.getState();

    openCrimeReportModal('crime-123');

    const state = useUiStore.getState();
    expect(state.selectedCrimeReportId).toBe('crime-123');
    expect(state.activeTab).toBe('crime_reports');
  });

  it('navigates to community_map and sets selectedCommunityReportCode when opening community modal', () => {
    const { openCommunityReportModal } = useUiStore.getState();

    openCommunityReportModal('LT-2026-789');

    const state = useUiStore.getState();
    expect(state.selectedCommunityReportCode).toBe('LT-2026-789');
    expect(state.activeTab).toBe('community_map');
  });

  it('clears selected ids when modals are closed without affecting active tab', () => {
    const { openCrimeReportModal, closeCrimeReportModal } = useUiStore.getState();

    openCrimeReportModal('crime-456');
    closeCrimeReportModal();

    const state = useUiStore.getState();
    expect(state.selectedCrimeReportId).toBeNull();
    expect(state.activeTab).toBe('crime_reports');
  });
});
