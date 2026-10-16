import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  CheckSquare,
  User,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { Logo } from '../Navbar.jsx';
import ThemeToggle from '../ThemeToggle.jsx';

const SIDEBAR_STORAGE_KEY = 'filesense_sidebar_collapsed';

const navItems = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    end: true,
  },
  {
    to: '/documents',
    label: 'Library',
    icon: BookOpen,
  },
  {
    to: '/dashboard#tasks',
    label: 'Tasks',
    icon: CheckSquare,
    isAnchor: true,
  },
  {
    to: '/profile',
    label: 'Profile',
    icon: User,
  },
];

export default function Sidebar({ collapsed, onToggle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  function handleLogout() {
    logout();
    navigate('/', { replace: true });
  }

  const initials = user?.name
    ? user.name
        .split(' ')
        .slice(0, 2)
        .map((n) => n[0]?.toUpperCase())
        .join('')
    : 'FS';

  return (
    <aside
      className={`hidden md:flex flex-col shrink-0 border-r border-border-subtle bg-surface transition-all duration-200 z-20 sticky top-0 h-screen select-none ${
        collapsed ? 'w-18' : 'w-64'
      }`}
    >
      {/* Top Header / Brand */}
      <div className="flex h-16 items-center justify-between border-b border-border-subtle px-4">
        <NavLink
          to="/dashboard"
          className="flex items-center min-w-0 overflow-hidden"
          title="FileSense Dashboard"
        >
          <Logo markOnly={collapsed} />
        </NavLink>

        <button
          type="button"
          onClick={onToggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="cursor-pointer rounded-md p-1.5 text-muted transition-colors hover:bg-subtle hover:text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" aria-hidden="true" />
          ) : (
            <PanelLeftClose className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 space-y-1.5 p-3 overflow-y-auto sm-scroll">
        {navItems.map((item) => {
          const Icon = item.icon;

          if (item.isAnchor) {
            const isTasksActive =
              location.pathname === '/dashboard' && location.hash === '#tasks';
            return (
              <a
                key={item.to}
                href={item.to}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                  isTasksActive
                    ? 'bg-subtle text-accent border border-border-subtle font-semibold shadow-xs'
                    : 'text-secondary hover:bg-subtle hover:text-primary'
                } ${collapsed ? 'justify-center px-0' : ''}`}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                {!collapsed && <span>{item.label}</span>}
              </a>
            );
          }

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-subtle text-accent border border-border-subtle font-semibold shadow-xs'
                    : 'text-secondary hover:bg-subtle hover:text-primary'
                } ${collapsed ? 'justify-center px-0' : ''}`
              }
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Pinned User & Utility Section */}
      <div className="border-t border-border-subtle p-3 space-y-2">
        {/* Controls row */}
        <div
          className={`flex items-center ${
            collapsed ? 'flex-col gap-2' : 'justify-between px-1'
          }`}
        >
          <ThemeToggle />
          <button
            type="button"
            onClick={handleLogout}
            title="Log out"
            aria-label="Log out of FileSense"
            className="flex items-center justify-center cursor-pointer rounded-md p-1.5 text-muted transition-colors hover:bg-danger-subtle hover:text-danger focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-danger"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* User profile card */}
        <NavLink
          to="/profile"
          title={user?.email}
          className={`flex items-center gap-2.5 rounded-md p-2 transition-colors hover:bg-subtle ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-sm border border-border-subtle bg-subtle font-mono text-xs font-semibold text-primary">
            {initials}
          </span>
          {!collapsed && (
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-xs font-medium text-primary">
                {user?.name || 'Student'}
              </p>
              <p className="truncate font-mono text-[10px] text-muted">
                {user?.email || ''}
              </p>
            </div>
          )}
        </NavLink>
      </div>
    </aside>
  );
}
