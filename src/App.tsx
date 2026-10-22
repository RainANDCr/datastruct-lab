import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopNav } from '@/components/layout/TopNav';
import { AlgorithmPage } from '@/pages/AlgorithmPage';
import { HomePage } from '@/pages/HomePage';
import { applyThemeClass, useSettings } from '@/stores/settings';

export default function App() {
  const theme = useSettings((s) => s.theme);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    applyThemeClass(theme);
  }, [theme]);

  return (
    <TooltipProvider>
      <BrowserRouter>
        <div className="flex h-full flex-col overflow-hidden">
          <TopNav onToggleSidebar={() => setSidebarOpen((v) => !v)} />
          <div className="flex min-h-0 flex-1">
            <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <main className="min-w-0 flex-1 overflow-hidden">
              <ErrorBoundary title="页面加载失败">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/algorithm/:id" element={<AlgorithmPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </ErrorBoundary>
            </main>
          </div>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  );
}
