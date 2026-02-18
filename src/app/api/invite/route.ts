import { NextResponse } from 'next/server';

const RESEND_API_KEY = process.env.RESEND_API_KEY;

export async function POST(request: Request) {
  try {
    const { email, organizationName, inviteLink } = await request.json();

    if (!RESEND_API_KEY) {
      console.log('Invitation link:', inviteLink);
      return NextResponse.json({ success: true, message: 'Email skipped (no API key)' });
    }

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'ChartMe by imi <onboarding@resend.dev>',
        to: email,
        subject: `[ChartMe] Invitation à rejoindre ${organizationName}`,
        html: `
          <h2>Vous êtes invité à rejoindre ${organizationName}</h2>
          <p>Bonjour,</p>
          <p>Vous avez été invité à rejoindre l'organisation <strong>${organizationName}</strong> sur ChartMe.</p>
          <p>Cliquez sur le lien ci-dessous pour créer votre compte et rejoindre l'équipe :</p>
          <p><a href="${inviteLink}" style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Accepter l'invitation</a></p>
          <p>Ou copiez ce lien dans votre navigateur :</p>
          <p>${inviteLink}</p>
          <br>
          <p>Cordialement,<br>L'équipe ChartMe by imi</p>
        `,
      }),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Invite email error:', error);
    return NextResponse.json({ error: 'Failed to send invite email' }, { status: 500 });
  }
}
