'use client';

import { useEffect, useState, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Test, Submission } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle, XCircle, User, Mail, Calendar, Loader2, Download } from 'lucide-react';
import { toast } from 'sonner';

export default function SubmissionDetailPage() {
  const params = useParams();
  const testId = params.id as string;
  const submissionId = params.submissionId as string;

  const [test, setTest] = useState<Test | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [testDoc, submissionDoc] = await Promise.all([
          getDoc(doc(db, 'tests', testId)),
          getDoc(doc(db, 'submissions', submissionId)),
        ]);

        if (testDoc.exists()) {
          setTest({
            id: testDoc.id,
            ...testDoc.data(),
            createdAt: testDoc.data().createdAt?.toDate(),
          } as Test);
        }

        if (submissionDoc.exists()) {
          setSubmission({
            id: submissionDoc.id,
            ...submissionDoc.data(),
            completedAt: submissionDoc.data().completedAt?.toDate(),
          } as Submission);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [testId, submissionId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!test || !submission) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Données introuvables</p>
        <Link href="/admin/dashboard">
          <Button variant="link">Retour au dashboard</Button>
        </Link>
      </div>
    );
  }

  const percentage = Math.round((submission.score / submission.totalQuestions) * 100);

  const exportToPDF = async () => {
    if (!contentRef.current || !test || !submission) return;
    
    setExporting(true);
    try {
      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 10;
      
      const scaledHeight = imgHeight * ratio;
      const pageHeight = pdfHeight - 20;
      let heightLeft = scaledHeight;
      let position = imgY;
      
      pdf.addImage(imgData, 'PNG', imgX, position, imgWidth * ratio, scaledHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft > 0) {
        position = heightLeft - scaledHeight + imgY;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', imgX, position, imgWidth * ratio, scaledHeight);
        heightLeft -= pageHeight;
      }
      
      const fileName = `resultat_${submission.candidateName.replace(/\s+/g, '_')}_${test.title.replace(/\s+/g, '_')}.pdf`;
      pdf.save(fileName);
      toast.success('PDF exporté avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error);
      toast.error('Erreur lors de l\'export PDF');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <Link href={`/admin/tests/${testId}/results`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux résultats
          </Button>
        </Link>
        <Button onClick={exportToPDF} disabled={exporting}>
          {exporting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Exporter en PDF
        </Button>
      </div>

      <div ref={contentRef} className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-white p-4 rounded-lg">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Informations du candidat</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Nom</p>
                <p className="font-medium">{submission.candidateName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{submission.candidateEmail}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Date de soumission</p>
                <p className="font-medium">
                  {submission.completedAt.toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
            <div className="pt-4 border-t">
              <p className="text-sm text-gray-500 mb-2">Score final</p>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold">{submission.score}/{submission.totalQuestions}</span>
                <Badge 
                  variant={percentage >= 80 ? 'default' : percentage >= 50 ? 'secondary' : 'destructive'}
                  className="text-lg px-3 py-1"
                >
                  {percentage}%
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Détail des réponses - {test.title}</CardTitle>
            <CardDescription>
              {submission.score} bonnes réponses sur {submission.totalQuestions} questions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {test.questions.map((question, index) => {
              const userAnswer = submission.answers[index];
              const isCorrect = userAnswer === question.correctAnswer;

              return (
                <div 
                  key={question.id} 
                  className={`p-4 rounded-lg border-2 ${
                    isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <p className="font-medium flex-1">
                      <span className="text-gray-500 mr-2">Q{index + 1}.</span>
                      {question.question}
                    </p>
                    {isCorrect ? (
                      <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-6 w-6 text-red-600 flex-shrink-0" />
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {question.options.map((option, optIndex) => {
                      const isUserAnswer = optIndex === userAnswer;
                      const isCorrectAnswer = optIndex === question.correctAnswer;

                      let bgColor = 'bg-white';
                      let borderColor = 'border-gray-200';
                      let textColor = 'text-gray-700';

                      if (isCorrectAnswer) {
                        bgColor = 'bg-green-100';
                        borderColor = 'border-green-400';
                        textColor = 'text-green-800';
                      } else if (isUserAnswer && !isCorrect) {
                        bgColor = 'bg-red-100';
                        borderColor = 'border-red-400';
                        textColor = 'text-red-800';
                      }

                      return (
                        <div
                          key={optIndex}
                          className={`p-2 rounded border ${bgColor} ${borderColor} ${textColor} flex items-center gap-2`}
                        >
                          <span className="font-medium">{String.fromCharCode(65 + optIndex)}.</span>
                          <span className="flex-1">{option}</span>
                          {isCorrectAnswer && (
                            <Badge variant="default" className="bg-green-600">Correct</Badge>
                          )}
                          {isUserAnswer && !isCorrectAnswer && (
                            <Badge variant="destructive">Réponse choisie</Badge>
                          )}
                          {isUserAnswer && isCorrectAnswer && (
                            <Badge variant="default" className="bg-green-600">✓ Choisi</Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
