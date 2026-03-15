'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import DraggableRange from './components/DraggableRange';

// ─── Formatters ────────────────────────────────────────────────
function fmtBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
}

function fmtNum(v: number) {
  return v.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
}

// ─── INSS 2025 tables ──────────────────────────────────────────
const INSS_FAIXAS = [
  { ate: 1518.00, aliquota: 0.075 },
  { ate: 2793.88, aliquota: 0.09 },
  { ate: 4190.83, aliquota: 0.12 },
  { ate: 8157.41, aliquota: 0.14 },
];
const INSS_TETO = 8157.41;
const INSS_BENEFICIO_TETO = 7786.02;
const INSS_BENEFICIO_MIN = 1412.00;

function calcINSSContribuicao(salario: number) {
  let contrib = 0;
  let base = 0;
  for (const faixa of INSS_FAIXAS) {
    const topo = Math.min(salario, faixa.ate);
    if (topo > base) {
      contrib += (topo - base) * faixa.aliquota;
      base = topo;
    }
    if (salario <= faixa.ate) break;
  }
  return Math.min(contrib, INSS_TETO * 0.14);
}

function calcBeneficioINSS(salario: number, anosContrib: number): number {
  // Regra pós-reforma: média dos 100% salários de contribuição
  // Fator de redução se não atingir 35/30 anos
  const baseCalculo = Math.min(salario, INSS_TETO);
  const coeficiente = Math.min(anosContrib / 35, 1); // simplificado
  const beneficio = baseCalculo * (0.60 + coeficiente * 0.40);
  return Math.max(INSS_BENEFICIO_MIN, Math.min(beneficio, INSS_BENEFICIO_TETO));
}

// ─── Investment simulation ────────────────────────────────────
function calcPatrimonio(
  aporteMensal: number,
  anos: number,
  taxaAnual: number,
  patrimonioAtual: number = 0
) {
  const taxaMensal = Math.pow(1 + taxaAnual, 1 / 12) - 1;
  const meses = anos * 12;
  const futuro =
    patrimonioAtual * Math.pow(1 + taxaMensal, meses) +
    aporteMensal * ((Math.pow(1 + taxaMensal, meses) - 1) / taxaMensal);
  return futuro;
}

function calcRendaMensal(patrimonio: number, taxaAnual: number, anosRetiro: number) {
  if (anosRetiro <= 0) return patrimonio * (taxaAnual / 12);
  const taxaMensal = Math.pow(1 + taxaAnual, 1 / 12) - 1;
  const meses = anosRetiro * 12;
  return (patrimonio * taxaMensal) / (1 - Math.pow(1 + taxaMensal, -meses));
}

