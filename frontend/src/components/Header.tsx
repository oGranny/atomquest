'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { BellIcon, SearchIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Header({ title }: { title: string }) {
  const { user } = useAuth();

  return (
    <header className="bg-card/80 backdrop-blur-md border-b border-outline-variant sticky top-0 z-30 h-20 flex items-center shadow-sm">
      <div className="flex justify-between items-center w-full px-4 md:px-margin-desktop max-w-[1440px] mx-auto">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <h2 className="font-headline text-2xl font-black text-on-surface tracking-tight uppercase leading-none">{title}</h2>
          </div>
        </div>
        
        <div className="flex items-center gap-8">
          <div className="relative hidden lg:block group">
            <input 
              className="bg-surface-container-low rounded-xl px-4 py-2.5 pl-11 border border-outline-variant/30 text-xs font-medium w-80 focus:bg-card focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all shadow-sm" 
              placeholder="Strategic Search..." 
              type="text"
            />
            <SearchIcon className="absolute left-4 top-3 h-4 w-4 text-on-surface-variant group-focus-within:text-primary transition-colors" />
          </div>

          <div className="flex items-center gap-4">
            <button className="h-10 w-10 rounded-xl flex items-center justify-center hover:bg-surface-container-high transition-all group border border-outline-variant relative">
              <BellIcon className="h-4 w-4 text-on-surface-variant group-hover:text-primary transition-colors" />
              <span className="absolute top-2.5 right-2.5 h-1.5 w-1.5 bg-error rounded-full ring-2 ring-white"></span>
            </button>
            
            <div className="flex items-center gap-4 pl-4 border-l border-outline-variant h-10 ml-2">
              <div className="text-right hidden sm:block">
                <p className="text-[10px] font-black text-on-surface uppercase tracking-tight leading-none font-headline">{user?.name || 'Super Admin'}</p>
                <p className="text-[8px] font-bold text-on-surface-variant uppercase tracking-widest opacity-50 mt-1.5 font-sans">{user?.role || 'Admin'} / OP-{user?.id?.slice(-4).toUpperCase() || 'H003'}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-primary border border-outline-variant shadow-sm flex items-center justify-center font-headline font-black text-primary-foreground text-lg">
                {(user?.name || 'S')[0]}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}