'use client';

import { useEffect } from 'react';
import { ComplaintsClientPage } from '../components/complaints/ComplaintsClientPage';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const { currentUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log('[DashboardPage] useEffect: loading', loading, 'currentUser', currentUser);
    if (!loading && !currentUser) {
      console.log('[DashboardPage] Redirecting to /login');
      router.push('/login');
    }
  }, [currentUser, loading, router]);

  if (loading) {
    console.log('[DashboardPage] Loading...');
    return <div className="p-8 text-center">Loading...</div>;
  }

  if (!currentUser) {
    console.log('[DashboardPage] No currentUser, returning null (redirecting)');
    return null; // Redirecting
  }

  // Debug: Log before rendering dashboard
  console.log('[DashboardPage] Rendering dashboard for user:', currentUser);

  return (
    <div className="p-4 max-w-3xl mx-auto h-[90vh] overflow-y-auto">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      {/* Debug: Log before rendering ComplaintsClientPage */}
      {(() => { console.log('[DashboardPage] Rendering <ComplaintsClientPage />'); return null; })()}
      <ComplaintsClientPage />
    </div>
  );
}