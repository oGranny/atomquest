'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function Home() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6 text-center">
      <div className="max-w-2xl space-y-6">
        <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 sm:text-6xl">
          AtomQuest <span className="text-primary">1.0</span>
        </h1>
        <p className="text-xl text-gray-600">
          The Atomberg In-House Goal Setting & Tracking Portal. 
          Streamline your professional growth with clarity, alignment, and accountability.
        </p>
        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <Button size="lg" className="px-8 text-lg" onClick={() => router.push('/login')}>
            Get Started / Login
          </Button>
          <Button size="lg" variant="outline" className="px-8 text-lg" onClick={() => window.open('https://atomberg.com', '_blank')}>
            Learn More
          </Button>
        </div>
      </div>
      
      <footer className="absolute bottom-8 text-sm text-gray-500">
        © 2026 Atomberg Technologies. All rights reserved.
      </footer>
    </div>
  );
}