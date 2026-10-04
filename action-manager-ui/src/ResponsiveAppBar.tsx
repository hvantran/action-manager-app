import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppTopBar, SearchBar } from '@hvantran/ui-component-library';
import { LayoutGrid, User, Bell, LogOut } from 'lucide-react';
import { useFailureStatistics } from './hooks/useFailureStatistics';
import { useUserInfo } from './hooks/useUserInfo';

const APP_ENVIRONMENT_VARIABLES = (window as any)._env_ || {};

let pages: Array<{ name: string; link: string; uiName: string }> = [];
try {
  pages = JSON.parse(`${APP_ENVIRONMENT_VARIABLES.REACT_APP_PAGES || '[]'}`);
} catch (e) {
  pages = [];
}

export interface ResponsiveAppBarProps {
  toggleDarkMode?: boolean;
  setToggleDarkMode?: () => void;
}

export default function PrimarySearchAppBar({
  toggleDarkMode = false,
  setToggleDarkMode,
}: ResponsiveAppBarProps) {
  const navigate = useNavigate();
  const { failureCount } = useFailureStatistics();
  const { userInfo, getDisplayName } = useUserInfo();

  const [isAppSwitcherOpen, setIsAppSwitcherOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const switcherRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (switcherRef.current && !switcherRef.current.contains(event.target as Node)) {
        setIsAppSwitcherOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navigateTo = (url: string) => {
    window.location.href = url;
  };

  const handleNotificationClick = () => {
    navigate('/jobs?status=FAILURE');
  };

  const handleLogout = () => {
    const gatewayBaseUrl =
      APP_ENVIRONMENT_VARIABLES.REACT_APP_GATEWAY_URL ||
      APP_ENVIRONMENT_VARIABLES.REACT_APP_ACTION_MANAGER_BACKEND_URL?.replace('/api/action-manager', '') ||
      'http://localhost:6081';
    window.location.href = `${gatewayBaseUrl}/logout`;
  };

  const appSwitcher = (
    <div className="relative" ref={switcherRef}>
      <button
        type="button"
        title="App switcher"
        aria-label="App switcher"
        onClick={() => setIsAppSwitcherOpen((prev) => !prev)}
        className="p-2 rounded-btn text-secondary-500 hover:text-secondary-900 dark:text-secondary-400 dark:hover:text-white hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-colors"
      >
        <LayoutGrid className="w-5 h-5" />
      </button>

      {isAppSwitcherOpen && (
        <div className="absolute right-0 mt-2 w-80 p-4 rounded-xl border border-secondary-200 dark:border-secondary-800 bg-surface-card-light dark:bg-surface-card-dark shadow-xl z-50">
          <div className="text-xs font-semibold text-secondary-500 dark:text-secondary-400 uppercase tracking-wider mb-3 px-1">
            Applications
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() =>
                navigateTo(
                  `${APP_ENVIRONMENT_VARIABLES.REACT_APP_TEMPLATE_MANAGER_FRONTEND_URL || ''}/templates`
                )
              }
              className="flex flex-col items-center gap-2 p-3 rounded-lg border border-secondary-100 dark:border-secondary-800 hover:bg-secondary-50 dark:hover:bg-secondary-800/60 transition text-center"
            >
              <img
                alt={APP_ENVIRONMENT_VARIABLES.REACT_APP_TEMPLATE_MANAGER_NAME || 'Template Manager'}
                src="/template-manager.png"
                className="w-10 h-10 object-contain"
              />
              <span className="text-xs font-medium text-secondary-900 dark:text-secondary-100">
                {APP_ENVIRONMENT_VARIABLES.REACT_APP_TEMPLATE_MANAGER_NAME || 'Templates'}
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                navigateTo(
                  `${APP_ENVIRONMENT_VARIABLES.REACT_APP_ACTION_MANAGER_FRONTEND_URL || ''}/actions`
                )
              }
              className="flex flex-col items-center gap-2 p-3 rounded-lg border border-secondary-100 dark:border-secondary-800 hover:bg-secondary-50 dark:hover:bg-secondary-800/60 transition text-center"
            >
              <img
                alt={APP_ENVIRONMENT_VARIABLES.REACT_APP_ACTION_MANAGER_NAME || 'Action Manager'}
                src="/action-manager.png"
                className="w-10 h-10 object-contain"
              />
              <span className="text-xs font-medium text-secondary-900 dark:text-secondary-100">
                {APP_ENVIRONMENT_VARIABLES.REACT_APP_ACTION_MANAGER_NAME || 'Actions'}
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                navigateTo(
                  `${APP_ENVIRONMENT_VARIABLES.REACT_APP_ENDPOINT_MANAGER_FRONTEND_URL || ''}/endpoints`
                )
              }
              className="flex flex-col items-center gap-2 p-3 rounded-lg border border-secondary-100 dark:border-secondary-800 hover:bg-secondary-50 dark:hover:bg-secondary-800/60 transition text-center col-span-2 sm:col-span-1"
            >
              <img
                alt={APP_ENVIRONMENT_VARIABLES.REACT_APP_ENDPOINT_MANAGER_NAME || 'Data Collection'}
                src="/data-collection.png"
                className="w-10 h-10 object-contain"
              />
              <span className="text-xs font-medium text-secondary-900 dark:text-secondary-100">
                {APP_ENVIRONMENT_VARIABLES.REACT_APP_ENDPOINT_MANAGER_NAME || 'Collector'}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const notificationsButton = (
    <button
      type="button"
      title={`Show ${failureCount} failed jobs`}
      aria-label={`Show ${failureCount} failed jobs`}
      onClick={handleNotificationClick}
      className="relative p-2 rounded-btn text-secondary-500 hover:text-secondary-900 dark:text-secondary-400 dark:hover:text-white hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-colors"
    >
      <Bell className="w-5 h-5" />
      {failureCount > 0 && (
        <span className="absolute top-1 right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-error-500 rounded-full transform translate-x-1/4 -translate-y-1/4">
          {failureCount}
        </span>
      )}
    </button>
  );

  const userProfile = (
    <div className="relative" ref={profileRef}>
      <button
        type="button"
        title="User menu"
        aria-label="User menu"
        onClick={() => setIsProfileMenuOpen((prev) => !prev)}
        className="p-2 rounded-btn text-secondary-500 hover:text-secondary-900 dark:text-secondary-400 dark:hover:text-white hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-colors"
      >
        <User className="w-5 h-5" />
      </button>

      {isProfileMenuOpen && (
        <div className="absolute right-0 mt-2 w-64 p-3 rounded-xl border border-secondary-200 dark:border-secondary-800 bg-surface-card-light dark:bg-surface-card-dark shadow-xl z-50">
          <div className="px-3 py-2 border-b border-secondary-100 dark:border-secondary-800">
            <p className="text-sm font-semibold text-secondary-900 dark:text-secondary-100">
              {getDisplayName()}
            </p>
            {userInfo.email && (
              <p className="text-xs text-secondary-500 dark:text-secondary-400 truncate mt-0.5">
                {userInfo.email}
              </p>
            )}
            <p className="text-xs text-secondary-400 dark:text-secondary-500 mt-1">
              Roles: {userInfo.roles.map((r) => r.replace('ROLE_', '')).join(', ') || 'None'}
            </p>
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-950/40 rounded-lg transition-colors text-left"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      <AppTopBar
        title={
          <div className="flex items-center gap-6">
            <span className="font-bold text-lg text-primary-600 dark:text-primary-400">
              {APP_ENVIRONMENT_VARIABLES.REACT_APP_NAME || 'Action Manager'}
            </span>
            <nav className="hidden md:flex items-center gap-2">
              {pages.map((page) => (
                <a
                  key={page.name}
                  href={page.link}
                  className="px-3 py-1.5 rounded-md text-sm font-medium text-secondary-600 dark:text-secondary-300 hover:text-secondary-900 dark:hover:text-white hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-colors"
                >
                  {page.uiName}
                </a>
              ))}
            </nav>
          </div>
        }
        onMenuToggle={() => setIsMobileNavOpen((prev) => !prev)}
        isDarkMode={toggleDarkMode}
        onThemeToggle={setToggleDarkMode}
        searchSlot={
          <div className="w-full">
            <SearchBar
              value=""
              placeholder="Search actions..."
              className="w-full"
              onChange={() => {}}
            />
          </div>
        }
        actionsSlot={
          <div className="flex items-center gap-1">
            {notificationsButton}
            {appSwitcher}
          </div>
        }
        userSlot={userProfile}
      />

      {/* Mobile nav dropdown */}
      {isMobileNavOpen && (
        <div className="md:hidden border-b border-secondary-200 dark:border-secondary-800 bg-surface-card-light dark:bg-surface-card-dark px-4 py-3 flex flex-col gap-2 shadow-sm">
          {pages.map((page) => (
            <a
              key={page.name}
              href={page.link}
              className="px-3 py-2 rounded-md text-sm font-medium text-secondary-700 dark:text-secondary-200 hover:bg-secondary-100 dark:hover:bg-secondary-800"
            >
              {page.uiName}
            </a>
          ))}
        </div>
      )}
    </>
  );
}
