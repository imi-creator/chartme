export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
}

export interface Test {
  id: string;
  title: string;
  description: string;
  topic: string;
  difficulty: 'facile' | 'moyen' | 'difficile';
  category?: string;
  questions: Question[];
  uniqueLink: string;
  createdBy: string;
  createdAt: Date;
  isActive: boolean;
  timeLimit?: number; // Temps limite en minutes (optionnel)
}

export const TEST_CATEGORIES = [
  { value: 'developpement', label: 'Développement' },
  { value: 'design', label: 'Design' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'management', label: 'Management' },
  { value: 'langues', label: 'Langues' },
  { value: 'comptabilite', label: 'Comptabilité' },
  { value: 'ressources-humaines', label: 'Ressources Humaines' },
  { value: 'vente', label: 'Vente' },
  { value: 'autre', label: 'Autre' },
] as const;

export interface Submission {
  id: string;
  testId: string;
  testTitle: string;
  candidateName: string;
  candidateEmail: string;
  answers: number[];
  score: number;
  totalQuestions: number;
  completedAt: Date;
}

export interface Admin {
  uid: string;
  email: string;
  displayName: string;
  createdAt: Date;
}
