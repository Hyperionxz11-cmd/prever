'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '../lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError('Email ou senha incorretos.');
      setLoading(false);
    } else {
      router.push('/dashboard');
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', background: 'var(--bg)' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginBottom: 40, textDecoration: 'none' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, var(--emerald), var(--emerald-dark))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 16, color: '#020A06' }}>P</div>
          <span style={{ fontWeight: 700, fontSize: 22, letterSpacing: '-0.5px', color: 'var(--text)' }}>prever</span>
        </Link>

        <div className="glass" style={{ borderRadius: 20, padding: '36px 32px' }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6, letterSpacing: '-0.5px' }}>Entrar na conta</h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: 28, fontSize: 14 }}>
            Não tem conta? <Link href="/cadastro" style={{ color: 'var(--emerald)', textDecoration: 'none', fontWeight: 600 }}>Criar grátis →</Link>
          </p>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Email</label>
              <input
                type="email" required autoComplete="email"
                className="input-styled"
                placeholder="seu@email.com"
                value={email} onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Senha</label>
              <input
                type="password" required autoComplete="current-password"
                className="input-styled"
                placeholder="••••••••"
                value={password} onChange={e => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <div style={{ padding: '12px 16px', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 10, fontSize: 14, color: '#F87171' }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-emerald"
              style={{ padding: '15px', fontSize: 16, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, marginTop: 4 }}>
              {loading ? 'Entrando...' : 'Entrar →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
