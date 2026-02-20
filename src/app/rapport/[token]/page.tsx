'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { TrainingPath, Submission, Test, SESSION_TYPES } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  User,
  Mail,
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle,
  Clock,
  FileText,
  BarChart3,
} from 'lucide-react';

interface QuestionComparison {
  questionIndex: number;
  questionText: string;
  positionnementAnswer: number;
  evaluationAnswer: number;
  correctAnswer: number;
  positionnementCorrect: boolean;
  evaluationCorrect: boolean;
  improvement: 'improved' | 'regressed' | 'same';
}

export default function PublicReportPage() {
  const params = useParams();
  const token = params.token as string;

  const [trainingPath, setTrainingPath] = useState<TrainingPath | null>(null);
  const [submissions, setSubmissions] = useState<{ positionnement?: Submission; evaluation?: Submission }>({});
  const [loading, setLoading] = useState(true);
  const [comparisons, setComparisons] = useState<QuestionComparison[]>([]);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Rechercher le parcours par shareToken
        const pathsQuery = query(
          collection(db, 'trainingPaths'),
          where('shareToken', '==', token)
        );
        const pathsSnapshot = await getDocs(pathsQuery);

        if (pathsSnapshot.empty) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        const pathDoc = pathsSnapshot.docs[0];
        const pathData = {
          id: pathDoc.id,
          ...pathDoc.data(),
          createdAt: pathDoc.data().createdAt?.toDate(),
          sessions: pathDoc.data().sessions.map((s: { scheduledDate: { toDate: () => Date }; completedAt?: { toDate: () => Date } }) => ({
            ...s,
            scheduledDate: s.scheduledDate?.toDate(),
            completedAt: s.completedAt?.toDate(),
          })),
        } as TrainingPath;
        setTrainingPath(pathData);

        // Fetch test pour les questions
        const testDoc = await getDoc(doc(db, 'tests', pathData.testId));

        // Fetch submissions
        const submissionsQuery = query(
          collection(db, 'submissions'),
          where('trainingPathId', '==', pathDoc.id)
        );
        const submissionsSnapshot = await getDocs(submissionsQuery);

        const subs: { positionnement?: Submission; evaluation?: Submission } = {};
        submissionsSnapshot.docs.forEach((doc) => {
          const data = {
            id: doc.id,
            ...doc.data(),
            completedAt: doc.data().completedAt?.toDate(),
          } as Submission;

          if (data.sessionType === 'positionnement') {
            subs.positionnement = data;
          } else if (data.sessionType === 'evaluation') {
            subs.evaluation = data;
          }
        });
        setSubmissions(subs);

        // Generate comparisons
        if (subs.positionnement && subs.evaluation && testDoc.exists()) {
          const testData = testDoc.data();
          const comps: QuestionComparison[] = testData.questions.map((q: { question: string; correctAnswer: number }, idx: number) => {
            const posAnswer = subs.positionnement!.answers[idx];
            const evalAnswer = subs.evaluation!.answers[idx];
            const posCorrect = posAnswer === q.correctAnswer;
            const evalCorrect = evalAnswer === q.correctAnswer;

            let improvement: 'improved' | 'regressed' | 'same' = 'same';
            if (!posCorrect && evalCorrect) improvement = 'improved';
            if (posCorrect && !evalCorrect) improvement = 'regressed';

            return {
              questionIndex: idx,
              questionText: q.question,
              positionnementAnswer: posAnswer,
              evaluationAnswer: evalAnswer,
              correctAnswer: q.correctAnswer,
              positionnementCorrect: posCorrect,
              evaluationCorrect: evalCorrect,
              improvement,
            };
          });
          setComparisons(comps);
        }
      } catch (error) {
        console.error(error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  const getSessionLabel = (type: string) => {
    return SESSION_TYPES.find((s) => s.value === type)?.label || type;
  };

  const calculateProgress = () => {
    if (!submissions.positionnement || !submissions.evaluation) return null;

    const posPercentage = Math.round((submissions.positionnement.score / submissions.positionnement.totalQuestions) * 100);
    const evalPercentage = Math.round((submissions.evaluation.score / submissions.evaluation.totalQuestions) * 100);
    const diff = evalPercentage - posPercentage;

    return { posPercentage, evalPercentage, diff };
  };

  const progress = calculateProgress();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (notFound || !trainingPath) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md">
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Rapport introuvable</p>
            <p className="text-sm text-gray-400 mt-2">
              Ce lien n'est pas valide ou a expiré.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Rapport de progression</h1>
          <p className="text-gray-500 mt-1">{trainingPath.testTitle}</p>
        </div>

        {/* Informations du stagiaire */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Informations du stagiaire</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Nom</p>
                  <p className="font-medium">{trainingPath.candidateName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{trainingPath.candidateEmail}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Test</p>
                  <p className="font-medium">{trainingPath.testTitle}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Créé le</p>
                  <p className="font-medium">
                    {trainingPath.createdAt.toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sessions */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Sessions planifiées</CardTitle>
              <CardDescription>État des différentes sessions du parcours</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {trainingPath.sessions.map((session, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg border-2 ${
                      session.status === 'completed'
                        ? 'border-green-200 bg-green-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {session.status === 'completed' ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <Clock className="h-5 w-5 text-gray-400" />
                        )}
                        <div>
                          <p className="font-medium">{getSessionLabel(session.type)}</p>
                          <p className="text-sm text-gray-500">
                            Prévu le {session.scheduledDate.toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {session.status === 'completed' ? (
                          <div>
                            <Badge className="bg-green-100 text-green-800">Complété</Badge>
                            {session.completedAt && (
                              <p className="text-xs text-gray-500 mt-1">
                                le {session.completedAt.toLocaleDateString('fr-FR')}
                              </p>
                            )}
                          </div>
                        ) : (
                          <Badge variant="outline">En attente</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progression */}
        {progress && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Progression mesurée
              </CardTitle>
              <CardDescription>
                Comparaison entre le positionnement initial et l'évaluation finale
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Positionnement initial</p>
                  <p className="text-4xl font-bold text-blue-600">{progress.posPercentage}%</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {submissions.positionnement?.score}/{submissions.positionnement?.totalQuestions} bonnes réponses
                  </p>
                </div>

                <div className="flex items-center justify-center">
                  <div
                    className={`text-center p-6 rounded-full ${
                      progress.diff > 0
                        ? 'bg-green-100'
                        : progress.diff < 0
                        ? 'bg-red-100'
                        : 'bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1">
                      {progress.diff > 0 ? (
                        <TrendingUp className="h-6 w-6 text-green-600" />
                      ) : progress.diff < 0 ? (
                        <TrendingDown className="h-6 w-6 text-red-600" />
                      ) : (
                        <Minus className="h-6 w-6 text-gray-600" />
                      )}
                      <span
                        className={`text-2xl font-bold ${
                          progress.diff > 0
                            ? 'text-green-600'
                            : progress.diff < 0
                            ? 'text-red-600'
                            : 'text-gray-600'
                        }`}
                      >
                        {progress.diff > 0 ? '+' : ''}
                        {progress.diff}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Évolution</p>
                  </div>
                </div>

                <div className="text-center p-6 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Évaluation finale</p>
                  <p className="text-4xl font-bold text-green-600">{progress.evalPercentage}%</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {submissions.evaluation?.score}/{submissions.evaluation?.totalQuestions} bonnes réponses
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Comparaison détaillée */}
        {comparisons.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Analyse détaillée par question</CardTitle>
              <CardDescription>
                Évolution des réponses entre le positionnement et l'évaluation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {comparisons.map((comp) => (
                  <div
                    key={comp.questionIndex}
                    className={`p-4 rounded-lg border ${
                      comp.improvement === 'improved'
                        ? 'border-green-200 bg-green-50'
                        : comp.improvement === 'regressed'
                        ? 'border-red-200 bg-red-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm text-gray-500">
                          Question {comp.questionIndex + 1}
                        </p>
                        <p className="mt-1">{comp.questionText}</p>
                      </div>
                      <div className="ml-4 flex items-center gap-2">
                        {comp.improvement === 'improved' && (
                          <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            Amélioré
                          </Badge>
                        )}
                        {comp.improvement === 'regressed' && (
                          <Badge className="bg-red-100 text-red-800 flex items-center gap-1">
                            <TrendingDown className="h-3 w-3" />
                            Régression
                          </Badge>
                        )}
                        {comp.improvement === 'same' && (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Minus className="h-3 w-3" />
                            Identique
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-6 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">Positionnement:</span>
                        {comp.positionnementCorrect ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <span className="text-red-600">✗</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">Évaluation:</span>
                        {comp.evaluationCorrect ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <span className="text-red-600">✗</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Résumé */}
              <div className="mt-6 p-4 bg-indigo-50 rounded-lg">
                <h4 className="font-medium text-indigo-900 mb-2">Résumé de la progression</h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-green-600">
                      {comparisons.filter((c) => c.improvement === 'improved').length}
                    </p>
                    <p className="text-sm text-gray-600">Questions améliorées</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-600">
                      {comparisons.filter((c) => c.improvement === 'same').length}
                    </p>
                    <p className="text-sm text-gray-600">Questions identiques</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-red-600">
                      {comparisons.filter((c) => c.improvement === 'regressed').length}
                    </p>
                    <p className="text-sm text-gray-600">Régressions</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Messages d'attente */}
        {!submissions.positionnement && !submissions.evaluation && (
          <Card>
            <CardContent className="py-12 text-center">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">Aucune session complétée</p>
              <p className="text-sm text-gray-400">
                Les résultats apparaîtront une fois les sessions complétées.
              </p>
            </CardContent>
          </Card>
        )}

        {submissions.positionnement && !submissions.evaluation && (
          <Card>
            <CardContent className="py-12 text-center">
              <Clock className="h-12 w-12 text-orange-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">En attente de l'évaluation finale</p>
              <p className="text-sm text-gray-400">
                Positionnement complété ({Math.round((submissions.positionnement.score / submissions.positionnement.totalQuestions) * 100)}%).
                La comparaison sera disponible après l'évaluation.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-gray-400 pt-4">
          Rapport généré par ChartMe
        </div>
      </div>
    </div>
  );
}
