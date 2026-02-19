import { NextRequest, NextResponse } from 'next/server';
import { getStripe, STRIPE_PRICE_ID } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const { organizationId, userEmail } = await request.json();

    if (!organizationId || !userEmail) {
      return NextResponse.json(
        { error: 'Organization ID and email are required' },
        { status: 400 }
      );
    }

    const session = await getStripe().checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/admin/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/admin/billing/cancel`,
      customer_email: userEmail,
      metadata: {
        organizationId,
      },
      subscription_data: {
        metadata: {
          organizationId,
        },
      },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
