'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { collection, query, where, onSnapshot, addDoc, Timestamp, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Test, TrainingPath, SESSION_TYPES } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Plus, GraduationCap, Loader2, Trash2, Eye, Calendar, Users } from 'lucide-react';
import { toast } from 'sonner';

export default function ParcoursPage() {
  const { user, organization } = useAuth();
  const organizationId = organization?.id;
  const [trainingPaths, setTrainingPaths] = useState<TrainingPath[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state
  const [selectedTestId, setSelectedTestId] = useState('');
  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [positionnementDate, setPositionnementDate] = useState('');
  const [evaluationDate, setEvaluationDate] = useState('');

  useEffect(() => {
    if (!organizationId) return;

    // Fetch training paths
    const pathsQuery = query(
      collection(db, 'trainingPaths'),
      where('organizationId', '==', organizationId)
    );

    const unsubscribePaths = onSnapshot(pathsQuery, (snapshot) => {
      const pathsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        sessions: doc.data().sessions.map((s: { scheduledDate: { toDate: () => Date }; completedAt?: { toDate: () => Date } }) => ({
          ...s,
          scheduledDate: s.scheduledDate?.toDate(),
          completedAt: s.completedAt?.toDate(),
        })),
      })) as TrainingPath[];

      pathsData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setTrainingPaths(pathsData);
      setLoading(false);
    });

    // Fetch tests for the dropdown
    const testsQuery = query(
      collection(db, 'tests'),
      where('organizationId', '==', organizationId),
      where('isActive', '==', true)
    );

    const unsubscribeTests = onSnapshot(testsQuery, (snapshot) => {
      const testsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
      })) as Test[];
      setTests(testsData);
    });

    return () => {
      unsubscribePaths();
      unsubscribeTests();
    };
  }, [organizationId]);

  const resetForm = () => {
    setSelectedTestId('');
    setCandidateName('');
    setCandidateEmail('');
    setPositionnementDate('');
    setEvaluationDate('');
  };

  const createTrainingPath = async () => {
    if (!selectedTestId || !candidateName || !candidateEmail || !positionnementDate || !evaluationDate) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    if (!candidateEmail.includes('@')) {
      toast.error('Veuillez entrer un email valide');
      return;
    }

    const selectedTest = tests.find((t) => t.id === selectedTestId);
    if (!selectedTest) {
      toast.error('Test introuvable');
      return;
    }

    setCreating(true);
    try {
      await addDoc(collection(db, 'trainingPaths'), {
        organizationId,
        testId: selectedTestId,
        testTitle: selectedTest.title,
        candidateName,
        candidateEmail: candidateEmail.toLowerCase(),
        sessions: [
          {
            type: 'positionnement',
            scheduledDate: Timestamp.fromDate(new Date(positionnementDate)),
            status: 'pending',
          },
          {
            type: 'evaluation',
            scheduledDate: Timestamp.fromDate(new Date(evaluationDate)),
            status: 'pending',
          },
        ],
        createdBy: user?.uid,
        createdAt: Timestamp.now(),
        status: 'active',
      });

      toast.success('Parcours créé avec succès');
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error(error);
      toast.error('Erreur lors de la création du parcours');
    } finally {
      setCreating(false);
    }
  };

  const deleteTrainingPath = async (pathId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce parcours ?')) return;

    try {
      await deleteDoc(doc(db, 'trainingPaths', pathId));
      toast.success('Parcours supprimé');
    } catch (error) {
      console.error(error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const getStatusBadge = (path: TrainingPath) => {
    if (path.status === 'completed') {
      return <Badge className="bg-green-100 text-green-800">Terminé</Badge>;
    }
    if (path.status === 'cancelled') {
      return <Badge variant="destructive">Annulé</Badge>;
    }
    const completedCount = path.sessions.filter((s) => s.status === 'completed').length;
    return (
      <Badge variant="secondary">
        {completedCount}/{path.sessions.length} sessions
      </Badge>
    );
  };

  const getSessionLabel = (type: string) => {
    return SESSION_TYPES.find((s) => s.value === type)?.label || type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Parcours de formation</h1>
            <p className="text-gray-600 mt-1">
              Planifiez et suivez les évaluations de vos stagiaires
            </p>
          </div>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau parcours
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Créer un parcours de formation</DialogTitle>
              <DialogDescription>
                Planifiez un test de positionnement et une évaluation finale pour un stagiaire
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Test à utiliser *</Label>
                <Select value={selectedTestId} onValueChange={setSelectedTestId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un test" />
                  </SelectTrigger>
                  <SelectContent>
                    {tests.map((test) => (
                      <SelectItem key={test.id} value={test.id}>
                        {test.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="candidateName">Nom du stagiaire *</Label>
                <Input
                  id="candidateName"
                  placeholder="Jean Dupont"
                  value={candidateName}
                  onChange={(e) => setCandidateName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="candidateEmail">Email du stagiaire *</Label>
                <Input
                  id="candidateEmail"
                  type="email"
                  placeholder="jean.dupont@example.com"
                  value={candidateEmail}
                  onChange={(e) => setCandidateEmail(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="positionnementDate">Date positionnement *</Label>
                  <Input
                    id="positionnementDate"
                    type="date"
                    value={positionnementDate}
                    onChange={(e) => setPositionnementDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="evaluationDate">Date évaluation *</Label>
                  <Input
                    id="evaluationDate"
                    type="date"
                    value={evaluationDate}
                    onChange={(e) => setEvaluationDate(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={createTrainingPath} disabled={creating}>
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Création...
                  </>
                ) : (
                  'Créer le parcours'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Parcours actifs</CardTitle>
            <GraduationCap className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {trainingPaths.filter((p) => p.status === 'active').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Parcours terminés</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {trainingPaths.filter((p) => p.status === 'completed').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total stagiaires</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{trainingPaths.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des parcours */}
      <Card>
        <CardHeader>
          <CardTitle>Tous les parcours</CardTitle>
          <CardDescription>Liste des parcours de formation créés</CardDescription>
        </CardHeader>
        <CardContent>
          {trainingPaths.length === 0 ? (
            <div className="text-center py-12">
              <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">Aucun parcours créé</p>
              <p className="text-sm text-gray-400">
                Créez votre premier parcours pour suivre la progression d'un stagiaire
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Stagiaire</TableHead>
                  <TableHead>Test</TableHead>
                  <TableHead>Sessions</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Créé le</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trainingPaths.map((path) => (
                  <TableRow key={path.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{path.candidateName}</p>
                        <p className="text-sm text-gray-500">{path.candidateEmail}</p>
                      </div>
                    </TableCell>
                    <TableCell>{path.testTitle}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {path.sessions.map((session, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm">
                            <Badge
                              variant={session.status === 'completed' ? 'default' : 'outline'}
                              className="text-xs"
                            >
                              {getSessionLabel(session.type)}
                            </Badge>
                            <span className="text-gray-500">
                              {session.scheduledDate.toLocaleDateString('fr-FR')}
                            </span>
                            {session.status === 'completed' && (
                              <span className="text-green-600">✓</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(path)}</TableCell>
                    <TableCell className="text-gray-500">
                      {path.createdAt.toLocaleDateString('fr-FR')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Link href={`/admin/parcours/${path.id}`}>
                          <Button variant="ghost" size="sm" title="Voir la progression">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteTrainingPath(path.id)}
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
