import Link from 'next/link';

export default function Termos() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '60px 20px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <Link href="/" style={{ color: 'var(--emerald)', textDecoration: 'none', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 40 }}>
          ← Voltar
        </Link>
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>Termos de Uso</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: 40, fontSize: 14 }}>Última atualização: março de 2025</p>

        {[
          {
            title: '1. Natureza do serviço',
            text: 'O Prever é uma ferramenta educativa de simulação financeira. As simulações são baseadas em modelos matemáticos e tabelas públicas (INSS 2025, taxa SELIC histórica). Os resultados têm caráter exclusivamente informativo e não constituem consultoria financeira, de investimentos ou previdenciária regulamentada.'
          },
          {
            title: '2. Limitação de responsabilidade',
            text: 'O Prever não se responsabiliza por decisões financeiras tomadas com base nas simulações. Os valores reais de benefícios INSS podem diferir dos simulados por fatores individuais. Recomendamos consultar um profissional habilitado (planejador financeiro, contador, ou advogado previdenciário) para decisões importantes.'
          },
          {
            title: '3. Conta e acesso',
            text: 'Ao criar uma conta, você concorda em fornecer informações verídicas e manter sua senha segura. O compartilhamento de contas não é permitido. Reservamo-nos o direito de suspender contas que violem estes termos.'
          },
          {
            title: '4. Planos e pagamentos',
            text: 'O plano gratuito oferece acesso básico ao simulador. O plano Premium (R$29/mês) oferece funcionalidades avançadas. As assinaturas são cobradas mensalmente via Stripe e podem ser canceladas a qualquer momento. Não há reembolso proporcional de períodos já cobrados.'
          },
          {
            title: '5. Propriedade intelectual',
            text: 'O código, design e conteúdo do Prever são de propriedade exclusiva. O uso do serviço não transfere nenhum direito de propriedade intelectual ao usuário.'
          },
          {
            title: '6. Modificações',
            text: 'Podemos modificar estes termos a qualquer momento. Notificaremos usuários sobre mudanças relevantes por email. O uso contínuo do serviço após notificação constitui aceitação dos novos termos.'
          },
          {
            title: '7. Lei aplicável',
            text: 'Estes termos são regidos pela legislação brasileira. Eventuais disputas serão resolvidas no foro da comarca de São Paulo, SP.'
          },
          {
            title: '8. Contato',
            text: 'Para questões sobre os termos: suporte@prever.app'
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
