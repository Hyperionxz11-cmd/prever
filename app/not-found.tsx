import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: '20px', textAlign: 'center' }}>
      <div>
        <div style={{ fontSize: 64, marginBottom: 20 }}>🔍</div>
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 12 }}>Página não encontrada</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: 28, fontSize: 16 }}>Esta página não existe ou foi movida.</p>
        <Link href="/" style={{ color: 'var(--emerald)', textDecoration: 'none', fontWeight: 600, fontSize: 15 }}>
          ← Voltar para o início
        </Link>
      </div>
    </div>
  );
}
