'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardCheck, Loader2, Building2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface InvitationData {
  email: string;
  organizationName: string;
  organizationId: string;
}

export default function InvitePage() {
  const params = useParams();
  const token = params.token as string;
  
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingInvite, setCheckingInvite] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { signUpWithInvite } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const checkInvitation = async () => {
      try {
        const inviteQuery = query(
          collection(db, 'invitations'),
          where('token', '==', token),
          where('status', '==', 'pending')
        );
        const snapshot = await getDocs(inviteQuery);
        
        if (snapshot.empty) {
          setError('Cette invitation est invalide ou a déjà été utilisée.');
          setCheckingInvite(false);
          return;
        }

        const inviteData = snapshot.docs[0].data();
        setInvitation({
          email: inviteData.email,
          organizationName: inviteData.organizationName,
          organizationId: inviteData.organizationId,
        });
      } catch (err) {
        console.error(err);
        setError('Erreur lors de la vérification de l\'invitation.');
      } finally {
        setCheckingInvite(false);
      }
    };

    if (token) {
      checkInvitation();
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!invitation) return;
    
    if (password !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    if (password.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);

    try {
      await signUpWithInvite(invitation.email, password, displayName, token);
      toast.success('Compte créé avec succès !');
      router.push('/admin/dashboard');
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Erreur lors de la création du compte');
    } finally {
      setLoading(false);
    }
  };

  if (checkingInvite) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle>Invitation invalide</CardTitle>
            <CardDescription>{error || 'Cette invitation n\'existe pas.'}</CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Button variant="outline" onClick={() => router.push('/auth/login')}>
              Retour à la connexion
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <ClipboardCheck className="h-8 w-8 text-indigo-600" />
            <CardTitle className="text-2xl">ChartMe <span className="text-sm font-normal text-gray-500">by imi</span></CardTitle>
          </div>
          <CardDescription>Vous êtes invité à rejoindre une organisation</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="bg-indigo-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-indigo-700">
                <Building2 className="h-5 w-5" />
                <span className="font-medium">{invitation.organizationName}</span>
              </div>
              <p className="text-sm text-indigo-600 mt-1">
                Invitation pour : {invitation.email}
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="displayName">Votre nom complet</Label>
              <Input
                id="displayName"
                type="text"
                placeholder="Jean Dupont"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={invitation.email}
                disabled
                className="bg-gray-100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Création...
                </>
              ) : (
                'Rejoindre l\'organisation'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
