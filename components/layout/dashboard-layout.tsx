'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  BarChart3, 
  Grid3X3, 
  TrendingUp, 
  Activity, 
  Search,
  Settings,
  User,
  Bell,
  Menu,
  X
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/',
    icon: BarChart3,
    description: 'Overview with metrics, charts, live feed'
  },
  {
    name: 'Listings Matrix',
    href: '/token-matrix',
    icon: Grid3X3,
    description: 'Exchange coverage & parity analysis'
  },
  {
    name: 'Venture Intel',
    href: '/venture-intelligence',
    icon: TrendingUp,
    description: 'Fundraising tracker & stage analysis'
  },
  {
    name: 'Listings Feed',
    href: '/listings-feed',
    icon: Activity,
    description: 'Real-time listing alerts & patterns'
  },
];

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="dashboard-layout">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-[var(--dashboard-card-bg)] border-r border-[var(--dashboard-border)]
        transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-[var(--dashboard-border)]">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-[var(--dashboard-blue)] rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <span className="ml-2 text-lg font-semibold text-[var(--dashboard-text-primary)]">
                Shoal Intelligence
              </span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-[var(--dashboard-text-muted)] hover:text-[var(--dashboard-text-primary)]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors
                    ${isActive 
                      ? 'bg-gray-100 dark:bg-gray-800 text-[var(--dashboard-blue)] border border-[var(--dashboard-blue)] border-opacity-20' 
                      : 'text-[var(--dashboard-text-secondary)] hover:text-[var(--dashboard-text-primary)] hover:bg-[var(--dashboard-hover)]'
                    }
                  `}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  <div className="flex flex-col">
                    <span>{item.name}</span>
                    <span className="text-xs text-[var(--dashboard-text-muted)] font-normal">
                      {item.description}
                    </span>
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* Bottom navigation */}
          <div className="p-4 space-y-2 border-t border-[var(--dashboard-border)]">
            <Link
              href="/settings"
              className="flex items-center px-3 py-2 text-sm font-medium text-[var(--dashboard-text-secondary)] hover:text-[var(--dashboard-text-primary)] hover:bg-[var(--dashboard-hover)] rounded-lg transition-colors"
            >
              <Settings className="w-5 h-5 mr-3" />
              Settings
            </Link>
            <Link
              href="/profile"
              className="flex items-center px-3 py-2 text-sm font-medium text-[var(--dashboard-text-secondary)] hover:text-[var(--dashboard-text-primary)] hover:bg-[var(--dashboard-hover)] rounded-lg transition-colors"
            >
              <User className="w-5 h-5 mr-3" />
              Profile
            </Link>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Top header */}
        <header className="dashboard-header">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-[var(--dashboard-text-muted)] hover:text-[var(--dashboard-text-primary)] mr-2"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-[var(--dashboard-text-primary)]">
                {navigationItems.find(item => item.href === pathname)?.name || 'Dashboard'}
              </h1>
              <p className="text-[var(--dashboard-text-secondary)]">
                {navigationItems.find(item => item.href === pathname)?.description || 'Real-time crypto market intelligence'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--dashboard-text-muted)] w-4 h-4" />
              <input
                type="text"
                placeholder="Search tokens, projects, or trends..."
                className="dashboard-search pl-10 pr-4 w-80 max-w-sm"
              />
            </div>
            <button className="p-2 text-[var(--dashboard-text-muted)] hover:text-[var(--dashboard-text-primary)] relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-[var(--dashboard-red)] rounded-full"></span>
            </button>
            <button className="dashboard-btn dashboard-btn-primary">
              Alpha Mode
            </button>
          </div>
        </header>

        {/* Main content area */}
        <main className="dashboard-main">
          {children}
        </main>
      </div>
    </div>
  );
}