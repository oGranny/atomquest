'use client';

import { useAuth } from '@/context/AuthContext';
import Header from '@/components/Header';
import AdminPanel from '@/components/AdminPanel';

export default function GovernancePage() {
  const { user } = useAuth();

  if (!user || user.role !== 'ADMIN') {
      return <div className="p-20 text-center font-headline text-xl">Unauthorized Access</div>;
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header title="Governance" />
      <div className="flex-1 overflow-y-auto p-4 md:p-margin-desktop">
        <div className="max-w-[1280px] mx-auto w-full">
            <AdminPanel />
        </div>
      </div>
    </div>
  );
}