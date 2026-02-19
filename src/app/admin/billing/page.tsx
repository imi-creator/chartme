'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Check, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PLANS } from '@/lib/types';
import { getStripe } from '@/lib/stripe-client';

export default function BillingPage() {
  const { user, organization, refreshOrganization } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    if (!user || !organization) return;

    setLoading(true);
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId: organization.id,
          userEmail: user.email,
        }),
      });

      const { url } = await response.json();

      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
    } finally {
      setLoading(false);
    }
  };

  const isPro = organization?.plan === 'pro';

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Facturation</h1>
        <p className="text-muted-foreground mt-2">
          Gérez votre abonnement et votre plan
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-4xl">
        {/* Plan Gratuit */}
        <div
          className={`relative rounded-2xl border-2 p-6 ${
            !isPro ? 'border-primary bg-primary/5' : 'border-border'
          }`}
        >
          {!isPro && (
            <div className="absolute -top-3 left-4 bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
              Plan actuel
            </div>
          )}
          <div className="mb-6">
            <h3 className="text-xl font-semibold">{PLANS.free.name}</h3>
            <div className="mt-2">
              <span className="text-4xl font-bold">{PLANS.free.price}€</span>
              <span className="text-muted-foreground">/mois</span>
            </div>
          </div>
          <ul className="space-y-3 mb-6">
            <li className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              <span>Jusqu&apos;à {PLANS.free.maxTests} tests</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              <span>Génération IA des questions</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              <span>Liens de partage uniques</span>
            </li>
          </ul>
          {!isPro && (
            <Button variant="outline" disabled className="w-full">
              Plan actuel
            </Button>
          )}
        </div>

        {/* Plan Pro */}
        <div
          className={`relative rounded-2xl border-2 p-6 ${
            isPro ? 'border-primary bg-primary/5' : 'border-border'
          }`}
        >
          {isPro && (
            <div className="absolute -top-3 left-4 bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
              Plan actuel
            </div>
          )}
          <div className="absolute -top-3 right-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            Populaire
          </div>
          <div className="mb-6">
            <h3 className="text-xl font-semibold">{PLANS.pro.name}</h3>
            <div className="mt-2">
              <span className="text-4xl font-bold">{PLANS.pro.price}€</span>
              <span className="text-muted-foreground">/mois</span>
            </div>
          </div>
          <ul className="space-y-3 mb-6">
            <li className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              <span>Tests illimités</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              <span>Génération IA des questions</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              <span>Liens de partage uniques</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              <span>Statistiques avancées</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              <span>Support prioritaire</span>
            </li>
          </ul>
          {isPro ? (
            <Button variant="outline" disabled className="w-full">
              Plan actuel
            </Button>
          ) : (
            <Button
              onClick={handleUpgrade}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Chargement...
                </>
              ) : (
                'Passer au Pro'
              )}
            </Button>
          )}
        </div>
      </div>

      {isPro && organization?.stripeCustomerId && (
        <div className="bg-muted/50 rounded-lg p-6 max-w-4xl">
          <h3 className="font-semibold mb-2">Gérer votre abonnement</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Vous pouvez gérer votre abonnement, mettre à jour vos informations
            de paiement ou annuler votre abonnement via le portail client Stripe.
          </p>
          <Button
            variant="outline"
            onClick={async () => {
              const response = await fetch('/api/stripe/portal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ customerId: organization.stripeCustomerId }),
              });
              const { url } = await response.json();
              if (url) window.location.href = url;
            }}
          >
            Accéder au portail client
          </Button>
        </div>
      )}
    </div>
  );
}
