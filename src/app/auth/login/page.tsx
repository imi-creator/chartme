'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signIn(email, password);
      toast.success('Connexion réussie');
      router.push('/admin/dashboard');
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex overflow-hidden">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-black relative items-center justify-center p-12">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-[#0a38fd]/20 rounded-full blur-[120px]" />
        <div className="relative z-10 max-w-md">
          <Link href="/" className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 bg-[#0a38fd] rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">C</span>
            </div>
            <span className="text-3xl font-bold text-white">ChartMe</span>
          </Link>
          <h1 className="text-4xl font-bold text-white mb-6 leading-tight">
            Créez des tests de positionnement <span className="text-[#0a38fd]">en quelques minutes.</span>
          </h1>
          <p className="text-white/60 text-lg">
            Générez, diffusez et analysez vos évaluations grâce à l'intelligence artificielle.
          </p>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white relative">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
        
        <div className="relative z-10 w-full max-w-md">
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

          <h2 className="text-3xl font-bold text-black mb-2">Connexion</h2>
          <p className="text-black/50 mb-8">Accédez à votre espace administrateur</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-black font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 bg-black/5 border-black/10 focus:border-[#0a38fd] focus:ring-[#0a38fd]/20"
              />
            </div>
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

            <Button 
              type="submit" 
              className="w-full h-12 bg-[#0a38fd] hover:bg-[#0a38fd]/90 text-white font-medium rounded-xl" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connexion...
                </>
              ) : (
                'Se connecter'
              )}
            </Button>
          </form>

          <p className="mt-8 text-center text-black/50">
            Pas encore de compte ?{' '}
            <Link href="/auth/register" className="text-[#0a38fd] font-medium hover:underline">
              Créer un compte
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
