'use client';

import { ReactNode } from 'react';
import Link from 'next/link';

interface LayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: LayoutProps) {
  const sidebarItems = [
    {
      icon: '📊',
      label: 'Allocation Dashboard',
      href: '/',
      active: true,
      enabled: true,
    },
    {
      icon: '💰',
      label: 'Relative Wealth Calculator',
      href: '/wealth',
      active: false,
      enabled: false,
    },
    {
      icon: '🧮',
      label: 'Tax Savings Estimator',
      href: '/tax-savings',
      active: false,
      enabled: false,
    },
    {
      icon: '📈',
      label: 'Impact Analytics',
      href: '/impact',
      active: false,
      enabled: false,
    },
    {
      icon: '🎯',
      label: 'Goal Tracker',
      href: '/goals',
      active: false,
      enabled: false,
    },
    {
      icon: '📅',
      label: 'Donation History',
      href: '/history',
      active: false,
      enabled: false,
    },
    {
      icon: '⚙️',
      label: 'Settings',
      href: '/settings',
      active: false,
      enabled: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50 shadow-sm">
        <div className="h-full px-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
              <span className="text-white text-xl font-bold">G</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">GiveWise</h1>
              <p className="text-xs text-gray-500">Effective Giving Platform</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Help
            </button>
            <div className="w-9 h-9 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center">
              <span className="text-gray-600 text-sm font-semibold">JD</span>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside className="fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-gray-200 z-40 overflow-y-auto">
        <nav className="p-4 space-y-1">
          {sidebarItems.map((item, index) => (
            <div key={index}>
              {item.enabled ? (
                <Link
                  href={item.href}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    item.active
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="text-sm">{item.label}</span>
                </Link>
              ) : (
                <div className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-300 cursor-not-allowed">
                  <span className="text-xl opacity-50">{item.icon}</span>
                  <div className="flex-1 flex items-center justify-between">
                    <span className="text-sm">{item.label}</span>
                    <span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded">
                      Soon
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-gradient-to-br from-blue-50 to-indigo-50">
          <div className="text-xs text-gray-600 space-y-1">
            <p className="font-semibold text-gray-700">💡 Coming Soon</p>
            <p className="text-gray-500">More tools to maximize your giving impact</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 mt-16 min-h-[calc(100vh-4rem)]">
        {children}
      </main>
    </div>
  );
}
