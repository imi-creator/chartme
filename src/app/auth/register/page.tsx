'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowLeft, Building2 } from 'lucide-react';
import { toast } from 'sonner';

export default function RegisterPage() {
  const [organizationName, setOrganizationName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    if (password.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (organizationName.trim().length < 2) {
      toast.error('Le nom de l\'entreprise doit contenir au moins 2 caractères');
      return;
    }

    setLoading(true);

    try {
      await signUp(email, password, displayName, organizationName.trim());
      toast.success('Compte et organisation créés avec succès');
      router.push('/admin/dashboard');
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Erreur lors de la création du compte');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex overflow-hidden">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-black relative items-center justify-center p-12">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#0a38fd]/20 rounded-full blur-[120px]" />
        <div className="relative z-10 max-w-md">
          <Link href="/" className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 bg-[#0a38fd] rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">C</span>
            </div>
            <span className="text-3xl font-bold text-white">ChartMe</span>
          </Link>
          <h1 className="text-4xl font-bold text-white mb-6 leading-tight">
            Rejoignez les formateurs qui <span className="text-[#0a38fd]">gagnent du temps.</span>
          </h1>
          <p className="text-white/60 text-lg">
            Créez votre organisation et commencez à générer des tests de positionnement en quelques minutes.
          </p>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white relative overflow-y-auto">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
        
        <div className="relative z-10 w-full max-w-md py-8">
          <Link href="/" className="inline-flex items-center gap-2 text-black/50 hover:text-black mb-8 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Retour à l'accueil
          </Link>

          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-[#0a38fd] rounded-xl flex items-center justify-center">
              <span className="text-white font-bold">C</span>
            </div>
            <span className="text-2xl font-bold text-black">ChartMe</span>
          </div>

          <h2 className="text-3xl font-bold text-black mb-2">Créer un compte</h2>
          <p className="text-black/50 mb-8">Configurez votre organisation en quelques minutes</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="organizationName" className="text-black font-medium flex items-center gap-2">
                <Building2 className="h-4 w-4 text-[#0a38fd]" />
                Nom de l'entreprise
              </Label>
              <Input
                id="organizationName"
                type="text"
                placeholder="Mon Entreprise SAS"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                required
                className="h-12 bg-black/5 border-black/10 focus:border-[#0a38fd] focus:ring-[#0a38fd]/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-black font-medium">Votre nom complet</Label>
              <Input
                id="displayName"
                type="text"
                placeholder="Jean Dupont"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="h-12 bg-black/5 border-black/10 focus:border-[#0a38fd] focus:ring-[#0a38fd]/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-black font-medium">Email professionnel</Label>
              <Input
                id="email"
                type="email"
                placeholder="vous@entreprise.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 bg-black/5 border-black/10 focus:border-[#0a38fd] focus:ring-[#0a38fd]/20"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-black font-medium">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 bg-black/5 border-black/10 focus:border-[#0a38fd] focus:ring-[#0a38fd]/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-black font-medium">Confirmer</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="h-12 bg-black/5 border-black/10 focus:border-[#0a38fd] focus:ring-[#0a38fd]/20"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 bg-[#0a38fd] hover:bg-[#0a38fd]/90 text-white font-medium rounded-xl mt-2" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Création...
                </>
              ) : (
                'Créer mon organisation'
              )}
            </Button>
          </form>

          <p className="mt-8 text-center text-black/50">
            Déjà un compte ?{' '}
            <Link href="/auth/login" className="text-[#0a38fd] font-medium hover:underline">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
