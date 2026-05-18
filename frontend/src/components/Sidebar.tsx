'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { 
  RocketIcon, 
  ConstructionIcon, 
  BarChart3Icon, 
  UsersIcon, 
  ShieldCheckIcon,
  SettingsIcon,
  HelpCircleIcon,
  PlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  LayoutDashboardIcon,
  BarChartIcon
} from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (val: boolean) => void;
}

export default function Sidebar({ isCollapsed, setIsCollapsed }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  const navItems = [
    { name: 'Success Dashboard', href: '/dashboard', icon: BarChart3Icon, roles: ['EMPLOYEE', 'MANAGER', 'ADMIN'] },
    { name: 'Goal Builder', href: '/dashboard/builder', icon: ConstructionIcon, roles: ['EMPLOYEE', 'MANAGER', 'ADMIN'] },
    { name: 'Team Review', href: '/dashboard/review', icon: UsersIcon, roles: ['MANAGER', 'ADMIN'] },
    { name: 'Analytics', href: '/dashboard/analytics', icon: BarChartIcon, roles: ['MANAGER', 'ADMIN'] },
    { name: 'Governance', href: '/dashboard/governance', icon: ShieldCheckIcon, roles: ['ADMIN'] },
  ];

  return (
    <aside 
      className={cn(
        "hidden md:flex flex-col h-full bg-surface-container-low border-r border-outline-variant fixed left-0 top-0 z-40 transition-all duration-300",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      <div className={cn("flex items-center gap-4 relative", isCollapsed ? "p-5 justify-center" : "p-10")}>
        <div className={cn(
            "bg-primary-container rounded-2xl flex items-center justify-center shadow-md transform hover:scale-105 transition-all cursor-pointer shrink-0",
            isCollapsed ? "w-10 h-10" : "w-14 h-14"
        )}>
          <RocketIcon className={cn("text-on-primary-container", isCollapsed ? "h-5 w-5" : "h-8 w-8")} />
        </div>
        {!isCollapsed && (
            <div className="animate-in fade-in duration-500 overflow-hidden">
                <h1 className="font-headline text-2xl font-black text-on-surface leading-none tracking-tighter uppercase whitespace-nowrap">ZenQ</h1>
                <p className="font-sans text-[8px] font-black text-on-surface-variant uppercase tracking-[0.4em] opacity-40 mt-2 whitespace-nowrap">Goal Portal</p>
            </div>
        )}
        
        {/* Toggle Button */}
        <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-card border border-outline-variant rounded-full flex items-center justify-center shadow-sm hover:bg-primary transition-colors hover:text-white z-50"
        >
            {isCollapsed ? <ChevronRightIcon className="h-3 w-3" /> : <ChevronLeftIcon className="h-3 w-3" />}
        </button>
      </div>

      <nav className="flex-1 px-3 space-y-2 mt-4">
        {navItems.filter(item => item.roles.includes(user?.role || 'ADMIN')).map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link 
              key={item.name} 
              href={item.href}
              title={isCollapsed ? item.name : ""}
              className={cn(
                "flex items-center rounded-xl transition-all duration-200 group relative",
                isCollapsed ? "p-3 justify-center" : "gap-4 px-5 py-4",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-lg font-black" 
                  : "text-on-surface-variant opacity-70 hover:bg-surface-container-high hover:opacity-100"
              )}
            >
              <item.icon className={cn("h-5 w-5 transition-transform group-hover:scale-110 shrink-0", isActive ? "text-primary-foreground" : "text-on-surface-variant")} />
              {!isCollapsed && (
                <span className="font-headline text-[10px] font-bold uppercase tracking-widest animate-in slide-in-from-left-2 duration-300">
                    {item.name}
                </span>
              )}
              {isActive && !isCollapsed && (
                <div className="absolute right-3 w-1.5 h-1.5 bg-primary-foreground rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)]"></div>
              )}
            </Link>
          );
        })}
      </nav>

      <div className={cn("p-4 space-y-6", isCollapsed ? "px-3" : "p-6")}>
        {(user?.role === 'MANAGER' || user?.role === 'ADMIN') && (
            <button 
                title={isCollapsed ? "Push Shared Goal" : ""}
                className={cn(
                    "w-full bg-secondary text-white rounded-2xl font-black shadow-xl hover:bg-on-surface transition-all flex items-center justify-center active:scale-[0.98] group relative overflow-hidden shrink-0",
                    isCollapsed ? "h-12 w-12 mx-auto" : "py-4 gap-3"
                )}
                onClick={() => router.push('/dashboard/builder/shared')}
            >
                <div className="absolute inset-0 bg-card/5 group-hover:translate-x-full transition-transform duration-500"></div>
                <PlusIcon className="h-4 w-4 group-hover:rotate-90 transition-transform relative z-10" />
                {!isCollapsed && <span className="text-[10px] font-bold uppercase tracking-widest relative z-10 animate-in fade-in duration-500">Push Shared Goal</span>}
            </button>
        )}
        
        <div className={cn("pt-6 border-t border-outline-variant flex flex-col gap-2", isCollapsed ? "items-center" : "")}>
            <Link 
                href="/dashboard/settings" 
                title={isCollapsed ? "Settings" : ""}
                className={cn("flex items-center text-on-surface-variant hover:text-primary transition-all group", isCollapsed ? "p-3" : "gap-4 px-4 py-2")}
            >
              <SettingsIcon className="h-4 w-4 group-hover:rotate-45 transition-transform" />
              {!isCollapsed && <span className="font-headline text-[9px] font-bold uppercase tracking-widest">Settings</span>}
            </Link>
            <Link 
                href="#" 
                title={isCollapsed ? "Support" : ""}
                className={cn("flex items-center text-on-surface-variant hover:text-primary transition-all group", isCollapsed ? "p-3" : "gap-4 px-4 py-2")}
            >
              <HelpCircleIcon className="h-4 w-4 group-hover:scale-110 transition-transform" />
              {!isCollapsed && <span className="font-headline text-[9px] font-bold uppercase tracking-widest">Support</span>}
            </Link>
        </div>
      </div>
    </aside>
  );
}