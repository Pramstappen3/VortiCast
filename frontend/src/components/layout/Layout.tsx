import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import { Cyclone } from '../../types/cyclone';

interface LayoutProps {
  cyclones: Cyclone[];
  selectedCyclone: Cyclone | null;
  onSelectCyclone: (c: Cyclone) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({
  cyclones,
  selectedCyclone,
  onSelectCyclone,
  onRefresh,
  isRefreshing,
}) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-navy-950 text-slate-100 font-sans">
      {/* Sidebar */}
      <Sidebar
        isOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopNav
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          cyclones={cyclones}
          selectedCyclone={selectedCyclone}
          onSelectCyclone={onSelectCyclone}
          onRefresh={onRefresh}
          isRefreshing={isRefreshing}
        />

        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
