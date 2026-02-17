'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ClipboardCheck, Loader2 } from 'lucide-react';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push('/admin/dashboard');
      } else {
        router.push('/auth/login');
      }
    }
  }, [user, loading, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <ClipboardCheck className="h-12 w-12 text-indigo-600" />
          <h1 className="text-4xl font-bold text-gray-900">ChartMe <span className="text-lg font-normal text-gray-500">by imi</span></h1>
        </div>
        <p className="text-gray-600 mb-8">Plateforme de Tests de Positionnement</p>
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto" />
      </div>
    </div>
  );
}
