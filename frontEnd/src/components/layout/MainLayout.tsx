import React from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="h-screen w-screen bg-[#0b1120] text-slate-100 flex flex-col overflow-hidden selection:bg-sky-500 selection:text-white">
      {/* Top Header - Fixed height & non-shrinking */}
      <Header />

      {/* Main Layout Body - Fills remaining viewport height */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 min-w-0 overflow-hidden">
        {/* Navigation Sidebar - Strictly fixed width & non-shrinking */}
        <Sidebar />

        {/* Dynamic Main Content Container - Only this container resizes & scrolls */}
        <main className="flex-1 min-w-0 h-full overflow-y-auto overflow-x-hidden bg-slate-950/40 p-3 sm:p-4 lg:p-5 flex flex-col">
          <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col min-h-0">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
