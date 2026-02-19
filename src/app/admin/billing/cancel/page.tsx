'use client';

import { useRouter } from 'next/navigation';
import { XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function BillingCancelPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full mx-auto p-8">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="flex justify-center mb-6">
            <XCircle className="h-16 w-16 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Paiement annulé
          </h1>
          <p className="text-gray-600 mb-6">
            Votre paiement a été annulé. Aucun montant n&apos;a été débité de votre
            compte. Vous pouvez réessayer à tout moment.
          </p>
          <div className="space-y-3">
            <Button
              onClick={() => router.push('/admin/billing')}
              className="w-full"
            >
              Réessayer
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/admin')}
              className="w-full"
            >
              Retour au tableau de bord
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
