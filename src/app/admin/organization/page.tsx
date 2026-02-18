'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, Timestamp, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { User, Invitation, PLANS } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Building2, Users, Mail, Crown, Loader2, Copy, UserPlus, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { nanoid } from 'nanoid';

export default function OrganizationPage() {
  const { user, organization, refreshOrganization } = useAuth();
  const [members, setMembers] = useState<User[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (!organization) return;

    // Charger les membres
    const loadMembers = async () => {
      const membersQuery = query(
        collection(db, 'users'),
        where('organizationId', '==', organization.id)
      );
      const snapshot = await getDocs(membersQuery);
      const membersData = snapshot.docs.map(doc => ({
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
      })) as User[];
      setMembers(membersData);
      setLoading(false);
    };

    loadMembers();

    // Écouter les invitations en temps réel
    const invitationsQuery = query(
      collection(db, 'invitations'),
      where('organizationId', '==', organization.id)
    );

    const unsubscribe = onSnapshot(invitationsQuery, (snapshot) => {
      const invitesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
      })) as Invitation[];
      setInvitations(invitesData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
    });

    return () => unsubscribe();
  }, [organization]);

  const sendInvitation = async () => {
    if (!organization || !user) return;
    
    const email = inviteEmail.trim().toLowerCase();
    
    if (!email || !email.includes('@')) {
      toast.error('Veuillez entrer une adresse email valide');
      return;
    }

    // Vérifier si l'email est déjà membre
    const existingMember = members.find(m => m.email.toLowerCase() === email);
    if (existingMember) {
      toast.error('Cet utilisateur est déjà membre de l\'organisation');
      return;
    }

    // Vérifier si une invitation en attente existe déjà
    const existingInvite = invitations.find(i => i.email === email && i.status === 'pending');
    if (existingInvite) {
      toast.error('Une invitation est déjà en attente pour cet email');
      return;
    }

    setInviting(true);
    try {
      const token = nanoid(32);
      
      await addDoc(collection(db, 'invitations'), {
        email,
        organizationId: organization.id,
        organizationName: organization.name,
        invitedBy: user.uid,
        token,
        status: 'pending',
        createdAt: Timestamp.now(),
      });

      // Envoyer l'email d'invitation
      await fetch('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          organizationName: organization.name,
          inviteLink: `${window.location.origin}/auth/invite/${token}`,
        }),
      });

      toast.success('Invitation envoyée avec succès');
      setInviteEmail('');
      setDialogOpen(false);
    } catch (error) {
      console.error(error);
      toast.error('Erreur lors de l\'envoi de l\'invitation');
    } finally {
      setInviting(false);
    }
  };

  const copyInviteLink = (token: string) => {
    const link = `${window.location.origin}/auth/invite/${token}`;
    navigator.clipboard.writeText(link);
    toast.success('Lien d\'invitation copié');
  };

  if (!organization) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const plan = PLANS[organization.plan];
  const pendingInvitations = invitations.filter(i => i.status === 'pending');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Mon organisation</h1>
        <p className="text-gray-600 mt-1">Gérez votre équipe et vos paramètres</p>
      </div>

      {/* Infos organisation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Organisation</CardTitle>
            <Building2 className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{organization.name}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Membres</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{members.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Plan actuel</CardTitle>
            <Crown className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{plan.name}</span>
              <Badge variant={organization.plan === 'pro' ? 'default' : 'secondary'}>
                {organization.plan === 'pro' ? 'Illimité' : `${plan.maxTests} tests max`}
              </Badge>
            </div>
            {organization.plan === 'free' && (
              <p className="text-sm text-gray-500 mt-1">
                {organization.testCount}/{plan.maxTests} tests utilisés
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Membres */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Membres de l'équipe</CardTitle>
              <CardDescription>Personnes ayant accès à cette organisation</CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Inviter un membre
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Inviter un nouveau membre</DialogTitle>
                  <DialogDescription>
                    Envoyez une invitation par email pour rejoindre {organization.name}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Adresse email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="collegue@entreprise.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button onClick={sendInvitation} disabled={inviting}>
                    {inviting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Envoi...
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-4 w-4" />
                        Envoyer l'invitation
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-gray-500 text-center py-8">Chargement...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Membre depuis</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.uid}>
                    <TableCell className="font-medium">
                      {member.displayName}
                      {member.uid === organization.createdBy && (
                        <Badge variant="outline" className="ml-2">Admin</Badge>
                      )}
                    </TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>
                      {member.createdAt.toLocaleDateString('fr-FR')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Invitations en attente */}
      {pendingInvitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Invitations en attente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Envoyée le</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingInvitations.map((invite) => (
                  <TableRow key={invite.id}>
                    <TableCell>{invite.email}</TableCell>
                    <TableCell>
                      {invite.createdAt.toLocaleDateString('fr-FR')}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyInviteLink(invite.token)}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Copier le lien
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