// ─── Animated number ──────────────────────────────────────────
function AnimatedNumber({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) {
  const [displayed, setDisplayed] = useState(value);
  const prevRef = useRef(value);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const from = prevRef.current;
    const to = value;
    if (from === to) return;
    const duration = 500;
    const start = performance.now();

    function tick(now: number) {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setDisplayed(Math.round(from + (to - from) * ease));
      if (t < 1) frameRef.current = requestAnimationFrame(tick);
      else prevRef.current = to;
    }

    frameRef.current = requestAnimationFrame(tick);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [value]);

  return (
    <span>
      {prefix}{fmtNum(displayed)}{suffix}
    </span>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────
export default function LandingPage() {
  // Hero simulator state
  const [idade, setIdade] = useState(32);
  const [idadeAposentadoria, setIdadeAposentadoria] = useState(65);
  const [salario, setSalario] = useState(5000);
  const [rendaDesejada, setRendaDesejada] = useState(8000);
  const [aporte, setAporte] = useState(800);
  const [patrimonioAtual, setPatrimonioAtual] = useState(20000);
  const [menuOpen, setMenuOpen] = useState(false);

  const anos = idadeAposentadoria - idade;
  const anosContrib = Math.max(anos, 5);
  const TAXA_INVESTIMENTO = 0.10; // 10% a.a. real
  const TAXA_RETIRO = 0.06; // 6% a.a. em retiro

  const beneficioINSS = calcBeneficioINSS(salario, anosContrib);
  const patrimonio = calcPatrimonio(aporte, Math.max(anos, 1), TAXA_INVESTIMENTO, patrimonioAtual);
  const rendaInvestimentos = calcRendaMensal(patrimonio, TAXA_RETIRO, 25);
  const rendaTotal = beneficioINSS + rendaInvestimentos;
  const gap = rendaDesejada - rendaTotal;
  const aporteNecessario = gap > 0
    ? aporte + (gap / (rendaTotal > 0 ? rendaTotal / aporte : 1)) * 0.8
    : 0;
  const deficit = gap > 0;
  const percentCobertura = Math.min((rendaTotal / rendaDesejada) * 100, 100);

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>

      {/* ── NAV ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(8,12,20,0.92)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'linear-gradient(135deg, var(--emerald), var(--emerald-dark))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 900, fontSize: 14, color: '#020A06'
            }}>P</div>
            <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: '-0.5px', color: 'var(--text)' }}>prever</span>
          </div>

          {/* Desktop nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }} className="hidden-mobile">
            <a href="#como-funciona" style={{ color: 'var(--text-secondary)', fontSize: 14, textDecoration: 'none' }}>Como funciona</a>
            <a href="#planos" style={{ color: 'var(--text-secondary)', fontSize: 14, textDecoration: 'none' }}>Planos</a>
            <Link href="/login" style={{ color: 'var(--text-secondary)', fontSize: 14, textDecoration: 'none' }}>Entrar</Link>
            <Link href="/cadastro" className="btn-emerald" style={{ padding: '8px 20px', fontSize: 14, borderRadius: 8, textDecoration: 'none', display: 'inline-block' }}>
              Começar grátis
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', padding: 8 }}
            className="show-mobile"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {menuOpen
                ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
                : <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>
              }
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div style={{
            padding: '16px 20px 20px',
            borderTop: '1px solid var(--border)',
            display: 'flex', flexDirection: 'column', gap: 16
          }} className="show-mobile">
            <a href="#como-funciona" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: 16 }} onClick={() => setMenuOpen(false)}>Como funciona</a>
            <a href="#planos" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: 16 }} onClick={() => setMenuOpen(false)}>Planos</a>
            <Link href="/login" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: 16 }}>Entrar</Link>
            <Link href="/cadastro" className="btn-emerald" style={{ padding: '14px 20px', fontSize: 16, borderRadius: 12, textDecoration: 'none', textAlign: 'center' }}>
              Começar grátis →
            </Link>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section style={{ padding: '60px 20px 40px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(0,212,161,0.1)', border: '1px solid rgba(0,212,161,0.25)',
            borderRadius: 100, padding: '6px 16px', marginBottom: 24,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--emerald)', animation: 'pulse-glow 2s infinite' }}/>
            <span style={{ fontSize: 13, color: 'var(--emerald)', fontWeight: 600 }}>Simulador gratuito · Atualizado 2025</span>
          </div>

          <h1 style={{
            fontSize: 'clamp(32px, 6vw, 60px)',
            fontWeight: 900, lineHeight: 1.1, letterSpacing: '-2px',
            marginBottom: 20, color: 'var(--text)'
          }}>
            Quanto você precisará<br />
            <span className="text-gradient">para se aposentar bem?</span>
          </h1>

          <p style={{
            fontSize: 'clamp(16px, 2.5vw, 20px)',
            color: 'var(--text-secondary)', maxWidth: 560, margin: '0 auto 32px',
            lineHeight: 1.6
          }}>
            O único simulador que combina INSS + investimentos e te diz <strong style={{ color: 'var(--text)' }}>exatamente quanto guardar por mês</strong>.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="#simulador" className="btn-emerald" style={{ padding: '15px 32px', fontSize: 16, borderRadius: 12, textDecoration: 'none', display: 'inline-block' }}>
              Simular agora — grátis ↓
            </a>
            <a href="#como-funciona" style={{
              padding: '15px 24px', fontSize: 16, borderRadius: 12, textDecoration: 'none',
              border: '1px solid var(--border)', color: 'var(--text-secondary)',
              transition: 'all 0.2s',
            }}>
              Como funciona
            </a>
          </div>

          {/* Social proof */}
          <div style={{ marginTop: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, flexWrap: 'wrap' }}>
            {[
              { n: '12.400+', label: 'simulações feitas' },
              { n: '4.9 ★', label: 'avaliação média' },
              { n: '100%', label: 'gratuito para começar' },
            ].map(({ n, label }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>{n}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── LIVE SIMULATOR ── */}
        <div id="simulador" style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 24, overflow: 'hidden',
          boxShadow: '0 40px 80px rgba(0,0,0,0.5)',
        }}>
          {/* Top bar */}
          <div style={{
            padding: '16px 24px',
            borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,0.02)'
          }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FF5F57' }}/>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FFBD2E' }}/>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#27C840' }}/>
            <span style={{ marginLeft: 12, fontSize: 13, color: 'var(--text-muted)', fontFamily: 'monospace' }}>prever.app — simulador</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>

            {/* LEFT — inputs */}
            <div style={{ padding: '28px 24px', borderRight: '1px solid var(--border)' }}>
              <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--emerald)', marginBottom: 24 }}>
                Seus dados
              </p>

              <SliderField
                label="Sua idade atual"
                value={idade} min={18} max={60} step={1}
                onChange={v => setIdade(v)}
                display={`${idade} anos`}
              />
              <SliderField
                label="Aposentar com"
                value={idadeAposentadoria} min={idade + 5} max={75} step={1}
                onChange={v => setIdadeAposentadoria(v)}
                display={`${idadeAposentadoria} anos`}
                sub={`${anos} anos para a aposentadoria`}
              />
              <SliderField
                label="Salário atual"
                value={salario} min={1412} max={30000} step={100}
                onChange={v => setSalario(v)}
                display={fmtBRL(salario)}
              />
              <SliderField
                label="Renda desejada na aposentadoria"
                value={rendaDesejada} min={2000} max={50000} step={500}
                onChange={v => setRendaDesejada(v)}
                display={fmtBRL(rendaDesejada)}
              />
              <SliderField
                label="Quanto você investe hoje/mês"
                value={aporte} min={0} max={10000} step={50}
                onChange={v => setAporte(v)}
                display={fmtBRL(aporte)}
              />
            </div>

            {/* RIGHT — results */}
            <div style={{ padding: '28px 24px' }}>
              <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--emerald)', marginBottom: 24 }}>
                Resultado em tempo real
              </p>

              {/* Main result */}
              <div className="result-card" style={{ padding: '20px 20px', marginBottom: 20 }}>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>Renda mensal estimada</div>
                <div style={{ fontSize: 40, fontWeight: 900, letterSpacing: '-2px', color: deficit ? '#F87171' : 'var(--emerald)', lineHeight: 1 }}>
                  <AnimatedNumber value={Math.round(rendaTotal)} prefix="R$ " />
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>
                  {deficit
                    ? `⚠️ Falta ${fmtBRL(gap)} para atingir seu objetivo`
                    : `✅ Você atingirá seu objetivo`}
                </div>
              </div>

              {/* Breakdown */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                <BreakdownRow
                  label="🏛️ INSS (benefício estimado)"
                  value={beneficioINSS}
                  total={rendaDesejada}
                  color="#60A5FA"
                />
                <BreakdownRow
                  label="📈 Renda dos investimentos"
                  value={rendaInvestimentos}
                  total={rendaDesejada}
                  color="var(--emerald)"
                />
              </div>

              {/* Coverage bar */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Cobertura do objetivo</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: deficit ? '#F87171' : 'var(--emerald)' }}>
                    {Math.round(percentCobertura)}%
                  </span>
                </div>
                <div style={{ height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${percentCobertura}%`,
                    background: deficit
                      ? 'linear-gradient(90deg, #F87171, #FBBF24)'
                      : 'linear-gradient(90deg, var(--emerald-dark), var(--emerald))',
                    borderRadius: 4,
                    transition: 'width 0.4s ease',
                  }}/>
                </div>
              </div>

              {/* Patrimônio */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 16px', background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border)', borderRadius: 10, marginBottom: 20
              }}>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Patrimônio acumulado</span>
                <span style={{ fontWeight: 700, color: 'var(--text)', fontSize: 16 }}>
                  <AnimatedNumber value={Math.round(patrimonio)} prefix="R$ " />
                </span>
              </div>

              {/* CTA */}
              <Link href="/cadastro" className="btn-emerald" style={{
                display: 'block', textAlign: 'center', padding: '15px',
                fontSize: 15, borderRadius: 12, textDecoration: 'none',
              }}>
                Ver plano completo + PGBL/VGBL →
              </Link>

              <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginTop: 10 }}>
                Simulação educativa · Não constitui consultoria financeira
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="como-funciona" style={{ padding: '80px 20px', maxWidth: 1100, margin: '0 auto' }}>
        <div className="glow-line" style={{ marginBottom: 60 }}/>
        <h2 style={{ textAlign: 'center', fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 800, letterSpacing: '-1px', marginBottom: 12 }}>
          Tudo que os outros simuladores<br />não te contam
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: 52, fontSize: 17 }}>
          A maioria calcula só o INSS. Nós calculamos <strong style={{ color: 'var(--text)' }}>sua aposentadoria real</strong>.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
          {[
            {
              icon: '🏛️',
              title: 'INSS real, sem ilusão',
              desc: 'Calculamos seu benefício com as regras pós-reforma 2019. Sem surpresas na hora que mais importa.',
            },
            {
              icon: '📈',
              title: 'Investimentos + INSS juntos',
              desc: 'O único simulador que combina sua previdência pública com CDB, Tesouro Direto, PGBL e VGBL.',
            },
            {
              icon: '🎯',
              title: 'Seu número exato',
              desc: 'Não só o diagnóstico — te dizemos exatamente quanto investir por mês para atingir seu objetivo.',
            },
            {
              icon: '📱',
              title: 'Feito para mobile',
              desc: 'Interface fluida, sliders responsivos, resultados em tempo real. Funciona perfeitamente no celular.',
            },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="glass glass-hover" style={{ borderRadius: 16, padding: '24px' }}>
              <div style={{ fontSize: 32, marginBottom: 16 }}>{icon}</div>
              <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>{title}</h3>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── COMPARISON TABLE ── */}
      <section style={{ padding: '0 20px 80px', maxWidth: 900, margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: 'clamp(22px, 3.5vw, 36px)', fontWeight: 800, marginBottom: 36, letterSpacing: '-1px' }}>
          Prever vs. os outros
        </h2>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 400 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '16px 20px', textAlign: 'left', color: 'var(--text-muted)', fontSize: 13, fontWeight: 600 }}>Funcionalidade</th>
                  <th style={{ padding: '16px 12px', textAlign: 'center', fontSize: 13, fontWeight: 700, color: 'var(--emerald)' }}>Prever</th>
                  <th style={{ padding: '16px 12px', textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>Simulador INSS</th>
                  <th style={{ padding: '16px 12px', textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>Bancos</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Cálculo INSS atualizado 2025', true, true, false],
                  ['Combina INSS + investimentos', true, false, false],
                  ['Simulação em tempo real', true, false, false],
                  ['Funciona perfeitamente no mobile', true, false, false],
                  ['100% neutro (sem vender produto)', true, true, false],
                  ['Plano personalizado mensal', true, false, false],
                  ['PGBL / VGBL comparados', true, false, true],
                ].map(([feat, prever, inss, banco]) => (
                  <tr key={feat as string} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '14px 20px', fontSize: 14, color: 'var(--text-secondary)' }}>{feat as string}</td>
                    <td style={{ textAlign: 'center', fontSize: 18 }}>{prever ? '✅' : '❌'}</td>
                    <td style={{ textAlign: 'center', fontSize: 18 }}>{inss ? '✅' : '❌'}</td>
                    <td style={{ textAlign: 'center', fontSize: 18 }}>{banco ? '⚠️' : '❌'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="planos" style={{ padding: '0 20px 80px', maxWidth: 900, margin: '0 auto' }}>
        <div className="glow-line" style={{ marginBottom: 60 }}/>
        <h2 style={{ textAlign: 'center', fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 800, marginBottom: 12, letterSpacing: '-1px' }}>
          Comece grátis, evolua quando quiser
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: 48, fontSize: 17 }}>
          Sem cartão de crédito para começar.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
          {/* Free */}
          <div className="glass" style={{ borderRadius: 20, padding: '28px 24px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Gratuito</div>
            <div style={{ fontSize: 40, fontWeight: 900, letterSpacing: '-2px', marginBottom: 4 }}>R$ 0</div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>para sempre</div>
            {['Simulador básico INSS + investimentos', 'Resultado em tempo real', 'Sem cadastro necessário'].map(f => (
              <div key={f} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 12 }}>
                <span style={{ color: 'var(--emerald)', fontWeight: 700, flexShrink: 0 }}>✓</span>
                <span style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{f}</span>
              </div>
            ))}
            <Link href="/cadastro" style={{
              display: 'block', textAlign: 'center', padding: '13px',
              border: '1.5px solid var(--border)', borderRadius: 12,
              color: 'var(--text)', textDecoration: 'none', fontWeight: 600,
              marginTop: 20, fontSize: 15, transition: 'all 0.2s'
            }}>
              Começar grátis
            </Link>
          </div>

          {/* Premium */}
          <div style={{
            borderRadius: 20, padding: '28px 24px',
            background: 'linear-gradient(135deg, rgba(0,212,161,0.08), rgba(0,212,161,0.03))',
            border: '1.5px solid rgba(0,212,161,0.3)',
            position: 'relative', overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute', top: 16, right: 16,
              background: 'var(--emerald)', color: '#020A06',
              fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 100,
              textTransform: 'uppercase', letterSpacing: 0.5
            }}>Popular</div>

            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--emerald)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Premium</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
              <div style={{ fontSize: 40, fontWeight: 900, letterSpacing: '-2px' }}>R$ 29</div>
              <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>/mês</div>
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>cancele quando quiser</div>

            {[
              'Tudo do plano gratuito',
              'Simulador PGBL vs VGBL',
              'Plano personalizado mês a mês',
              'Cenários "e se" (inflação, crise...)',
              'Exportar relatório em PDF',
              'Atualizações automáticas das tabelas',
            ].map(f => (
              <div key={f} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 12 }}>
                <span style={{ color: 'var(--emerald)', fontWeight: 700, flexShrink: 0 }}>✓</span>
                <span style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{f}</span>
              </div>
            ))}

            <Link href="/cadastro?plan=premium" className="btn-emerald" style={{
              display: 'block', textAlign: 'center', padding: '14px',
              borderRadius: 12, textDecoration: 'none', fontWeight: 700,
              marginTop: 20, fontSize: 15
            }}>
              Assinar por R$ 29/mês →
            </Link>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section style={{ padding: '0 20px 80px', maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          {[
            { name: 'Renata S.', role: 'Professora, 38 anos', text: 'Finalmente entendi quanto o INSS vai me pagar de verdade. Foi um choque, mas melhor saber agora do que na hora da aposentadoria.' },
            { name: 'Carlos M.', role: 'Engenheiro, 44 anos', text: 'Usei o simulador dos bancos e dava sempre resultado ótimo. No Prever vi que estou 40% abaixo do meu objetivo. Corrigi na hora.' },
            { name: 'Ana P.', role: 'Autônoma, 31 anos', text: 'Como MEI eu não entendia minha contribuição do INSS. O Prever explicou de forma simples e ainda me mostrou quanto falta.' },
          ].map(({ name, role, text }) => (
            <div key={name} className="glass glass-hover" style={{ borderRadius: 16, padding: '20px' }}>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 16 }}>"{text}"</p>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{role}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{ padding: '0 20px 80px', maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
        <div className="glow-line" style={{ marginBottom: 60 }}/>
        <h2 style={{ fontSize: 'clamp(26px, 5vw, 44px)', fontWeight: 900, letterSpacing: '-1.5px', marginBottom: 16 }}>
          Seu futuro começa<br />
          <span className="text-gradient">com uma simulação</span>
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 32, fontSize: 17, lineHeight: 1.6 }}>
          Em 2 minutos você descobre se está no caminho certo — ou o que mudar agora para garantir sua tranquilidade amanhã.
        </p>
        <Link href="/cadastro" className="btn-emerald" style={{
          display: 'inline-block', padding: '17px 40px',
          fontSize: 17, borderRadius: 14, textDecoration: 'none', fontWeight: 700
        }}>
          Simular minha aposentadoria →
        </Link>
        <p style={{ marginTop: 16, fontSize: 13, color: 'var(--text-muted)' }}>Grátis · Sem cartão · 2 minutos</p>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        borderTop: '1px solid var(--border)',
        padding: '32px 20px',
        maxWidth: 1100, margin: '0 auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 24, height: 24, borderRadius: 6, background: 'var(--emerald)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: '#020A06' }}>P</div>
            <span style={{ fontWeight: 700, color: 'var(--text)' }}>prever</span>
          </div>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <Link href="/privacidade" style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none' }}>Privacidade</Link>
            <Link href="/termos" style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none' }}>Termos de uso</Link>
          </div>
        </div>
        <p style={{ marginTop: 20, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
          © 2025 Prever. Conteúdo educativo — não constitui consultoria financeira ou de investimentos. Consulte um profissional habilitado para decisões personalizadas.
        </p>
      </footer>

      {/* ── MOBILE CSS ── */}
      <style>{`
        @media (max-width: 640px) {
          .hidden-mobile { display: none !important; }
        }
        @media (min-width: 641px) {
          .show-mobile { display: none !important; }
        }
      `}</style>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────

function SliderField({
  label, value, min, max, step, onChange, display, sub
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  display: string;
  sub?: string;
}) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <label style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>{label}</label>
        <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{display}</span>
      </div>
      <DraggableRange
        min={min} max={max} step={step} value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(Number(e.target.value))}
        className="" style={{}}
      />
      {sub && <div style={{ fontSize: 11, color: 'var(--emerald)', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function BreakdownRow({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = Math.min((value / total) * 100, 100);
  return (
    <div style={{
      padding: '12px 14px',
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid var(--border)',
      borderRadius: 10,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
          <AnimatedNumber value={Math.round(value)} prefix="R$ " />
        </span>
      </div>
      <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: color, borderRadius: 2,
          transition: 'width 0.4s ease',
        }}/>
      </div>
    </div>
  );
}
