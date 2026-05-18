'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  React.useEffect(() => {
    if (!loading && !user && pathname !== '/login') {
      router.push('/login');
    }
  }, [user, loading, router, pathname]);

  if (loading) return <div className="flex h-screen items-center justify-center bg-background font-headline text-xl">Initializing...</div>;
  if (!user && pathname !== '/login') return null;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <main 
        className={cn(
            "flex-1 flex flex-col overflow-hidden relative transition-all duration-300",
            isCollapsed ? "md:ml-20" : "md:ml-64"
        )}
      >
        {children}
      </main>
      
      {/* Bottom Nav for Mobile */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-3 md:hidden bg-surface shadow-lg rounded-t-xl border-t border-outline-variant">
         {/* Implementation handles mobile view separately if needed */}
      </nav>
    </div>
  );
}