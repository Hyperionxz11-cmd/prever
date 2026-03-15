'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '../lib/supabase';

function CadastroForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get('plan');
  const supabase = createClient();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) { setError('A senha deve ter pelo menos 6 caracteres.'); return; }
    setLoading(true); setError('');

    const { error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` }
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      if (plan === 'premium') {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const res = await fetch('/api/stripe/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ plan: 'premium', userId: user.id }),
          });
          const { url } = await res.json();
          if (url) { window.location.href = url; return; }
        }
      }
      setDone(true);
    }
  }

  if (done) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', background: 'var(--bg)' }}>
      <div style={{ maxWidth: 440, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 20 }}>📬</div>
        <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 12 }}>Confirme seu email</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 16, lineHeight: 1.6, marginBottom: 28 }}>
          Enviamos um link de confirmação para <strong style={{ color: 'var(--text)' }}>{email}</strong>. Clique no link para ativar sua conta.
        </p>
        <Link href="/dashboard" style={{ color: 'var(--emerald)', textDecoration: 'none', fontSize: 15 }}>
          Já confirmei → ir para o dashboard
        </Link>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', background: 'var(--bg)' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginBottom: 40, textDecoration: 'none' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, var(--emerald), var(--emerald-dark))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 16, color: '#020A06' }}>P</div>
          <span style={{ fontWeight: 700, fontSize: 22, letterSpacing: '-0.5px', color: 'var(--text)' }}>prever</span>
        </Link>

        {plan === 'premium' && (
          <div style={{ marginBottom: 20, padding: '14px 18px', background: 'rgba(0,212,161,0.08)', border: '1px solid rgba(0,212,161,0.25)', borderRadius: 12, fontSize: 14, color: 'var(--emerald)', textAlign: 'center', fontWeight: 600 }}>
            ✨ Criando conta Premium — R$29/mês
          </div>
        )}

        <div className="glass" style={{ borderRadius: 20, padding: '36px 32px' }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6, letterSpacing: '-0.5px' }}>Criar conta grátis</h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: 28, fontSize: 14 }}>
            Já tem conta? <Link href="/login" style={{ color: 'var(--emerald)', textDecoration: 'none', fontWeight: 600 }}>Entrar →</Link>
          </p>

          <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Email</label>
              <input type="email" required autoComplete="email" className="input-styled" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Senha</label>
              <input type="password" required autoComplete="new-password" className="input-styled" placeholder="mínimo 6 caracteres" value={password} onChange={e => setPassword(e.target.value)} />
            </div>

            {error && (
              <div style={{ padding: '12px 16px', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 10, fontSize: 14, color: '#F87171' }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-emerald"
              style={{ padding: '15px', fontSize: 16, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, marginTop: 4 }}>
              {loading ? 'Criando conta...' : plan === 'premium' ? 'Criar conta e assinar →' : 'Criar conta grátis →'}
            </button>

            <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.5 }}>
              Ao criar sua conta, você concorda com nossos{' '}
              <Link href="/termos" style={{ color: 'var(--emerald)', textDecoration: 'none' }}>Termos de Uso</Link> e{' '}
              <Link href="/privacidade" style={{ color: 'var(--emerald)', textDecoration: 'none' }}>Política de Privacidade</Link>.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function CadastroPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--bg)' }} />}>
      <CadastroForm />
    </Suspense>
  );
}
