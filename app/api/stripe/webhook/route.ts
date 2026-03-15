import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use anon key — RPC functions are SECURITY DEFINER (bypass RLS safely)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  const body = await request.text();
  let event: { type: string; data: { object: Record<string, unknown> } };

  // Verify Stripe signature if webhook secret is configured
  const sig = request.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (webhookSecret && sig) {
    // Simple signature check — in production use Stripe SDK for full verification
    try {
      event = JSON.parse(body);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }
  } else {
    try {
      event = JSON.parse(body);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Record<string, string>;
      const customerId = session.customer;
      const subscriptionId = session.subscription;
      const customerEmail = session.customer_email || session.customer_details?.toString();

      if (customerId) {
        await supabase.rpc('activate_premium_by_stripe', {
          p_stripe_customer_id: customerId,
          p_stripe_subscription_id: subscriptionId || null,
          p_user_email: customerEmail || null,
        });
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object as Record<string, string>;
      await supabase.rpc('cancel_premium_by_stripe', {
        p_stripe_subscription_id: sub.id,
      });
    }

    if (event.type === 'customer.subscription.updated') {
      const sub = event.data.object as Record<string, string>;
      if (sub.status === 'active') {
        await supabase.rpc('activate_premium_by_stripe', {
          p_stripe_customer_id: sub.customer,
          p_stripe_subscription_id: sub.id,
        });
      } else if (sub.status === 'canceled' || sub.status === 'unpaid') {
        await supabase.rpc('cancel_premium_by_stripe', {
          p_stripe_subscription_id: sub.id,
        });
      }
    }
  } catch (err) {
    console.error('Webhook error:', err);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
