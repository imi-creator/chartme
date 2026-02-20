// Organisation
export interface Organization {
  id: string;
  name: string;
  plan: 'free' | 'pro';
  testCount: number;
  createdBy: string;
  createdAt: Date;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}

// Utilisateur
export interface User {
  uid: string;
  email: string;
  displayName: string;
  organizationId: string;
  createdAt: Date;
}

// Invitation
export interface Invitation {
  id: string;
  email: string;
  organizationId: string;
  organizationName: string;
  invitedBy: string;
  token: string;
  status: 'pending' | 'accepted';
  createdAt: Date;
}

export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
}

export interface Test {
  id: string;
  testId?: string;
  organizationId: string;
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
  timeLimit?: number;
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
  organizationId: string;
  testId: string;
  testTitle: string;
  candidateName: string;
  candidateEmail: string;
  answers: number[];
  score: number;
  totalQuestions: number;
  completedAt: Date;
  sessionType?: 'positionnement' | 'evaluation' | 'libre';
  trainingPathId?: string;
}

// Types de session
export const SESSION_TYPES = [
  { value: 'positionnement', label: 'Positionnement initial' },
  { value: 'evaluation', label: 'Évaluation finale' },
  { value: 'libre', label: 'Passage libre' },
] as const;

export type SessionType = 'positionnement' | 'evaluation' | 'libre';

// Session planifiée dans un parcours
export interface PlannedSession {
  type: SessionType;
  scheduledDate: Date;
  status: 'pending' | 'completed';
  submissionId?: string;
  completedAt?: Date;
}

// Parcours de formation
export interface TrainingPath {
  id: string;
  organizationId: string;
  testId: string;
  testTitle: string;
  candidateName: string;
  candidateEmail: string;
  sessions: PlannedSession[];
  createdBy: string;
  createdAt: Date;
  status: 'active' | 'completed' | 'cancelled';
  shareToken?: string; // Token unique pour partage public du rapport
}

// Plans disponibles
export const PLANS = {
  free: {
    name: 'Gratuit',
    maxTests: 3,
    price: 0,
  },
  pro: {
    name: 'Pro',
    maxTests: Infinity,
    price: 4.8,
  },
} as const;
