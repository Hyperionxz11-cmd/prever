import Link from 'next/link';

export default function Privacidade() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '60px 20px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <Link href="/" style={{ color: 'var(--emerald)', textDecoration: 'none', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 40 }}>
          ← Voltar
        </Link>
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>Política de Privacidade</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: 40, fontSize: 14 }}>Última atualização: março de 2025</p>

        {[
          {
            title: '1. Quem somos',
            text: 'O Prever é uma ferramenta educativa de simulação financeira. Não somos uma instituição financeira nem prestamos consultoria financeira regulamentada.'
          },
          {
            title: '2. Dados que coletamos',
            text: 'Coletamos apenas: (a) seu endereço de email para criar e acessar sua conta; (b) dados de uso anônimos para melhorar o produto. Não coletamos dados financeiros reais — as simulações ficam no seu dispositivo.'
          },
          {
            title: '3. Como usamos seus dados',
            text: 'Seu email é usado exclusivamente para: (a) autenticação na plataforma; (b) envio de emails transacionais (confirmação de conta, recibo de pagamento). Nunca vendemos ou compartilhamos seus dados com terceiros para fins comerciais.'
          },
          {
            title: '4. Transferência internacional de dados',
            text: 'Utilizamos serviços de terceiros para operar a plataforma: Supabase (banco de dados, USA/Europa), Stripe (pagamentos, USA), Vercel (hospedagem, USA). Estes serviços são adequados aos padrões LGPD e GDPR.'
          },
          {
            title: '5. Seus direitos (LGPD)',
            text: 'Conforme a Lei 13.709/2018 (LGPD), você tem direito a: acessar seus dados, corrigir dados incorretos, solicitar exclusão da conta, revogar consentimento a qualquer momento. Para exercer estes direitos, entre em contato: privacidade@prever.app'
          },
          {
            title: '6. Segurança',
            text: 'Utilizamos criptografia HTTPS em todas as comunicações, autenticação segura via Supabase Auth, e não armazenamos senhas em texto claro.'
          },
          {
            title: '7. Contato',
            text: 'Para questões de privacidade: privacidade@prever.app'
          },
        ].map(({ title, text }) => (
          <div key={title} style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10, color: 'var(--text)' }}>{title}</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: 15 }}>{text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
