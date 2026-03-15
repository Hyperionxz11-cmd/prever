import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { plan, userId } = await request.json();
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://prever.vercel.app').trim();

  const priceId = process.env.STRIPE_PRICE_ID_PREMIUM;

  const params = new URLSearchParams();
  params.append('mode', 'subscription');
  params.append('payment_method_types[]', 'card');
  params.append('line_items[0][price]', priceId!);
  params.append('line_items[0][quantity]', '1');
  params.append('success_url', `${appUrl}/success?session_id={CHECKOUT_SESSION_ID}`);
  params.append('cancel_url', `${appUrl}/pricing`);
  params.append('client_reference_id', userId);
  params.append('locale', 'pt-BR');
  params.append('allow_promotion_codes', 'true');

  const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY?.trim()}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  const session = await res.json();
  return NextResponse.json({ url: session.url });
}
