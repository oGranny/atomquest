'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { fetchApi } from '@/lib/api';
import { toast } from 'sonner';

export default function BuilderRedirectPage() {
  const router = useRouter();
  const isInitializing = useRef(false);

  useEffect(() => {
    const findAndRedirect = async () => {
      if (isInitializing.current) return;
      isInitializing.current = true;

      try {
        const sheets = await fetchApi('/goals/my-sheets');
        
        if (sheets.length > 0) {
            // Redirect to the most recent one (sorted by createdAt desc in backend)
            router.replace(`/dashboard/sheet/${sheets[0].id}`);
        } else {
            // No sheets at all, create the first one for 2026
            const newSheet = await fetchApi('/goals/sheet', {
                method: 'POST',
                body: JSON.stringify({ cycleYear: 2026 }),
            });
            toast.success('Initializing your first Goal Cycle: 2026');
            router.replace(`/dashboard/sheet/${newSheet.id}`);
        }
      } catch (error: any) {
        toast.error('Failed to initialize builder engine.');
        router.replace('/dashboard');
      } finally {
          // Note: We don't reset isInitializing.current to false here 
          // because we are redirecting away anyway.
      }
    };

    findAndRedirect();
  }, [router]);

  return (
    <div className="p-20 text-center font-headline text-xl text-primary animate-pulse tracking-widest uppercase bg-surface min-h-screen">
      Calibrating...
    </div>
  );
}