'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, addDoc, Timestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Question, TEST_CATEGORIES, PLANS } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Sparkles, Save, CheckCircle, XCircle, Pencil, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { nanoid } from 'nanoid';

export default function NewTestPage() {
  const { user, organization } = useAuth();
  const router = useRouter();
  
  const [testId, setTestId] = useState(nanoid(8));
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [topic, setTopic] = useState('');
  const [numberOfQuestions, setNumberOfQuestions] = useState(10);
  const [difficulty, setDifficulty] = useState<'facile' | 'moyen' | 'difficile'>('moyen');
  const [timeLimit, setTimeLimit] = useState<number | null>(null);
  const [category, setCategory] = useState<string>('');
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [isNewQuestion, setIsNewQuestion] = useState(false);
  
  const [editForm, setEditForm] = useState({
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
  });

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

  const generateQuestions = async () => {
    if (!topic) {
      toast.error('Veuillez entrer un sujet');
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, numberOfQuestions, difficulty }),
      });

      if (!response.ok) {
        throw new Error('Erreur de génération');
      }

      const data = await response.json();
      setQuestions(data.questions);
      toast.success(`${data.questions.length} questions générées avec succès`);
    } catch (error) {
      console.error(error);
      toast.error('Erreur lors de la génération des questions');
    } finally {
      setGenerating(false);
    }
  };

  const saveTest = async () => {
    if (!organization) return;
    
    if (!title) {
      toast.error('Veuillez entrer un titre');
      return;
    }
    if (questions.length === 0) {
      toast.error('Veuillez générer des questions');
      return;
    }

    // Vérifier la limite du plan gratuit
    const plan = PLANS[organization.plan];
    if (organization.plan === 'free' && organization.testCount >= plan.maxTests) {
      toast.error(`Limite atteinte ! Le plan gratuit est limité à ${plan.maxTests} tests. Passez au plan Pro pour créer plus de tests.`);
      return;
    }

    setSaving(true);
    try {
      const uniqueLink = nanoid(10);
      
      await addDoc(collection(db, 'tests'), {
        testId,
        title,
        description,
        topic,
        difficulty,
        questions,
        uniqueLink,
        organizationId: organization.id,
        createdBy: user?.uid,
        createdAt: Timestamp.now(),
        isActive: true,
        ...(timeLimit && { timeLimit }),
        ...(category && { category }),
      });

      // Incrémenter le compteur de tests de l'organisation
      await updateDoc(doc(db, 'organizations', organization.id), {
        testCount: increment(1),
      });

      toast.success('Test créé avec succès');
      router.push('/admin/dashboard');
    } catch (error) {
      console.error(error);
      toast.error('Erreur lors de la sauvegarde du test');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Créer un nouveau test</h1>
        <p className="text-gray-600 mt-1">Utilisez l'IA pour générer automatiquement vos questions</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations du test</CardTitle>
          <CardDescription>Définissez les paramètres de votre test</CardDescription>
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
              <Label htmlFor="testId">ID du test</Label>
              <Input
                id="testId"
                placeholder="ID unique"
                value={testId}
                onChange={(e) => setTestId(e.target.value)}
                className="font-mono"
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-600" />
            Génération IA
          </CardTitle>
          <CardDescription>Décrivez le sujet et laissez l'IA générer les questions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="topic">Sujet du test *</Label>
            <Textarea
              id="topic"
              placeholder="Ex: Les bases de JavaScript : variables, fonctions, boucles, conditions, tableaux..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              rows={3}
            />
          </div>
          
          <div className="flex items-center gap-4">
            <div className="space-y-2">
              <Label htmlFor="numQuestions">Nombre de questions</Label>
              <Input
                id="numQuestions"
                type="number"
                min={5}
                max={30}
                value={numberOfQuestions}
                onChange={(e) => setNumberOfQuestions(parseInt(e.target.value))}
                className="w-24"
              />
            </div>
            <Button 
              onClick={generateQuestions} 
              disabled={generating || !topic}
              className="mt-6"
            >
              {generating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Génération...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Générer les questions
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {questions.length > 0 && (
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
            {questions.map((q, index) => (
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
                      className={`p-2 rounded flex items-center gap-2 ${
                        optIndex === q.correctAnswer
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
            ))}
          </CardContent>
        </Card>
      )}

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
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                      editForm.correctAnswer === index
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

      {questions.length > 0 && (
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
                Sauvegarder le test
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
