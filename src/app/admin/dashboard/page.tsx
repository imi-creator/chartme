'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, addDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Test, Submission, TEST_CATEGORIES } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Eye, Link2, Users, FileText, TrendingUp, ToggleLeft, ToggleRight, Copy, Award, Target, Calendar, Trash2, Search, GraduationCap, Pencil } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { nanoid } from 'nanoid';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

export default function DashboardPage() {
  const { user, organization } = useAuth();
  const [tests, setTests] = useState<Test[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [testToDelete, setTestToDelete] = useState<Test | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [participantSearch, setParticipantSearch] = useState('');
  const [expandedParticipant, setExpandedParticipant] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !organization) return;

    // Filtrer les tests par organisation
    const testsQuery = query(
      collection(db, 'tests'),
      where('organizationId', '==', organization.id),
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

    // Filtrer les soumissions par organisation
    const submissionsQuery = query(
      collection(db, 'submissions'),
      where('organizationId', '==', organization.id),
      orderBy('completedAt', 'desc')
    );

    const unsubscribeSubmissions = onSnapshot(submissionsQuery, (snapshot) => {
      const subsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        completedAt: doc.data().completedAt?.toDate(),
      })) as Submission[];
      setSubmissions(subsData);
    });

    return () => {
      unsubscribeTests();
      unsubscribeSubmissions();
    };
  }, [user, organization]);

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
    if (!organization) return;
    try {
      const newUniqueLink = nanoid(10);
      await addDoc(collection(db, 'tests'), {
        title: `${test.title} (copie)`,
        description: test.description,
        topic: test.topic,
        difficulty: test.difficulty,
        questions: test.questions,
        uniqueLink: newUniqueLink,
        organizationId: organization.id,
        createdBy: user?.uid,
        createdAt: Timestamp.now(),
        isActive: false,
        submissionCount: 0,
        ...(test.timeLimit && { timeLimit: test.timeLimit }),
        ...(test.category && { category: test.category }),
      });
      toast.success('Test dupliqué avec succès');
    } catch (error) {
      console.error(error);
      toast.error('Erreur lors de la duplication');
    }
  };

  const confirmDeleteTest = (test: Test) => {
    setTestToDelete(test);
    setDeleteDialogOpen(true);
  };

  const deleteTest = async () => {
    if (!testToDelete) return;
    setDeleting(true);
    try {
      await deleteDoc(doc(db, 'tests', testToDelete.id));
      toast.success('Test supprimé avec succès');
      setDeleteDialogOpen(false);
      setTestToDelete(null);
    } catch (error) {
      console.error(error);
      toast.error('Erreur lors de la suppression');
    } finally {
      setDeleting(false);
    }
  };

  const filteredTests = tests.filter(t => {
    const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
    const matchesSearch = searchQuery === '' || 
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.testId && t.testId.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

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

  const participants = useMemo(() => {
    const grouped: { [email: string]: { name: string; email: string; submissions: Submission[] } } = {};
    submissions.forEach(sub => {
      if (!grouped[sub.candidateEmail]) {
        grouped[sub.candidateEmail] = { name: sub.candidateName, email: sub.candidateEmail, submissions: [] };
      }
      grouped[sub.candidateEmail].submissions.push(sub);
    });
    return Object.values(grouped);
  }, [submissions]);

  const filteredParticipants = participants.filter(p => {
    if (participantSearch === '') return true;
    const q = participantSearch.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div className="relative -mx-4 sm:-mx-6 lg:-mx-8 -mt-8 px-4 sm:px-6 lg:px-8 pt-8 pb-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a38fd]/[0.04] via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:48px_48px]" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-[#0a38fd]/10 border border-[#0a38fd]/20 text-[#0a38fd] px-3 py-1 rounded-full text-xs font-medium mb-3">
              <Target className="h-3 w-3" />
              {organization?.name || 'Mon espace'}
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-black tracking-tight">
              Bonjour{user?.displayName ? `, ${user.displayName.split(' ')[0]}` : ''}
            </h1>
            <p className="text-black/40 mt-1">Voici un aperçu de vos tests et résultats</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/admin/parcours">
              <Button variant="outline" className="border-black/10 bg-white/80 backdrop-blur-sm hover:bg-black/5 rounded-xl">
                <GraduationCap className="h-4 w-4 mr-2" />
                Parcours
              </Button>
            </Link>
            <Link href="/admin/tests/new">
              <Button className="bg-[#0a38fd] hover:bg-[#0a38fd]/90 text-white rounded-xl shadow-lg shadow-[#0a38fd]/20">
                <Plus className="h-4 w-4 mr-2" />
                Nouveau test
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Primary metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Tests créés', value: tests.length, icon: FileText, lightBg: 'bg-[#0a38fd]/10', iconColor: 'text-[#0a38fd]' },
          { label: 'Tests actifs', value: activeTests, icon: Target, lightBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
          { label: 'Participations', value: totalSubmissions, icon: Users, lightBg: 'bg-violet-50', iconColor: 'text-violet-600' },
          { label: 'Score moyen', value: `${averageScore}%`, icon: TrendingUp, lightBg: 'bg-amber-50', iconColor: 'text-amber-600' },
        ].map((m) => (
          <div key={m.label} className="group bg-white border border-black/[0.06] rounded-2xl p-5 hover:shadow-lg hover:shadow-black/[0.04] transition-all duration-300">
            <div className={`w-10 h-10 ${m.lightBg} rounded-xl flex items-center justify-center mb-4`}>
              <m.icon className={`h-5 w-5 ${m.iconColor}`} />
            </div>
            <div className="text-3xl font-bold text-black tracking-tight">{m.value}</div>
            <p className="text-sm text-black/40 mt-0.5">{m.label}</p>
          </div>
        ))}
      </div>

      {/* Secondary metrics - dark strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex items-center gap-4 bg-black rounded-2xl p-5 border border-white/[0.06]">
          <div className="w-10 h-10 bg-yellow-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Award className="h-5 w-5 text-yellow-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{bestScore}%</div>
            <p className="text-xs text-white/40">Meilleur score</p>
          </div>
        </div>
        <div className="flex items-center gap-4 bg-black rounded-2xl p-5 border border-white/[0.06]">
          <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Calendar className="h-5 w-5 text-purple-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">
              {participationsOverTime.reduce((acc, d) => acc + d.participations, 0)}
            </div>
            <p className="text-xs text-white/40">Cette semaine</p>
          </div>
        </div>
        <div className="flex items-center gap-4 bg-black rounded-2xl p-5 border border-white/[0.06]">
          <div className="w-10 h-10 bg-[#0a38fd]/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Users className="h-5 w-5 text-[#0a38fd]" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{participants.length}</div>
            <p className="text-xs text-white/40">Participants uniques</p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-black/[0.06] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-semibold text-black">Participations</h3>
              <p className="text-xs text-black/40 mt-0.5">7 derniers jours</p>
            </div>
            <div className="w-8 h-8 bg-[#0a38fd]/10 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-[#0a38fd]" />
            </div>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={participationsOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#000', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '13px' }}
                  labelStyle={{ color: '#fff', fontWeight: '600', marginBottom: '4px' }}
                  itemStyle={{ color: '#94a3b8' }}
                />
                <Line
                  type="monotone"
                  dataKey="participations"
                  stroke="#0a38fd"
                  strokeWidth={2.5}
                  dot={{ fill: '#0a38fd', strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6, fill: '#0a38fd', strokeWidth: 2, stroke: '#fff' }}
                  name="Participations"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-black/[0.06] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-semibold text-black">Performance par test</h3>
              <p className="text-xs text-black/40 mt-0.5">Score moyen par test</p>
            </div>
            <div className="w-8 h-8 bg-[#0a38fd]/10 rounded-lg flex items-center justify-center">
              <FileText className="h-4 w-4 text-[#0a38fd]" />
            </div>
          </div>
          <div className="h-56">
            {testPerformanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={testPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} angle={-20} textAnchor="end" height={50} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#000', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '13px' }}
                    formatter={(value) => [`${value}%`, 'Score moyen']}
                  />
                  <Bar dataKey="score" fill="#0a38fd" radius={[6, 6, 0, 0]} name="Score moyen" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-black/30">
                <FileText className="h-8 w-8 mb-2" />
                <span className="text-sm">Aucune donnée disponible</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Score Distribution & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white border border-black/[0.06] rounded-2xl p-6">
          <h3 className="text-base font-semibold text-black mb-1">Distribution des scores</h3>
          <p className="text-xs text-black/40 mb-6">Répartition des résultats</p>
          <div className="h-44">
            {submissions.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={scoreDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="count"
                    strokeWidth={0}
                  >
                    {scoreDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#000', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '13px' }}
                    formatter={(value) => [value, 'Candidats']}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-black/30">
                <Target className="h-8 w-8 mb-2" />
                <span className="text-sm">Aucune donnée</span>
              </div>
            )}
          </div>
          <div className="flex flex-wrap justify-center gap-3 mt-3">
            {scoreDistribution.map((range) => (
              <div key={range.name} className="flex items-center gap-1.5 text-xs text-black/50">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: range.color }} />
                <span>{range.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white border border-black/[0.06] rounded-2xl p-6">
          <h3 className="text-base font-semibold text-black mb-1">Dernières participations</h3>
          <p className="text-xs text-black/40 mb-6">Activité récente sur vos tests</p>
          {recentSubmissions.length > 0 ? (
            <div className="space-y-2">
              {recentSubmissions.map((sub) => {
                const pct = Math.round((sub.score / sub.totalQuestions) * 100);
                return (
                  <Link key={sub.id} href={`/admin/tests/${sub.testId}/results`}>
                    <div className="flex items-center justify-between p-3.5 rounded-xl hover:bg-black/[0.03] transition-colors cursor-pointer group">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white ${
                          pct >= 75 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500'
                        }`}>
                          {sub.candidateName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-sm text-black">{sub.candidateName}</p>
                          <p className="text-xs text-black/40">{sub.testTitle}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className={`text-sm font-semibold ${
                            pct >= 75 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-600' : 'text-red-600'
                          }`}>
                            {pct}%
                          </span>
                          <p className="text-[11px] text-black/30">
                            {sub.completedAt.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                          </p>
                        </div>
                        <Eye className="h-4 w-4 text-black/20 group-hover:text-[#0a38fd] transition-colors" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-black/30">
              <Users className="h-8 w-8 mb-2" />
              <span className="text-sm">Aucune participation récente</span>
            </div>
          )}
        </div>
      </div>

      {/* Tests section */}
      <div className="bg-white border border-black/[0.06] rounded-2xl overflow-hidden">
        <div className="p-6 pb-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-xl font-bold text-black">Mes tests</h3>
              <p className="text-sm text-black/40 mt-0.5">Gérez et suivez vos tests de positionnement</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black/30" />
                <Input
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-56 rounded-xl border-black/10 bg-black/[0.02] placeholder:text-black/30 focus:bg-white"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-44 rounded-xl border-black/10 bg-black/[0.02]">
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  {TEST_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-black/30">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#0a38fd] border-t-transparent mr-3" />
              Chargement...
            </div>
          ) : filteredTests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 bg-black/[0.03] rounded-2xl flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-black/20" />
              </div>
              <p className="text-black/40 mb-4 text-sm">
                {searchQuery || categoryFilter !== 'all' ? 'Aucun test trouvé' : 'Aucun test créé pour le moment'}
              </p>
              <Link href="/admin/tests/new">
                <Button className="bg-[#0a38fd] hover:bg-[#0a38fd]/90 text-white rounded-xl">
                  <Plus className="h-4 w-4 mr-2" />
                  Créer mon premier test
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredTests.map((test) => {
                const testSubmissions = submissions.filter(s => s.testId === test.id);
                const testAvg = testSubmissions.length > 0
                  ? Math.round(testSubmissions.reduce((acc, s) => acc + (s.score / s.totalQuestions) * 100, 0) / testSubmissions.length)
                  : null;
                return (
                  <div
                    key={test.id}
                    className="group flex items-center gap-4 p-4 rounded-xl border border-transparent hover:border-black/[0.06] hover:bg-black/[0.015] transition-all duration-200"
                  >
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${test.isActive ? 'bg-emerald-500' : 'bg-black/20'}`} />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm text-black truncate">{test.title}</p>
                        {test.testId && (
                          <span className="text-[10px] font-mono text-black/30 bg-black/[0.04] px-1.5 py-0.5 rounded">
                            {test.testId}
                          </span>
                        )}
                        {test.category && (
                          <Badge variant="outline" className="text-[10px] border-black/10 text-black/40 font-normal">
                            {getCategoryLabel(test.category)}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-black/30">
                        <span>{test.questions.length} questions</span>
                        <span className="text-black/15">·</span>
                        <span className="capitalize">{test.difficulty}</span>
                        <span className="text-black/15">·</span>
                        <span>{testSubmissions.length} participation{testSubmissions.length !== 1 ? 's' : ''}</span>
                        {testAvg !== null && (
                          <>
                            <span className="text-black/15">·</span>
                            <span className={testAvg >= 75 ? 'text-emerald-600' : testAvg >= 50 ? 'text-amber-600' : 'text-red-500'}>
                              Moy. {testAvg}%
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleTestStatus(test.id, test.isActive)}
                        className="h-8 w-8 p-0 rounded-lg hover:bg-black/5"
                        title={test.isActive ? 'Désactiver' : 'Activer'}
                      >
                        {test.isActive ? (
                          <ToggleRight className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <ToggleLeft className="h-4 w-4 text-black/30" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyLink(test.uniqueLink)}
                        className="h-8 w-8 p-0 rounded-lg hover:bg-black/5"
                        title="Copier le lien"
                      >
                        <Link2 className="h-4 w-4 text-black/40" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => duplicateTest(test)}
                        className="h-8 w-8 p-0 rounded-lg hover:bg-black/5"
                        title="Dupliquer"
                      >
                        <Copy className="h-4 w-4 text-black/40" />
                      </Button>
                      <Link href={`/admin/tests/${test.id}/edit`}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-black/5" title="Modifier">
                          <Pencil className="h-4 w-4 text-black/40" />
                        </Button>
                      </Link>
                      <Link href={`/admin/tests/${test.id}/results`}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-[#0a38fd]/5" title="Résultats">
                          <Eye className="h-4 w-4 text-[#0a38fd]" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => confirmDeleteTest(test)}
                        className="h-8 w-8 p-0 rounded-lg hover:bg-red-50"
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4 text-red-400" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Section Participants */}
      <div className="bg-white border border-black/[0.06] rounded-2xl overflow-hidden">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-xl font-bold text-black">Participants</h3>
              <p className="text-sm text-black/40 mt-0.5">Recherchez un participant et accédez à ses résultats</p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black/30" />
              <Input
                placeholder="Rechercher par nom ou email..."
                value={participantSearch}
                onChange={(e) => setParticipantSearch(e.target.value)}
                className="pl-9 w-72 rounded-xl border-black/10 bg-black/[0.02] placeholder:text-black/30 focus:bg-white"
              />
            </div>
          </div>

          {filteredParticipants.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 bg-black/[0.03] rounded-2xl flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-black/20" />
              </div>
              <p className="text-sm text-black/40">
                {participantSearch ? 'Aucun participant trouvé' : 'Aucun participant pour le moment'}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredParticipants.map((p) => {
                const avgScore = Math.round(
                  p.submissions.reduce((acc, s) => acc + (s.score / s.totalQuestions) * 100, 0) / p.submissions.length
                );
                const isExpanded = expandedParticipant === p.email;
                return (
                  <div key={p.email} className="rounded-xl transition-colors">
                    <div
                      className="group flex items-center gap-4 p-4 rounded-xl hover:bg-black/[0.02] cursor-pointer"
                      onClick={() => setExpandedParticipant(isExpanded ? null : p.email)}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0 ${
                        avgScore >= 75 ? 'bg-emerald-500' : avgScore >= 50 ? 'bg-amber-500' : 'bg-red-500'
                      }`}>
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-black">{p.name}</p>
                        <p className="text-xs text-black/30">{p.email}</p>
                      </div>
                      <div className="flex items-center gap-2 mr-4">
                        <span className={`text-sm font-semibold ${
                          avgScore >= 75 ? 'text-emerald-600' : avgScore >= 50 ? 'text-amber-600' : 'text-red-600'
                        }`}>
                          {avgScore}%
                        </span>
                        <span className="text-xs text-black/30">moy.</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 max-w-sm">
                        {p.submissions.slice(0, 3).map((sub) => (
                          <Link key={sub.id} href={`/admin/tests/${sub.testId}/results`} onClick={(e) => e.stopPropagation()}>
                            <Badge
                              variant="outline"
                              className="text-[10px] cursor-pointer hover:bg-[#0a38fd]/5 hover:border-[#0a38fd]/30 hover:text-[#0a38fd] transition-colors border-black/10 text-black/50 font-normal"
                            >
                              {sub.testTitle.length > 20 ? sub.testTitle.substring(0, 20) + '...' : sub.testTitle} — {Math.round((sub.score / sub.totalQuestions) * 100)}%
                            </Badge>
                          </Link>
                        ))}
                        {p.submissions.length > 3 && (
                          <Badge
                            variant="outline"
                            className="text-[10px] border-black/10 text-black/50 font-normal cursor-pointer hover:bg-[#0a38fd]/5 hover:border-[#0a38fd]/30 hover:text-[#0a38fd] transition-colors"
                          >
                            {isExpanded ? 'Réduire' : `+${p.submissions.length - 3}`}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="ml-14 mr-4 mb-3 mt-1 bg-black/[0.02] rounded-xl p-4 space-y-2">
                        <p className="text-xs font-medium text-black/50 mb-3">Tous les tests passés ({p.submissions.length})</p>
                        {p.submissions.map((sub) => {
                          const pct = Math.round((sub.score / sub.totalQuestions) * 100);
                          return (
                            <Link key={sub.id} href={`/admin/tests/${sub.testId}/results`}>
                              <div className="flex items-center justify-between p-3 rounded-lg bg-white border border-black/[0.06] hover:border-[#0a38fd]/30 hover:shadow-sm transition-all cursor-pointer group">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-black truncate">{sub.testTitle}</p>
                                  <p className="text-[11px] text-black/30 mt-0.5">
                                    {sub.completedAt.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                                  </p>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className={`text-sm font-semibold ${
                                    pct >= 75 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-600' : 'text-red-600'
                                  }`}>
                                    {sub.score}/{sub.totalQuestions} ({pct}%)
                                  </span>
                                  <Eye className="h-4 w-4 text-black/20 group-hover:text-[#0a38fd] transition-colors" />
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Dialog de confirmation de suppression */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Supprimer le test</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer le test &quot;{testToDelete?.title}&quot; ?
              Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleting} className="rounded-xl">
              Annuler
            </Button>
            <Button variant="destructive" onClick={deleteTest} disabled={deleting} className="rounded-xl">
              {deleting ? 'Suppression...' : 'Supprimer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
