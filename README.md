# ChartMe by imi - Plateforme de Tests de Positionnement

Plateforme SaaS multi-tenant permettant aux organisations de créer des tests de positionnement QCM générés par IA et de suivre les résultats des candidats.

## Fonctionnalités

- 🏢 **Multi-tenant** : Chaque organisation a ses propres données isolées
- 👥 **Gestion d'équipe** : Invitez des membres par email
- 🔐 **Authentification** avec Firebase Auth
- 🤖 **Génération de questions QCM par IA** via OpenRouter (Claude 3.5 Sonnet)
- 🔗 **Liens uniques** pour chaque test
- 📊 **Dashboard analytics** avec graphiques
- ⏱️ **Timer** pour les tests chronométrés
- 📧 **Notifications email** (admin + candidat)
- 💰 **Plans tarifaires** : Gratuit (3 tests) / Pro (illimité)

## Stack technique

- **Next.js 14** (App Router)
- **Firebase** (Auth + Firestore)
- **OpenRouter API** (IA)
- **TailwindCSS + shadcn/ui**
- **Resend** (emails)

## Installation

1. Cloner le repo et installer les dépendances :
```bash
npm install
```

2. Configurer les variables d'environnement dans `.env.local` :
```env
OPENROUTER_API_KEY=votre_cle_openrouter

# Firebase Client
NEXT_PUBLIC_FIREBASE_API_KEY=votre_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=votre_projet.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=votre_projet
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=votre_projet.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123

# Firebase Admin (pour webhooks Stripe)
FIREBASE_ADMIN_PROJECT_ID=votre_projet
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk@votre_projet.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRICE_ID=price_xxx

RESEND_API_KEY=re_xxxxx (optionnel)

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

3. Configurer les règles Firestore (voir section ci-dessous)

4. Lancer le serveur de développement :
```bash
npm run dev
```

## Règles Firestore

Remplacer les règles Firestore dans la console Firebase par :

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Organisations
    match /organizations/{orgId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
    }
    
    // Utilisateurs
    match /users/{userId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null && request.auth.uid == userId;
    }
    
    // Invitations
    match /invitations/{inviteId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
    }
    
    // Tests - lecture publique pour les tests actifs
    match /tests/{testId} {
      allow read: if resource.data.isActive == true || request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null;
    }
    
    // Submissions - création publique, lecture par membres de l'organisation
    match /submissions/{submissionId} {
      allow create: if true;
      allow read: if request.auth != null;
    }
  }
}
```

## Déploiement sur Vercel

1. Créer un repo GitHub et pousser le code
2. Connecter Vercel à votre repo GitHub
3. Ajouter les variables d'environnement dans Vercel (Settings > Environment Variables)
4. Mettre à jour `NEXT_PUBLIC_APP_URL` avec votre URL Vercel

## Structure du projet

```
src/
├── app/
│   ├── admin/              # Pages admin (protégées)
│   │   ├── dashboard/      # Tableau de bord avec analytics
│   │   ├── organization/   # Gestion de l'organisation
│   │   └── tests/          # Création et résultats des tests
│   ├── auth/               # Authentification
│   │   ├── login/
│   │   ├── register/       # Inscription + création organisation
│   │   └── invite/[token]/ # Inscription via invitation
│   ├── test/[uniqueId]/    # Page publique pour candidats
│   └── api/                # Routes API
│       ├── generate/       # Génération IA
│       ├── email/          # Envoi d'emails
│       ├── invite/         # Invitations par email
│       └── stripe/         # Checkout, webhooks, portail
├── components/ui/          # Composants shadcn/ui
├── context/                # AuthContext (user + organization)
└── lib/                    # Firebase, types, utils
```

## Architecture Multi-tenant

| Collection | Description |
|------------|-------------|
| `organizations` | Entreprises (nom, plan, testCount) |
| `users` | Utilisateurs liés à une organisation |
| `invitations` | Invitations en attente |
| `tests` | Tests liés à une organisation |
| `submissions` | Soumissions liées à une organisation |
