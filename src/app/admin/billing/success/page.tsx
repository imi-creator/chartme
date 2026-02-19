'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';

export default function BillingSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const { refreshOrganization } = useAuth();

  useEffect(() => {
    if (!sessionId) {
      router.push('/admin');
    } else {
      // Rafraîchir l'organisation pour récupérer le nouveau plan
      refreshOrganization();
    }
  }, [sessionId, router, refreshOrganization]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full mx-auto p-8">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="flex justify-center mb-6">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Paiement réussi !
          </h1>
          <p className="text-gray-600 mb-6">
            Merci pour votre abonnement Pro. Votre compte a été mis à jour avec
            succès. Vous avez maintenant accès à toutes les fonctionnalités
            premium.
          </p>
          <Button
            onClick={() => router.push('/admin')}
            className="w-full"
          >
            Retour au tableau de bord
          </Button>
        </div>
      </div>
    </div>
  );
}
