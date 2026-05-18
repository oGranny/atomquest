'use client';

import { useAuth } from '@/context/AuthContext';
import Header from '@/components/Header';
import TeamApprovals from '@/components/TeamApprovals';

export default function ReviewPage() {
  const { user } = useAuth();

  if (!user || (user.role !== 'MANAGER' && user.role !== 'ADMIN')) {
      return <div className="p-20 text-center font-headline text-xl">Unauthorized Access</div>;
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header title="Team Review" />
      <div className="flex-1 overflow-hidden flex flex-col">
        <TeamApprovals />
      </div>
    </div>
  );
}