import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  const body = await request.text();
  let event: { type: string; data: { object: Record<string, string> } };

  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.client_reference_id;
    const customerId = session.customer;
    const subscriptionId = session.subscription;

    if (userId) {
      await supabase.from('profiles').update({
        plan: 'premium',
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        updated_at: new Date().toISOString(),
      }).eq('id', userId);
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object;
    await supabase.from('profiles')
      .update({ plan: 'free', stripe_subscription_id: null, updated_at: new Date().toISOString() })
      .eq('stripe_customer_id', sub.customer);
  }

  if (event.type === 'customer.subscription.updated') {
    const sub = event.data.object;
    const active = sub.status === 'active';
    await supabase.from('profiles')
      .update({ plan: active ? 'premium' : 'free', updated_at: new Date().toISOString() })
      .eq('stripe_customer_id', sub.customer);
  }

  return NextResponse.json({ received: true });
}
