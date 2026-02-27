'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Question, Test, TEST_CATEGORIES } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Save, CheckCircle, XCircle, Pencil, Trash2, Plus, ArrowLeft, AlertTriangle, Lock } from 'lucide-react';
import { toast } from 'sonner';

export default function EditTestPage() {
  const { user, organization } = useAuth();
  const router = useRouter();
  const params = useParams();
  const testId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [test, setTest] = useState<Test | null>(null);
  const [hasSubmissions, setHasSubmissions] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<'facile' | 'moyen' | 'difficile'>('moyen');
  const [timeLimit, setTimeLimit] = useState<number | null>(null);
  const [category, setCategory] = useState<string>('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [saving, setSaving] = useState(false);

  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [isNewQuestion, setIsNewQuestion] = useState(false);

  const [editForm, setEditForm] = useState({
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
  });

  useEffect(() => {
    const fetchTest = async () => {
      try {
        const testDoc = await getDoc(doc(db, 'tests', testId));
        if (testDoc.exists()) {
          const testData = {
            id: testDoc.id,
            ...testDoc.data(),
            createdAt: testDoc.data().createdAt?.toDate(),
          } as Test;

          setTest(testData);
          setTitle(testData.title);
          setDescription(testData.description || '');
          setTopic(testData.topic || '');
          setDifficulty(testData.difficulty);
          setTimeLimit(testData.timeLimit || null);
          setCategory(testData.category || '');
          setQuestions(testData.questions);
          setHasSubmissions((testData.submissionCount || 0) > 0);
        } else {
          toast.error('Test introuvable');
          router.push('/admin/dashboard');
        }
      } catch (error) {
        console.error(error);
        toast.error('Erreur lors du chargement du test');
      } finally {
        setLoading(false);
      }
    };

    fetchTest();
  }, [testId, router]);

  const openEditDialog = (question: Question) => {
    setEditingQuestion(question);
    setEditForm({
      question: question.question,
      options: [...question.options],
      correctAnswer: question.correctAnswer,
    });
    setIsNewQuestion(false);
    setEditDialogOpen(true);
  };

  const openAddDialog = () => {
    setEditingQuestion(null);
    setEditForm({
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
    });
    setIsNewQuestion(true);
    setEditDialogOpen(true);
  };

  const saveQuestion = () => {
    if (!editForm.question.trim()) {
      toast.error('La question est requise');
      return;
    }
    if (editForm.options.some(opt => !opt.trim())) {
      toast.error('Toutes les options sont requises');
      return;
    }

    if (isNewQuestion) {
      const newQuestion: Question = {
        id: `q${Date.now()}`,
        question: editForm.question,
        options: editForm.options,
        correctAnswer: editForm.correctAnswer,
      };
      setQuestions([...questions, newQuestion]);
      toast.success('Question ajoutée');
    } else if (editingQuestion) {
      setQuestions(questions.map(q =>
        q.id === editingQuestion.id
          ? { ...q, question: editForm.question, options: editForm.options, correctAnswer: editForm.correctAnswer }
          : q
      ));
      toast.success('Question modifiée');
    }
    setEditDialogOpen(false);
  };

  const deleteQuestion = (questionId: string) => {
    setQuestions(questions.filter(q => q.id !== questionId));
    toast.success('Question supprimée');
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...editForm.options];
    newOptions[index] = value;
    setEditForm({ ...editForm, options: newOptions });
  };

  const saveTest = async () => {
    if (!organization || !test) return;

    if (!title) {
      toast.error('Veuillez entrer un titre');
      return;
    }
    if (questions.length === 0) {
      toast.error('Le test doit contenir au moins une question');
      return;
    }

    setSaving(true);
    try {
      await updateDoc(doc(db, 'tests', testId), {
        title,
        description,
        topic,
        difficulty,
        questions,
        ...(timeLimit ? { timeLimit } : { timeLimit: null }),
        ...(category ? { category } : { category: null }),
      });

      toast.success('Test modifié avec succès');
      router.push('/admin/dashboard');
    } catch (error) {
      console.error(error);
      toast.error('Erreur lors de la sauvegarde du test');
    } finally {
      setSaving(false);
    }
  };

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

  if (hasSubmissions) {
    return (
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Link href="/admin/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Modifier le test</h1>
            <p className="text-gray-600 mt-1">{test.title}</p>
          </div>
        </div>

        <Alert variant="destructive">
          <Lock className="h-4 w-4" />
          <AlertTitle>Modification impossible</AlertTitle>
          <AlertDescription>
            Ce test ne peut plus être modifié car des candidats l'ont déjà passé ({test.submissionCount} participation{test.submissionCount > 1 ? 's' : ''}).
            <br /><br />
            Modifier les questions ou les réponses après que des candidats aient passé le test fausserait leurs résultats.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Que faire ?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">Vous avez plusieurs options :</p>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li><strong>Créer un nouveau test</strong> — Dupliquez ce test et apportez vos modifications sur la copie</li>
              <li><strong>Consulter les résultats</strong> — Analysez les performances des candidats</li>
              <li><strong>Désactiver ce test</strong> — Empêchez de nouvelles participations</li>
            </ul>
            <div className="flex gap-4 pt-4">
              <Link href="/admin/tests/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer un nouveau test
                </Button>
              </Link>
              <Link href={`/admin/tests/${testId}/results`}>
                <Button variant="outline">
                  Voir les résultats
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/admin/dashboard">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Modifier le test</h1>
          <p className="text-gray-600 mt-1">Modifiez les informations et les questions du test</p>
        </div>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Aucune participation</AlertTitle>
        <AlertDescription>
          Ce test n'a pas encore été passé par des candidats. Vous pouvez le modifier librement.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Informations du test</CardTitle>
          <CardDescription>Modifiez les paramètres de votre test</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titre du test *</Label>
              <Input
                id="title"
                placeholder="Ex: Test de JavaScript"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulté</Label>
              <Select value={difficulty} onValueChange={(v: 'facile' | 'moyen' | 'difficile') => setDifficulty(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="facile">Facile</SelectItem>
                  <SelectItem value="moyen">Moyen</SelectItem>
                  <SelectItem value="difficile">Difficile</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="timeLimit">Temps limite (optionnel)</Label>
              <Select
                value={timeLimit?.toString() || 'none'}
                onValueChange={(v) => setTimeLimit(v === 'none' ? null : parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pas de limite" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Pas de limite</SelectItem>
                  <SelectItem value="5">5 minutes</SelectItem>
                  <SelectItem value="10">10 minutes</SelectItem>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="20">20 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">1 heure</SelectItem>
                  <SelectItem value="90">1h30</SelectItem>
                  <SelectItem value="120">2 heures</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Catégorie (optionnel)</Label>
              <Select
                value={category || 'none'}
                onValueChange={(v) => setCategory(v === 'none' ? '' : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucune catégorie</SelectItem>
                  {TEST_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optionnel)</Label>
            <Textarea
              id="description"
              placeholder="Décrivez l'objectif de ce test..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="topic">Sujet du test</Label>
            <Textarea
              id="topic"
              placeholder="Ex: Les bases de JavaScript : variables, fonctions, boucles..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Questions ({questions.length})</CardTitle>
              <CardDescription>Modifiez, supprimez ou ajoutez des questions</CardDescription>
            </div>
            <Button onClick={openAddDialog} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une question
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {questions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Aucune question. Ajoutez-en une pour commencer.</p>
            </div>
          ) : (
            questions.map((q, index) => (
              <div key={q.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <p className="font-medium flex-1">
                    {index + 1}. {q.question}
                  </p>
                  <div className="flex items-center gap-1 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(q)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteQuestion(q.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {q.options.map((option, optIndex) => (
                    <div
                      key={optIndex}
                      className={`p-2 rounded flex items-center gap-2 ${optIndex === q.correctAnswer
                        ? 'bg-green-100 text-green-800'
                        : 'bg-white border'
                        }`}
                    >
                      {optIndex === q.correctAnswer ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-gray-400" />
                      )}
                      {option}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{isNewQuestion ? 'Ajouter une question' : 'Modifier la question'}</DialogTitle>
            <DialogDescription>
              {isNewQuestion ? 'Créez une nouvelle question QCM' : 'Modifiez les détails de la question'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editQuestion">Question *</Label>
              <Textarea
                id="editQuestion"
                value={editForm.question}
                onChange={(e) => setEditForm({ ...editForm, question: e.target.value })}
                placeholder="Entrez votre question..."
                rows={2}
              />
            </div>
            <div className="space-y-3">
              <Label>Options de réponse *</Label>
              {editForm.options.map((option, index) => (
                <div key={index} className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setEditForm({ ...editForm, correctAnswer: index })}
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${editForm.correctAnswer === index
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                      }`}
                  >
                    {String.fromCharCode(65 + index)}
                  </button>
                  <Input
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    placeholder={`Option ${String.fromCharCode(65 + index)}`}
                    className="flex-1"
                  />
                  {editForm.correctAnswer === index && (
                    <span className="text-sm text-green-600 font-medium">✓ Correcte</span>
                  )}
                </div>
              ))}
              <p className="text-sm text-gray-500">Cliquez sur une lettre pour définir la bonne réponse</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={saveQuestion}>
              {isNewQuestion ? 'Ajouter' : 'Sauvegarder'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex justify-end">
        <Button onClick={saveTest} disabled={saving} size="lg">
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sauvegarde...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Sauvegarder les modifications
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
