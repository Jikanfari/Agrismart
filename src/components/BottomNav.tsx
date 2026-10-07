import React from 'react';
import {
  LayoutDashboard,
  Sprout,
  Activity,
  BellRing,
  ClipboardList,
  BarChart3,
  Shield,
} from 'lucide-react';
import { Role } from '../types';

export type NavigationTab =
  | 'dashboard'
  | 'farms'
  | 'environment'
  | 'alerts'
  | 'records'
  | 'reports'
  | 'admin';

interface BottomNavProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  activeAlertsCount: number;
  userRole: Role;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  activeAlertsCount,
  userRole,
}) => {
  const tabs = [
    {
      id: 'dashboard' as NavigationTab,
      label: 'Home',
      icon: LayoutDashboard,
    },
    {
      id: 'farms' as NavigationTab,
      label: 'Farms & Crops',
      icon: Sprout,
    },
    {
      id: 'environment' as NavigationTab,
      label: 'Readings',
      icon: Activity,
    },
    {
      id: 'alerts' as NavigationTab,
      label: 'Smart Alerts',
      icon: BellRing,
      badge: activeAlertsCount > 0 ? activeAlertsCount : undefined,
    },
    {
      id: 'records' as NavigationTab,
      label: 'Records',
      icon: ClipboardList,
    },
    {
      id: 'reports' as NavigationTab,
      label: 'Reports',
      icon: BarChart3,
    },
    ...(userRole === 'admin'
      ? [
          {
            id: 'admin' as NavigationTab,
            label: 'Admin',
            icon: Shield,
          },
        ]
      : []),
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 shadow-lg safe-bottom"
      aria-label="Mobile Bottom Navigation"
    >
      <div className="max-w-3xl mx-auto px-2 flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex flex-col items-center justify-center py-2 px-1 relative min-w-[52px] transition-colors ${
                isActive
                  ? 'text-emerald-700 font-semibold'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />
                {tab.badge && (
                  <span className="absolute -top-1.5 -right-2 bg-rose-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                    {tab.badge > 9 ? '9+' : tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight truncate max-w-[64px]">
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute bottom-0 w-8 h-0.5 bg-emerald-600 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
