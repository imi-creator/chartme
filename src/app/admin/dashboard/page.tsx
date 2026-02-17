'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Test, Submission, TEST_CATEGORIES } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Eye, Copy, Users, FileText, TrendingUp, ToggleLeft, ToggleRight, Copy as Duplicate, Award, Target, Calendar } from 'lucide-react';
import { nanoid } from 'nanoid';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

export default function DashboardPage() {
  const { user } = useAuth();
  const [tests, setTests] = useState<Test[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
    if (!user) return;

    const testsQuery = query(
      collection(db, 'tests'),
      where('createdBy', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeTests = onSnapshot(testsQuery, (snapshot) => {
      const testsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
      })) as Test[];
      setTests(testsData);
      setLoading(false);
    });

    const submissionsQuery = query(
      collection(db, 'submissions'),
      orderBy('completedAt', 'desc')
    );

    const unsubscribeSubmissions = onSnapshot(submissionsQuery, (snapshot) => {
      const subsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        completedAt: doc.data().completedAt?.toDate(),
      })) as Submission[];
      
      const userTestIds = tests.map(t => t.id);
      const filteredSubs = subsData.filter(s => userTestIds.includes(s.testId));
      setSubmissions(filteredSubs);
    });

    return () => {
      unsubscribeTests();
      unsubscribeSubmissions();
    };
  }, [user, tests.length]);

  const copyLink = (uniqueLink: string) => {
    const url = `${window.location.origin}/test/${uniqueLink}`;
    navigator.clipboard.writeText(url);
    toast.success('Lien copié dans le presse-papier');
  };

  const toggleTestStatus = async (testId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'tests', testId), {
        isActive: !currentStatus,
      });
      toast.success(currentStatus ? 'Test désactivé' : 'Test activé');
    } catch (error) {
      console.error(error);
      toast.error('Erreur lors de la modification du statut');
    }
  };

  const duplicateTest = async (test: Test) => {
    try {
      const newUniqueLink = nanoid(10);
      await addDoc(collection(db, 'tests'), {
        title: `${test.title} (copie)`,
        description: test.description,
        topic: test.topic,
        difficulty: test.difficulty,
        questions: test.questions,
        uniqueLink: newUniqueLink,
        createdBy: user?.uid,
        createdAt: Timestamp.now(),
        isActive: false,
        ...(test.timeLimit && { timeLimit: test.timeLimit }),
      });
      toast.success('Test dupliqué avec succès');
    } catch (error) {
      console.error(error);
      toast.error('Erreur lors de la duplication');
    }
  };

  const filteredTests = categoryFilter === 'all' 
    ? tests 
    : tests.filter(t => t.category === categoryFilter);

  const totalSubmissions = submissions.length;
  const averageScore = submissions.length > 0
    ? Math.round(submissions.reduce((acc, s) => acc + (s.score / s.totalQuestions) * 100, 0) / submissions.length)
    : 0;

  const getCategoryLabel = (value: string) => {
    const cat = TEST_CATEGORIES.find(c => c.value === value);
    return cat ? cat.label : value;
  };

  // Analytics data
  const testPerformanceData = useMemo(() => {
    return tests.slice(0, 6).map(test => {
      const testSubs = submissions.filter(s => s.testId === test.id);
      const avg = testSubs.length > 0
        ? Math.round(testSubs.reduce((acc, s) => acc + (s.score / s.totalQuestions) * 100, 0) / testSubs.length)
        : 0;
      return {
        name: test.title.length > 15 ? test.title.substring(0, 15) + '...' : test.title,
        score: avg,
        participations: testSubs.length,
      };
    });
  }, [tests, submissions]);

  const participationsOverTime = useMemo(() => {
    const last7Days: { [key: string]: number } = {};
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const key = date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' });
      last7Days[key] = 0;
    }

    submissions.forEach(sub => {
      const subDate = new Date(sub.completedAt);
      const diffTime = today.getTime() - subDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 6 && diffDays >= 0) {
        const key = subDate.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' });
        if (last7Days[key] !== undefined) {
          last7Days[key]++;
        }
      }
    });

    return Object.entries(last7Days).map(([name, count]) => ({ name, participations: count }));
  }, [submissions]);

  const scoreDistribution = useMemo(() => {
    const ranges = [
      { name: '0-25%', count: 0, color: '#ef4444' },
      { name: '26-50%', count: 0, color: '#f97316' },
      { name: '51-75%', count: 0, color: '#eab308' },
      { name: '76-100%', count: 0, color: '#22c55e' },
    ];

    submissions.forEach(sub => {
      const percent = (sub.score / sub.totalQuestions) * 100;
      if (percent <= 25) ranges[0].count++;
      else if (percent <= 50) ranges[1].count++;
      else if (percent <= 75) ranges[2].count++;
      else ranges[3].count++;
    });

    return ranges;
  }, [submissions]);

  const bestScore = submissions.length > 0
    ? Math.max(...submissions.map(s => Math.round((s.score / s.totalQuestions) * 100)))
    : 0;

  const activeTests = tests.filter(t => t.isActive).length;

  const recentSubmissions = submissions.slice(0, 5);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Gérez vos tests de positionnement</p>
        </div>
        <Link href="/admin/tests/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau test
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Tests créés</CardTitle>
            <FileText className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tests.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Tests actifs</CardTitle>
            <Target className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeTests}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Participations</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSubmissions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Score moyen</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageScore}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Meilleur score</CardTitle>
            <Award className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bestScore}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Cette semaine</CardTitle>
            <Calendar className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {participationsOverTime.reduce((acc, d) => acc + d.participations, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Participations (7 derniers jours)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={participationsOverTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#6b7280" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    labelStyle={{ fontWeight: 'bold' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="participations" 
                    stroke="#6366f1" 
                    strokeWidth={2}
                    dot={{ fill: '#6366f1', strokeWidth: 2 }}
                    name="Participations"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Performance par test</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {testPerformanceData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={testPerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#6b7280" angle={-20} textAnchor="end" height={60} />
                    <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" domain={[0, 100]} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                      formatter={(value) => [`${value}%`, 'Score moyen']}
                    />
                    <Bar dataKey="score" fill="#22c55e" radius={[4, 4, 0, 0]} name="Score moyen" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  Aucune donnée disponible
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Score Distribution & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Distribution des scores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              {submissions.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={scoreDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="count"
                    >
                      {scoreDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [value, 'Candidats']} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  Aucune donnée
                </div>
              )}
            </div>
            <div className="flex flex-wrap justify-center gap-3 mt-2">
              {scoreDistribution.map((range) => (
                <div key={range.name} className="flex items-center gap-1 text-xs">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: range.color }} />
                  <span>{range.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Dernières participations</CardTitle>
          </CardHeader>
          <CardContent>
            {recentSubmissions.length > 0 ? (
              <div className="space-y-3">
                {recentSubmissions.map((sub) => (
                  <div key={sub.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{sub.candidateName}</p>
                      <p className="text-xs text-gray-500">{sub.testTitle}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={
                        (sub.score / sub.totalQuestions) * 100 >= 75 ? 'default' :
                        (sub.score / sub.totalQuestions) * 100 >= 50 ? 'secondary' : 'destructive'
                      }>
                        {sub.score}/{sub.totalQuestions} ({Math.round((sub.score / sub.totalQuestions) * 100)}%)
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1">
                        {sub.completedAt.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Aucune participation récente
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Mes tests</CardTitle>
              <CardDescription>Liste de tous vos tests de positionnement</CardDescription>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrer par catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                {TEST_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-gray-500 text-center py-8">Chargement...</p>
          ) : filteredTests.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">Aucun test créé pour le moment</p>
              <Link href="/admin/tests/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer mon premier test
                </Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titre</TableHead>
                  <TableHead>Questions</TableHead>
                  <TableHead>Difficulté</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Participations</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTests.map((test) => {
                  const testSubmissions = submissions.filter(s => s.testId === test.id);
                  return (
                    <TableRow key={test.id}>
                      <TableCell className="font-medium">
                        <div>
                          {test.title}
                          {test.category && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              {getCategoryLabel(test.category)}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{test.questions.length}</TableCell>
                      <TableCell>
                        <Badge variant={
                          test.difficulty === 'facile' ? 'secondary' :
                          test.difficulty === 'moyen' ? 'default' : 'destructive'
                        }>
                          {test.difficulty}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={test.isActive ? 'default' : 'secondary'}>
                          {test.isActive ? 'Actif' : 'Inactif'}
                        </Badge>
                      </TableCell>
                      <TableCell>{testSubmissions.length}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleTestStatus(test.id, test.isActive)}
                            title={test.isActive ? 'Désactiver' : 'Activer'}
                          >
                            {test.isActive ? (
                              <ToggleRight className="h-5 w-5 text-green-600" />
                            ) : (
                              <ToggleLeft className="h-5 w-5 text-gray-400" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyLink(test.uniqueLink)}
                            title="Copier le lien"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => duplicateTest(test)}
                            title="Dupliquer le test"
                          >
                            <Duplicate className="h-4 w-4" />
                          </Button>
                          <Link href={`/admin/tests/${test.id}/results`}>
                            <Button variant="ghost" size="sm" title="Voir les résultats">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
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
