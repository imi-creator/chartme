import { NextRequest, NextResponse } from 'next/server';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function POST(request: NextRequest) {
  try {
    const { testId, testTitle, candidateName, candidateEmail, score, totalQuestions, createdBy } = await request.json();

    const percentage = Math.round((score / totalQuestions) * 100);

    let adminEmail = '';
    if (createdBy) {
      const adminDoc = await getDoc(doc(db, 'admins', createdBy));
      if (adminDoc.exists()) {
        adminEmail = adminDoc.data().email;
      }
    }

    const RESEND_API_KEY = process.env.RESEND_API_KEY;

    if (!RESEND_API_KEY) {
      console.log('Email notification (Resend not configured):');
      console.log(`- Admin email: ${adminEmail}`);
      console.log(`- Candidate: ${candidateName} (${candidateEmail})`);
      console.log(`- Test: ${testTitle}`);
      console.log(`- Score: ${score}/${totalQuestions} (${percentage}%)`);
      
      return NextResponse.json({ 
        success: true, 
        message: 'Email logging only (Resend not configured)' 
      });
    }

    if (adminEmail) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'ChartMe by imi <onboarding@resend.dev>',
          to: adminEmail,
          subject: `[ChartMe] Nouvelle soumission - ${testTitle}`,
          html: `
            <h2>Nouvelle soumission de test</h2>
            <p><strong>Candidat:</strong> ${candidateName}</p>
            <p><strong>Email:</strong> ${candidateEmail}</p>
            <p><strong>Test:</strong> ${testTitle}</p>
            <p><strong>Score:</strong> ${score}/${totalQuestions} (${percentage}%)</p>
            <p>Consultez votre dashboard pour plus de détails.</p>
          `,
        }),
      });
    }

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'ChartMe by imi <onboarding@resend.dev>',
        to: candidateEmail,
        subject: `[ChartMe] Confirmation de votre participation - ${testTitle}`,
        html: `
          <h2>Merci pour votre participation !</h2>
          <p>Bonjour ${candidateName},</p>
          <p>Votre test "<strong>${testTitle}</strong>" a bien été soumis.</p>
          <p>L'administrateur du test analysera vos résultats et vous contactera si nécessaire.</p>
          <p>Cordialement,<br>L'équipe ChartMe by imi</p>
        `,
      }),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Email error:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
