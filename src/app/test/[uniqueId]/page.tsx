'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { collection, query, where, getDocs, addDoc, Timestamp, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Test, Question, TrainingPath, SessionType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ClipboardCheck, Loader2, CheckCircle, ArrowRight, ArrowLeft, Clock, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function TestPage() {
  const params = useParams();
  const uniqueId = params.uniqueId as string;

  const [test, setTest] = useState<Test | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [step, setStep] = useState<'info' | 'questions' | 'submitted'>('info');
  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [timerExpired, setTimerExpired] = useState(false);
  const [trainingPath, setTrainingPath] = useState<TrainingPath | null>(null);
  const [currentSessionType, setCurrentSessionType] = useState<SessionType>('libre');

  useEffect(() => {
    const fetchTest = async () => {
      try {
        const testsQuery = query(
          collection(db, 'tests'),
          where('uniqueLink', '==', uniqueId),
          where('isActive', '==', true)
        );
        const snapshot = await getDocs(testsQuery);

        if (snapshot.empty) {
          setNotFound(true);
        } else {
          const testData = {
            id: snapshot.docs[0].id,
            ...snapshot.docs[0].data(),
          } as Test;
          setTest(testData);
          setAnswers(new Array(testData.questions.length).fill(-1));
        }
      } catch (error) {
        console.error(error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchTest();
  }, [uniqueId]);

  // Timer effect
  useEffect(() => {
    if (step !== 'questions' || timeRemaining === null || timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          setTimerExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [step, timeRemaining]);

  // Auto-submit when timer expires
  useEffect(() => {
    if (timerExpired && !submitting && step === 'questions') {
      toast.error('Temps écoulé ! Le test va être soumis automatiquement.');
      submitTestAuto();
    }
  }, [timerExpired]);

  const submitTestAuto = async () => {
    if (!test || submitting) return;
    setSubmitting(true);
    try {
      let score = 0;
      test.questions.forEach((q, index) => {
        if (answers[index] === q.correctAnswer) {
          score++;
        }
      });

      const submissionRef2 = await addDoc(collection(db, 'submissions'), {
        testId: test.id,
        testTitle: test.title,
        organizationId: test.organizationId,
        candidateName,
        candidateEmail,
        answers,
        score,
        totalQuestions: test.questions.length,
        completedAt: Timestamp.now(),
        sessionType: currentSessionType,
        trainingPathId: trainingPath?.id || null,
      });

      // Mettre à jour le parcours si existant
      if (trainingPath) {
        const updatedSessions = trainingPath.sessions.map((session) => {
          const baseSession: Record<string, unknown> = {
            type: session.type,
            scheduledDate: session.scheduledDate instanceof Date ? Timestamp.fromDate(session.scheduledDate) : session.scheduledDate,
            status: session.status,
          };
          if (session.submissionId) baseSession.submissionId = session.submissionId;
          if (session.completedAt) baseSession.completedAt = session.completedAt instanceof Date ? Timestamp.fromDate(session.completedAt) : session.completedAt;

          if (session.type === currentSessionType && session.status === 'pending') {
            return {
              ...baseSession,
              status: 'completed',
              submissionId: submissionRef2.id,
              completedAt: Timestamp.now(),
            };
          }
          return baseSession;
        });

        const allCompleted = updatedSessions.every((s) => s.status === 'completed');

        await updateDoc(doc(db, 'trainingPaths', trainingPath.id), {
          sessions: updatedSessions,
          status: allCompleted ? 'completed' : 'active',
        });
      }

      await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testId: test.id,
          testTitle: test.title,
          candidateName,
          candidateEmail,
          score,
          totalQuestions: test.questions.length,
          createdBy: test.createdBy,
        }),
      });

      setStep('submitted');
    } catch (error) {
      console.error(error);
      toast.error('Erreur lors de la soumission');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const checkTrainingPath = async () => {
    if (!test) return;
    try {
      const pathsQuery = query(
        collection(db, 'trainingPaths'),
        where('testId', '==', test.id),
        where('candidateEmail', '==', candidateEmail.toLowerCase()),
        where('status', '==', 'active')
      );
      const snapshot = await getDocs(pathsQuery);

      if (!snapshot.empty) {
        const pathData = {
          id: snapshot.docs[0].id,
          ...snapshot.docs[0].data(),
          createdAt: snapshot.docs[0].data().createdAt?.toDate(),
          sessions: snapshot.docs[0].data().sessions.map((s: { scheduledDate: { toDate: () => Date }; completedAt?: { toDate: () => Date } }) => ({
            ...s,
            scheduledDate: s.scheduledDate?.toDate(),
            completedAt: s.completedAt?.toDate(),
          })),
        } as TrainingPath;

        setTrainingPath(pathData);

        // Trouver la prochaine session à compléter
        const pendingSession = pathData.sessions.find((s) => s.status === 'pending');
        if (pendingSession) {
          setCurrentSessionType(pendingSession.type);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la vérification du parcours:', error);
    }
  };

  const startTest = async () => {
    if (!candidateName || !candidateEmail) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }
    if (!candidateEmail.includes('@')) {
      toast.error('Veuillez entrer un email valide');
      return;
    }
    if (test?.timeLimit) {
      setTimeRemaining(test.timeLimit * 60);
    }

    // Vérifier si un parcours existe pour ce candidat et ce test
    await checkTrainingPath();
    setStep('questions');
  };

  const selectAnswer = (answerIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answerIndex;
    setAnswers(newAnswers);
  };

  const submitTest = async () => {
    if (!test) return;

    const unanswered = answers.filter((a) => a === -1).length;
    if (unanswered > 0) {
      toast.error(`${unanswered} question(s) sans réponse`);
      return;
    }

    setSubmitting(true);
    try {
      let score = 0;
      test.questions.forEach((q, index) => {
        if (answers[index] === q.correctAnswer) {
          score++;
        }
      });

      const submissionRef = await addDoc(collection(db, 'submissions'), {
        testId: test.id,
        testTitle: test.title,
        organizationId: test.organizationId,
        candidateName,
        candidateEmail,
        answers,
        score,
        totalQuestions: test.questions.length,
        completedAt: Timestamp.now(),
        sessionType: currentSessionType,
        trainingPathId: trainingPath?.id || null,
      });

      // Mettre à jour le parcours si existant
      if (trainingPath) {
        const updatedSessions = trainingPath.sessions.map((session) => {
          const baseSession: Record<string, unknown> = {
            type: session.type,
            scheduledDate: session.scheduledDate instanceof Date ? Timestamp.fromDate(session.scheduledDate) : session.scheduledDate,
            status: session.status,
          };
          if (session.submissionId) baseSession.submissionId = session.submissionId;
          if (session.completedAt) baseSession.completedAt = session.completedAt instanceof Date ? Timestamp.fromDate(session.completedAt) : session.completedAt;

          if (session.type === currentSessionType && session.status === 'pending') {
            return {
              ...baseSession,
              status: 'completed',
              submissionId: submissionRef.id,
              completedAt: Timestamp.now(),
            };
          }
          return baseSession;
        });

        const allCompleted = updatedSessions.every((s) => s.status === 'completed');

        await updateDoc(doc(db, 'trainingPaths', trainingPath.id), {
          sessions: updatedSessions,
          status: allCompleted ? 'completed' : 'active',
        });
      }

      await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testId: test.id,
          testTitle: test.title,
          candidateName,
          candidateEmail,
          score,
          totalQuestions: test.questions.length,
          createdBy: test.createdBy,
        }),
      });

      setStep('submitted');
    } catch (error) {
      console.error(error);
      toast.error('Erreur lors de la soumission');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (notFound || !test) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <CardTitle>Test introuvable</CardTitle>
            <CardDescription>
              Ce test n'existe pas ou n'est plus disponible.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (step === 'submitted') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <div className="mx-auto mb-4">
              <CheckCircle className="h-16 w-16 text-green-600" />
            </div>
            <CardTitle>Test soumis avec succès !</CardTitle>
            <CardDescription>
              Merci {candidateName} pour votre participation. Vos réponses ont été enregistrées.
              Vous recevrez bientôt un email avec plus d'informations.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (step === 'info') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="max-w-lg w-full">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <ClipboardCheck className="h-8 w-8 text-indigo-600" />
              <span className="text-xl font-bold">ChartMe <span className="text-sm font-normal text-gray-500">by imi</span></span>
            </div>
            <CardTitle>{test.title}</CardTitle>
            {test.description && (
              <CardDescription>{test.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-center gap-4 text-sm text-gray-600 flex-wrap">
              <Badge variant="secondary">{test.questions.length} questions</Badge>
              <Badge variant={
                test.difficulty === 'facile' ? 'secondary' :
                test.difficulty === 'moyen' ? 'default' : 'destructive'
              }>
                {test.difficulty}
              </Badge>
              {test.timeLimit && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {test.timeLimit} min
                </Badge>
              )}
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Votre nom *</Label>
                <Input
                  id="name"
                  placeholder="Jean Dupont"
                  value={candidateName}
                  onChange={(e) => setCandidateName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Votre email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="jean.dupont@example.com"
                  value={candidateEmail}
                  onChange={(e) => setCandidateEmail(e.target.value)}
                />
              </div>
            </div>

            <Button onClick={startTest} className="w-full">
              Commencer le test
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const question = test.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / test.questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto">
        {timeRemaining !== null && (
          <div className={`mb-4 p-3 rounded-lg flex items-center justify-center gap-2 ${
            timeRemaining <= 60 ? 'bg-red-100 text-red-800' : 
            timeRemaining <= 300 ? 'bg-orange-100 text-orange-800' : 
            'bg-blue-100 text-blue-800'
          }`}>
            {timeRemaining <= 60 && <AlertTriangle className="h-5 w-5" />}
            <Clock className="h-5 w-5" />
            <span className="font-bold text-lg">{formatTime(timeRemaining)}</span>
            {timeRemaining <= 60 && <span className="text-sm">Dépêchez-vous !</span>}
          </div>
        )}

        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">
              Question {currentQuestion + 1} sur {test.questions.length}
            </span>
            <span className="text-sm font-medium text-indigo-600">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{question.question}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {question.options.map((option, index) => (
              <button
                key={index}
                onClick={() => selectAnswer(index)}
                className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                  answers[currentQuestion] === index
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <span className="font-medium mr-2">
                  {String.fromCharCode(65 + index)}.
                </span>
                {option}
              </button>
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={() => setCurrentQuestion(currentQuestion - 1)}
            disabled={currentQuestion === 0}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Précédent
          </Button>

          {currentQuestion < test.questions.length - 1 ? (
            <Button
              onClick={() => setCurrentQuestion(currentQuestion + 1)}
              disabled={answers[currentQuestion] === -1}
            >
              Suivant
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={submitTest}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Envoi...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Soumettre
                </>
              )}
            </Button>
          )}
        </div>

        <div className="flex justify-center gap-2 mt-6 flex-wrap">
          {test.questions.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentQuestion(index)}
              className={`w-8 h-8 rounded-full text-sm font-medium transition-all ${
                index === currentQuestion
                  ? 'bg-indigo-600 text-white'
                  : answers[index] !== -1
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
