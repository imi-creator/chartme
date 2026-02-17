'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { doc, getDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Test, Submission } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Copy, Users, TrendingUp, Award, Loader2, Eye, Download } from 'lucide-react';
import { toast } from 'sonner';

export default function TestResultsPage() {
  const params = useParams();
  const testId = params.id as string;

  const [test, setTest] = useState<Test | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTest = async () => {
      const testDoc = await getDoc(doc(db, 'tests', testId));
      if (testDoc.exists()) {
        setTest({
          id: testDoc.id,
          ...testDoc.data(),
          createdAt: testDoc.data().createdAt?.toDate(),
        } as Test);
      }
    };

    fetchTest();

    const submissionsQuery = query(
      collection(db, 'submissions'),
      where('testId', '==', testId)
    );

    const unsubscribe = onSnapshot(submissionsQuery, (snapshot) => {
      const subsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        completedAt: doc.data().completedAt?.toDate(),
      })) as Submission[];
      
      subsData.sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime());
      setSubmissions(subsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [testId]);

  const copyLink = () => {
    if (!test) return;
    const url = `${window.location.origin}/test/${test.uniqueLink}`;
    navigator.clipboard.writeText(url);
    toast.success('Lien copié dans le presse-papier');
  };

  const exportToCSV = () => {
    if (!test || submissions.length === 0) {
      toast.error('Aucune donnée à exporter');
      return;
    }

    const headers = ['Nom', 'Email', 'Score', 'Total Questions', 'Pourcentage', 'Date'];
    const rows = submissions.map(s => [
      s.candidateName,
      s.candidateEmail,
      s.score.toString(),
      s.totalQuestions.toString(),
      `${Math.round((s.score / s.totalQuestions) * 100)}%`,
      s.completedAt.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    ]);

    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.join(';'))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `resultats_${test.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('Export CSV téléchargé');
  };

  const averageScore = submissions.length > 0
    ? Math.round(submissions.reduce((acc, s) => acc + (s.score / s.totalQuestions) * 100, 0) / submissions.length)
    : 0;

  const bestScore = submissions.length > 0
    ? Math.max(...submissions.map(s => Math.round((s.score / s.totalQuestions) * 100)))
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!test) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Test introuvable</p>
        <Link href="/admin/dashboard">
          <Button variant="link">Retour au dashboard</Button>
        </Link>
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
            <h1 className="text-3xl font-bold text-gray-900">{test.title}</h1>
            <p className="text-gray-600 mt-1">{test.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={exportToCSV} variant="outline" disabled={submissions.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={copyLink}>
            <Copy className="h-4 w-4 mr-2" />
            Copier le lien
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Participations</CardTitle>
            <Users className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{submissions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Score moyen</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{averageScore}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Meilleur score</CardTitle>
            <Award className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{bestScore}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{test.questions.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Résultats des candidats</CardTitle>
          <CardDescription>Liste de toutes les soumissions pour ce test</CardDescription>
        </CardHeader>
        <CardContent>
          {submissions.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">Aucune participation pour le moment</p>
              <p className="text-sm text-gray-400">
                Partagez le lien du test pour recevoir des soumissions
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Candidat</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Pourcentage</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((submission) => {
                  const percentage = Math.round((submission.score / submission.totalQuestions) * 100);
                  return (
                    <TableRow key={submission.id}>
                      <TableCell className="font-medium">{submission.candidateName}</TableCell>
                      <TableCell>{submission.candidateEmail}</TableCell>
                      <TableCell>
                        {submission.score}/{submission.totalQuestions}
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          percentage >= 80 ? 'default' :
                          percentage >= 50 ? 'secondary' : 'destructive'
                        }>
                          {percentage}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-500">
                        {submission.completedAt.toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </TableCell>
                      <TableCell>
                        <Link href={`/admin/tests/${testId}/results/${submission.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            Détails
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
