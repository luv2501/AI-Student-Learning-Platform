import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Sidebar from './navigation/Sidebar.jsx';
import { MobileHeader, MobileBottomBar } from './navigation/MobileNav.jsx';
import PublicNav from './navigation/PublicNav.jsx';
import { Logo } from './Logo.jsx';

const SIDEBAR_STORAGE_KEY = 'filesense_sidebar_collapsed';

export default function Layout() {
  const { user } = useAuth();
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const toggleSidebar = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
      } catch {
        // Ignore localStorage quota exceptions
      }
      return next;
    });
  };

  // Determine whether to show public marketing shell or authenticated app shell
  const isPublicRoute =
    !user ||
    location.pathname === '/' ||
    location.pathname === '/login' ||
    location.pathname === '/register';

  if (isPublicRoute) {
    return (
      <div className="flex min-h-screen flex-col bg-base text-primary">
        <PublicNav />

        <main
          key={location.pathname}
          className="animate-rise mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8"
        >
          <Outlet />
        </main>

        <footer className="border-t border-border-subtle bg-surface">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-xs text-muted sm:flex-row sm:px-6">
            <Logo className="opacity-80" />
            <p className="font-mono">
              © {new Date().getFullYear()} FileSense. Understand every document.
            </p>
          </div>
        </footer>
      </div>
    );
  }

  // Authenticated Student App Shell
  return (
    <div className="flex min-h-screen bg-base text-primary">
      {/* Desktop Collapsible Left Sidebar */}
      <Sidebar collapsed={collapsed} onToggle={toggleSidebar} />

      {/* Main Content Viewport */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Mobile Header (< 768px) */}
        <MobileHeader />

        <main
          key={location.pathname}
          className="animate-rise flex-1 px-4 py-6 sm:px-6 lg:px-8 pb-24 md:pb-8 max-w-7xl w-full mx-auto min-w-0"
        >
          <Outlet />
        </main>

        {/* Mobile Sticky Bottom Tab Bar (< 768px) */}
        <MobileBottomBar />
      </div>
    </div>
  );
}
