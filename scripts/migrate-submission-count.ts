/**
 * Script de migration pour initialiser submissionCount sur les tests existants.
 * 
 * Usage:
 * npx ts-node scripts/migrate-submission-count.ts
 * 
 * Ce script:
 * - Récupère tous les tests sans submissionCount
 * - Compte les submissions pour chaque test
 * - Met à jour le champ submissionCount
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialiser Firebase Admin avec les variables d'environnement existantes
if (getApps().length === 0) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = getFirestore();

async function migrateSubmissionCount() {
  console.log('🚀 Début de la migration submissionCount...\n');

  // Récupérer tous les tests
  const testsSnapshot = await db.collection('tests').get();
  console.log(`📋 ${testsSnapshot.size} tests trouvés\n`);

  let updated = 0;
  let skipped = 0;

  for (const testDoc of testsSnapshot.docs) {
    const testData = testDoc.data();
    
    // Si submissionCount existe déjà, passer
    if (typeof testData.submissionCount === 'number') {
      console.log(`⏭️  ${testData.title} - déjà migré (${testData.submissionCount} submissions)`);
      skipped++;
      continue;
    }

    // Compter les submissions pour ce test
    const submissionsSnapshot = await db
      .collection('submissions')
      .where('testId', '==', testDoc.id)
      .get();

    const submissionCount = submissionsSnapshot.size;

    // Mettre à jour le test
    await db.collection('tests').doc(testDoc.id).update({
      submissionCount,
    });

    console.log(`✅ ${testData.title} - submissionCount: ${submissionCount}`);
    updated++;
  }

  console.log('\n========================================');
  console.log(`✅ Migration terminée !`);
  console.log(`   - Tests mis à jour: ${updated}`);
  console.log(`   - Tests déjà migrés: ${skipped}`);
  console.log('========================================\n');
}

migrateSubmissionCount()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Erreur lors de la migration:', error);
    process.exit(1);
  });
