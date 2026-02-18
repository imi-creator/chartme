'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { ClipboardCheck, LayoutDashboard, Plus, LogOut, Loader2, Building2 } from 'lucide-react';
import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, organization, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/admin/dashboard" className="flex items-center gap-2">
                <ClipboardCheck className="h-8 w-8 text-indigo-600" />
                <span className="text-xl font-bold text-gray-900">ChartMe <span className="text-sm font-normal text-gray-500">by imi</span></span>
              </Link>
              <div className="hidden sm:ml-8 sm:flex sm:space-x-4">
                <Link
                  href="/admin/dashboard"
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
                <Link
                  href="/admin/tests/new"
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Nouveau test
                </Link>
                <Link
                  href="/admin/organization"
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors"
                >
                  <Building2 className="h-4 w-4" />
                  Organisation
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-sm text-gray-900 block">
                  {user.displayName || user.email}
                </span>
                {organization && (
                  <span className="text-xs text-gray-500">{organization.name}</span>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Déconnexion
              </Button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
