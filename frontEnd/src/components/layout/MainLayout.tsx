import React, { useEffect } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { LiveAlertToast } from '../ui/LiveAlertToast';
import { useUiStore } from '../../stores/uiStore';
import { useWebSocketStore } from '../../stores/websocketStore';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { isMobileMenuOpen, setMobileMenuOpen } = useUiStore();
  const { isFlashingRed } = useWebSocketStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen, setMobileMenuOpen]);

  return (
    <div
      data-testid="main-layout-container"
      className={`h-screen w-screen bg-[#0b1120] text-slate-100 flex flex-col overflow-hidden selection:bg-red-500 selection:text-white relative transition-palette ${
        isFlashingRed ? 'emergency-palette-red' : ''
      }`}
    >
      {/* Pure Red Color-Blend Recolor Layer */}
      {isFlashingRed && (
        <div
          data-testid="emergency-red-tint"
          className="emergency-red-tint"
          aria-hidden="true"
        />
      )}

      {/* Floating Tactical Live Alert Notification Toast */}
      <LiveAlertToast />

      {/* Top Header - Fixed height & non-shrinking */}
      <Header />

      {/* Main Layout Body - Fills remaining viewport height */}
      <div className="flex-1 flex min-h-0 min-w-0 overflow-hidden relative">
        {/* Desktop Navigation Sidebar */}
        <div className="hidden lg:block shrink-0 h-full">
          <Sidebar />
        </div>

        {/* Mobile Slide-over Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            {/* Backdrop with Blur */}
            <div
              className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Cerrar navegación móvil"
            />

            {/* Slide Drawer Content */}
            <div className="relative z-10 w-72 max-w-[85vw] h-full shadow-2xl animate-in slide-in-from-left duration-250">
              <Sidebar isMobile onClose={() => setMobileMenuOpen(false)} />
            </div>
          </div>
        )}

        {/* Dynamic Main Content Container */}
        <main className="flex-1 min-w-0 h-full overflow-y-auto overflow-x-hidden bg-slate-950/40 p-3 sm:p-4 lg:p-5 flex flex-col">
          <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
