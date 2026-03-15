'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import DraggableRange from './components/DraggableRange';

// ─── Math ──────────────────────────────────────────────────────
const INSS_TETO = 8157.41;
const INSS_BENEFICIO_TETO = 7786.02;
const INSS_BENEFICIO_MIN = 1412.00;

function calcBeneficioINSS(salario: number, anos: number) {
  const base = Math.min(salario, INSS_TETO);
  const coef = Math.min(anos / 35, 1);
  return Math.max(INSS_BENEFICIO_MIN, Math.min(base * (0.60 + coef * 0.40), INSS_BENEFICIO_TETO));
}
function calcPatrimonio(aporte: number, anos: number, taxa: number) {
  const tm = Math.pow(1 + taxa, 1 / 12) - 1;
  const m = anos * 12;
  return aporte * ((Math.pow(1 + tm, m) - 1) / tm);
}
function calcRenda(patrimonio: number, taxa: number, anos: number) {
  if (anos <= 0) return patrimonio * (taxa / 12);
  const tm = Math.pow(1 + taxa, 1 / 12) - 1;
  return (patrimonio * tm) / (1 - Math.pow(1 + tm, -(anos * 12)));
}
function fmtBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
}
function fmtNum(v: number) { return v.toLocaleString('pt-BR', { maximumFractionDigits: 0 }); }

// ─── Animated Number ────────────────────────────────────────────
function AnimNum({ value, dur = 700 }: { value: number; dur?: number }) {
  const [disp, setDisp] = useState(value);
  const prev = useRef(value);
  useEffect(() => {
    const from = prev.current, to = value;
    if (from === to) return;
    const start = performance.now();
    let raf: number;
    function tick(now: number) {
      const t = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - t, 4);
      setDisp(Math.round(from + (to - from) * eased));
      if (t < 1) raf = requestAnimationFrame(tick); else prev.current = to;
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, dur]);
  return <>{fmtNum(disp)}</>;
}

// ─── Reveal on scroll ───────────────────────────────────────────
function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVis(true); obs.disconnect(); }
    }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} style={{
      opacity: vis ? 1 : 0,
      transform: vis ? 'translateY(0)' : 'translateY(20px)',
      transition: `opacity 0.6s ease ${delay}s, transform 0.6s ease ${delay}s`,
    }}>{children}</div>
  );
}

// ─── MAIN ──────────────────────────────────────────────────────
export default function LandingPage() {
  const [idade, setIdade] = useState(32);
  const [idadeApos, setIdadeApos] = useState(65);
  const [salario, setSalario] = useState(5000);
  const [renda, setRenda] = useState(8000);
  const [aporte, setAporte] = useState(800);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const anos = Math.max(idadeApos - idade, 1);
  const patrimonio = calcPatrimonio(aporte, anos, 0.10);
  const rendaInvest = calcRenda(patrimonio, 0.06, 25);
  const rendaINSS = calcBeneficioINSS(salario, anos);
  const rendaTotal = rendaInvest + rendaINSS;
  const gap = renda - rendaTotal;
  const deficit = gap > 0;
  const pct = Math.min((rendaTotal / renda) * 100, 100);

  const EM = '#059669';   // emerald
  const BG = '#FAFAFA';
  const TX = '#111111';
  const MU = '#777777';
  const BD = '#E5E5E5';

  return (
    <div style={{ background: BG, color: TX, minHeight: '100vh', overflowX: 'hidden' }}>

      {/* ── NAV ─────────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
        background: scrolled ? 'rgba(250,250,250,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: scrolled ? `1px solid ${BD}` : 'none',
        transition: 'all 0.3s',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px', height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 26, height: 26, borderRadius: 6, background: EM, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: 12 }}>P</span>
            <span style={{ fontWeight: 800, fontSize: 15, color: TX, letterSpacing: '-0.4px' }}>prever</span>
          </Link>
          <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Link href="/login" style={{ padding: '7px 16px', fontSize: 13, color: MU, textDecoration: 'none', borderRadius: 8, transition: 'color .2s' }}
              onMouseEnter={e => (e.currentTarget.style.color = TX)}
              onMouseLeave={e => (e.currentTarget.style.color = MU)}>Entrar</Link>
            <Link href="/cadastro" style={{
              padding: '8px 18px', fontSize: 13, fontWeight: 600, borderRadius: 8,
              background: TX, color: '#fff', textDecoration: 'none', transition: 'opacity .2s',
            }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
              Começar grátis
            </Link>
          </div>
          <button onClick={() => setMenuOpen(!menuOpen)} className="mob-btn"
            style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: TX }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              {menuOpen ? <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></> : <><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></>}
            </svg>
          </button>
        </div>
        {menuOpen && (
          <div style={{ background: 'rgba(250,250,250,0.97)', backdropFilter: 'blur(16px)', padding: '16px 24px 24px', borderTop: `1px solid ${BD}`, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Link href="/login" style={{ fontSize: 16, color: MU, textDecoration: 'none' }}>Entrar</Link>
            <Link href="/cadastro" style={{ padding: '14px', background: TX, color: '#fff', borderRadius: 10, textDecoration: 'none', textAlign: 'center', fontWeight: 700, fontSize: 16 }}>Começar grátis</Link>
          </div>
        )}
      </nav>

      {/* ── HERO ────────────────────────────────────────────── */}
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', padding: '100px 32px 60px', maxWidth: 1200, margin: '0 auto' }}>
        <div className="hero-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center', width: '100%' }}>

          {/* Left — statement */}
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#fff', border: `1px solid ${BD}`, borderRadius: 6, padding: '5px 12px', marginBottom: 40 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: EM, display: 'inline-block', animation: 'blink 2s infinite' }} />
              <span style={{ fontSize: 12, color: MU, fontWeight: 500, letterSpacing: 0.2 }}>Tabelas INSS 2025 · Simulador gratuito</span>
            </div>

            <h1 style={{ fontSize: 'clamp(38px, 5.5vw, 70px)', fontWeight: 900, lineHeight: 1.0, letterSpacing: '-3px', color: TX, marginBottom: 28 }}>
              Você vai se<br />aposentar<br />
              <span style={{ color: EM }}>com quanto?</span>
            </h1>

            <p style={{ fontSize: 18, color: MU, lineHeight: 1.7, marginBottom: 40, maxWidth: 400, letterSpacing: '-0.1px' }}>
              Combine INSS + investimentos e descubra o número real — não a estimativa otimista do seu banco.
            </p>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <a href="#simulador" style={{
                padding: '14px 28px', fontSize: 15, fontWeight: 700, borderRadius: 10,
                background: TX, color: '#fff', textDecoration: 'none', letterSpacing: '-0.2px',
                transition: 'transform .2s, box-shadow .2s',
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 30px rgba(0,0,0,0.2)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)'; }}>
                Simular agora — grátis
              </a>
              <a href="#planos" style={{
                padding: '14px 22px', fontSize: 15, fontWeight: 500, borderRadius: 10,
                background: 'transparent', border: `1.5px solid ${BD}`, color: MU, textDecoration: 'none', transition: 'border-color .2s, color .2s',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = TX; (e.currentTarget as HTMLElement).style.color = TX; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = BD; (e.currentTarget as HTMLElement).style.color = MU; }}>
                Ver planos
              </a>
            </div>
          </div>

          {/* Right — live result */}
          <div style={{ background: '#fff', border: `1px solid ${BD}`, borderRadius: 20, padding: '36px 32px', boxShadow: '0 20px 60px rgba(0,0,0,0.07)' }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, color: EM, marginBottom: 6 }}>Sua simulação ao vivo</p>
            <div style={{ fontSize: 'clamp(46px, 6vw, 72px)', fontWeight: 900, letterSpacing: '-4px', color: deficit ? '#DC2626' : EM, lineHeight: 1, marginBottom: 6 }}>
              R$&nbsp;<AnimNum value={Math.round(rendaTotal)} />
            </div>
            <p style={{ fontSize: 13, color: MU, marginBottom: 28 }}>renda mensal estimada na aposentadoria</p>

            <div style={{ height: 6, background: '#F3F4F6', borderRadius: 3, overflow: 'hidden', marginBottom: 20 }}>
              <div style={{ height: '100%', width: `${pct}%`, background: deficit ? 'linear-gradient(90deg,#DC2626,#F87171)' : `linear-gradient(90deg,${EM},#34D399)`, borderRadius: 3, transition: 'width .6s ease' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { label: 'Sua idade', value: idade, min: 18, max: 60, step: 1, set: setIdade, fmt: (v: number) => `${v} anos` },
                { label: `Aposentar com (${anos}a para aposentar)`, value: idadeApos, min: idade + 5, max: 75, step: 1, set: setIdadeApos, fmt: (v: number) => `${v} anos` },
                { label: 'Salário bruto', value: salario, min: 1412, max: 30000, step: 200, set: setSalario, fmt: fmtBRL },
                { label: 'Investimento mensal', value: aporte, min: 0, max: 10000, step: 100, set: setAporte, fmt: fmtBRL },
              ].map(({ label, value, min, max, step, set, fmt }: any) => (
                <div key={label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
                    <span style={{ fontSize: 12, color: MU }}>{label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: TX }}>{fmt(value)}</span>
                  </div>
                  <DraggableRange min={min} max={max} step={step} value={value}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => set(Number(e.target.value))}
                    className="" style={{}} />
                </div>
              ))}
            </div>

            <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={{ background: '#F9FAFB', border: `1px solid ${BD}`, borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 10, color: MU, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.8 }}>INSS</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#2563EB', letterSpacing: '-0.8px' }}>R$&nbsp;<AnimNum value={Math.round(rendaINSS)} /></div>
              </div>
              <div style={{ background: '#F9FAFB', border: `1px solid ${BD}`, borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 10, color: MU, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.8 }}>Investimentos</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: EM, letterSpacing: '-0.8px' }}>R$&nbsp;<AnimNum value={Math.round(rendaInvest)} /></div>
              </div>
            </div>

            <div style={{ marginTop: 14, padding: '12px 14px', background: deficit ? '#FEF2F2' : '#ECFDF5', borderRadius: 10, fontSize: 13, color: deficit ? '#DC2626' : '#065F46', fontWeight: 600 }}>
              {deficit ? `⚠ Falta ${fmtBRL(gap)} para atingir ${fmtBRL(renda)}` : `✓ Meta atingida — ${fmtBRL(-gap)} de sobra`}
            </div>

            <Link href="/cadastro" style={{
              display: 'block', marginTop: 16, textAlign: 'center', padding: '14px',
              background: `linear-gradient(135deg, ${EM}, #047857)`,
              color: '#fff', fontWeight: 700, fontSize: 14,
              borderRadius: 10, textDecoration: 'none',
              transition: 'opacity .2s', boxShadow: `0 4px 16px rgba(5,150,105,0.3)`,
            }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '.88')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
              Ver análise completa + PGBL/VGBL →
            </Link>
            <p style={{ fontSize: 11, color: MU, textAlign: 'center', marginTop: 10 }}>Simulação educativa · sem consultoria financeira</p>
          </div>
        </div>
      </section>

      {/* ── SHOCK BAND ──────────────────────────────────────── */}
      <div style={{ borderTop: `1px solid ${BD}`, borderBottom: `1px solid ${BD}`, background: TX, padding: '28px 32px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
          <span style={{ fontSize: 'clamp(14px,2vw,17px)', color: 'rgba(255,255,255,0.55)', letterSpacing: '-0.2px', textAlign: 'center' }}>
            <span style={{ color: '#fff', fontWeight: 800, fontSize: 'clamp(16px,2.2vw,20px)' }}>87% dos brasileiros</span>
            {' '}não sabem quanto vão receber do INSS ao se aposentar.{' '}
            <span style={{ color: EM, fontWeight: 600 }}>Você sabe o seu número?</span>
          </span>
          <a href="#simulador" style={{
            padding: '10px 22px', fontSize: 13, fontWeight: 700, borderRadius: 8,
            background: EM, color: '#fff', textDecoration: 'none', flexShrink: 0, whiteSpace: 'nowrap',
            transition: 'opacity .2s',
          }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '.85')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
            Descobrir agora
          </a>
        </div>
      </div>

      {/* ── FEATURES (editorial numbered list) ──────────────── */}
      <section id="recursos" style={{ maxWidth: 1200, margin: '0 auto', padding: '100px 32px' }}>
        <Reveal>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 64, flexWrap: 'wrap', gap: 20, borderBottom: `2px solid ${TX}`, paddingBottom: 20 }}>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 900, letterSpacing: '-2.5px', color: TX, lineHeight: 1, margin: 0 }}>
              Por que Prever
            </h2>
            <p style={{ fontSize: 16, color: MU, maxWidth: 380, margin: 0, lineHeight: 1.6 }}>
              A maioria calcula só o INSS. Nós calculamos <strong style={{ color: TX }}>sua aposentadoria real</strong>.
            </p>
          </div>
        </Reveal>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }} className="feat-grid">
          {[
            { n: '01', title: 'INSS real, sem ilusão', desc: 'Calculamos seu benefício com as regras pós-reforma 2019, tabela atualizada 2025. Zero estimativas otimistas dos bancos.', tag: 'Grátis' },
            { n: '02', title: 'INSS + Investimentos juntos', desc: 'O único simulador que combina previdência pública com CDB, Tesouro Direto, PGBL e VGBL num único número.', tag: 'Exclusivo' },
            { n: '03', title: 'Resultado em tempo real', desc: 'Mova os sliders e veja os números mudando instantaneamente. Sem "calcular", sem esperar.', tag: 'Grátis' },
            { n: '04', title: 'Análise PGBL vs VGBL', desc: 'Compare os dois produtos de previdência privada lado a lado e veja qual economiza mais no seu IR.', tag: 'Premium' },
          ].map(({ n, title, desc, tag }, i) => (
            <Reveal key={n} delay={i * 0.06}>
              <div style={{
                borderTop: `1px solid ${BD}`,
                borderRight: i % 2 === 0 ? `1px solid ${BD}` : 'none',
                padding: '36px 32px',
                transition: 'background .25s',
                cursor: 'default',
              }}
                onMouseEnter={e => (e.currentTarget.style.background = '#fff')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                  <span style={{ fontSize: 'clamp(36px,5vw,60px)', fontWeight: 900, color: '#EBEBEB', letterSpacing: '-3px', lineHeight: 1 }}>{n}</span>
                  <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', background: tag === 'Premium' ? '#ECFDF5' : '#F3F4F6', color: tag === 'Premium' ? EM : MU, border: `1px solid ${tag === 'Premium' ? '#A7F3D0' : BD}` }}>{tag}</span>
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: TX, letterSpacing: '-0.7px', marginBottom: 10 }}>{title}</h3>
                <p style={{ fontSize: 14, color: MU, lineHeight: 1.75 }}>{desc}</p>
              </div>
            </Reveal>
          ))}
          <div style={{ borderTop: `1px solid ${BD}` }} />
          <div style={{ borderTop: `1px solid ${BD}` }} />
        </div>
      </section>

      {/* ── COMPARISON ──────────────────────────────────────── */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px 100px' }}>
        <Reveal>
          <div style={{ borderTop: `2px solid ${TX}`, paddingTop: 20, marginBottom: 48, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 12 }}>
            <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 44px)', fontWeight: 900, letterSpacing: '-2px', margin: 0 }}>
              Prever vs. os outros
            </h2>
            <span style={{ fontSize: 13, color: MU }}>✓ disponível &nbsp;&nbsp; — não disponível &nbsp;&nbsp; ∼ parcial</span>
          </div>
          <div style={{ background: '#fff', border: `1px solid ${BD}`, borderRadius: 16, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 400 }}>
              <thead>
                <tr style={{ background: '#F9FAFB', borderBottom: `1px solid ${BD}` }}>
                  <th style={{ padding: '14px 24px', textAlign: 'left', fontSize: 12, color: MU, fontWeight: 600, letterSpacing: 0.5 }}>Funcionalidade</th>
                  {[{ l: 'Prever', c: EM }, { l: 'INSS.gov', c: MU }, { l: 'Bancos', c: MU }].map(({ l, c }) => (
                    <th key={l} style={{ padding: '14px 20px', textAlign: 'center', fontSize: 13, fontWeight: 800, color: c }}>{l}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['Cálculo INSS 2025 atualizado', true, true, false],
                  ['Combina INSS + investimentos', true, false, false],
                  ['Resultado em tempo real', true, false, false],
                  ['100% neutro (sem produto)', true, true, false],
                  ['Plano personalizado mensal', true, false, false],
                  ['PGBL / VGBL comparados', true, false, true],
                  ['Funciona no mobile', true, false, false],
                ].map(([feat, p, i2, b], idx) => (
                  <tr key={feat as string} style={{ borderBottom: idx < 6 ? `1px solid ${BD}` : 'none' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#F9FAFB')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '13px 24px', fontSize: 14, color: '#444' }}>{feat as string}</td>
                    <td style={{ textAlign: 'center', fontSize: 15, fontWeight: 700, color: EM }}>{p ? '✓' : <span style={{ color: '#D1D5DB' }}>—</span>}</td>
                    <td style={{ textAlign: 'center', fontSize: 15 }}>{i2 ? <span style={{ fontWeight: 700, color: EM }}>✓</span> : <span style={{ color: '#D1D5DB' }}>—</span>}</td>
                    <td style={{ textAlign: 'center', fontSize: 15 }}>{b ? <span style={{ color: '#D97706', fontWeight: 600 }}>∼</span> : <span style={{ color: '#D1D5DB' }}>—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>
      </section>

      {/* ── PRICING ─────────────────────────────────────────── */}
      <section id="planos" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px 100px' }}>
        <Reveal>
          <div style={{ borderTop: `2px solid ${TX}`, paddingTop: 20, marginBottom: 56 }}>
            <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 44px)', fontWeight: 900, letterSpacing: '-2px', marginBottom: 10 }}>
              Preços simples.
            </h2>
            <p style={{ fontSize: 16, color: MU }}>Comece grátis, assine quando precisar de mais.</p>
          </div>
        </Reveal>

        <div className="price-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Free */}
          <Reveal>
            <div style={{ background: '#fff', border: `1px solid ${BD}`, borderRadius: 16, padding: '36px 32px' }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: MU, marginBottom: 18 }}>Gratuito</p>
              <p style={{ fontSize: 52, fontWeight: 900, letterSpacing: '-3.5px', color: TX, marginBottom: 4 }}>R$&nbsp;0</p>
              <p style={{ fontSize: 13, color: MU, marginBottom: 32 }}>para sempre</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
                {['Simulador INSS + investimentos', 'Resultado em tempo real', 'Sem cadastro necessário'].map(f => (
                  <div key={f} style={{ display: 'flex', gap: 10 }}>
                    <span style={{ color: EM, fontWeight: 800, flexShrink: 0 }}>✓</span>
                    <span style={{ fontSize: 14, color: MU }}>{f}</span>
                  </div>
                ))}
              </div>
              <Link href="/cadastro" style={{
                display: 'block', textAlign: 'center', padding: '14px',
                border: `1.5px solid ${BD}`, borderRadius: 10, color: MU,
                fontWeight: 600, fontSize: 14, textDecoration: 'none', transition: 'all .2s',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = TX; (e.currentTarget as HTMLElement).style.color = TX; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = BD; (e.currentTarget as HTMLElement).style.color = MU; }}>
                Começar grátis
              </Link>
            </div>
          </Reveal>

          {/* Premium */}
          <Reveal delay={0.08}>
            <div style={{ background: TX, borderRadius: 16, padding: '36px 32px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 18, right: 18, background: EM, color: '#fff', fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Mais popular</div>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 18 }}>Premium</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
                <p style={{ fontSize: 52, fontWeight: 900, letterSpacing: '-3.5px', color: '#fff', margin: 0 }}>R$&nbsp;29</p>
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)' }}>/mês</span>
              </div>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginBottom: 32 }}>cancele quando quiser</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
                {[
                  'Tudo do gratuito',
                  'Simulador PGBL vs VGBL',
                  'Plano personalizado mensal',
                  'Cenários "e se" (inflação, crises)',
                  'Exportar PDF',
                  'Tabelas sempre atualizadas',
                ].map(f => (
                  <div key={f} style={{ display: 'flex', gap: 10 }}>
                    <span style={{ color: EM, fontWeight: 800, flexShrink: 0 }}>✓</span>
                    <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)' }}>{f}</span>
                  </div>
                ))}
              </div>
              <Link href="/cadastro?plan=premium" style={{
                display: 'block', textAlign: 'center', padding: '15px',
                background: EM, color: '#fff', fontWeight: 700, fontSize: 14,
                borderRadius: 10, textDecoration: 'none', transition: 'opacity .2s',
                boxShadow: `0 4px 18px rgba(5,150,105,0.4)`,
              }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '.88')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
                Assinar por R$&nbsp;29/mês →
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── TESTIMONIALS ────────────────────────────────────── */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px 100px' }}>
        <Reveal>
          <div style={{ borderTop: `2px solid ${TX}`, paddingTop: 20, marginBottom: 48 }}>
            <h2 style={{ fontSize: 'clamp(24px, 3vw, 40px)', fontWeight: 900, letterSpacing: '-1.8px' }}>O que dizem por aí</h2>
          </div>
          <div className="test-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {[
              { name: 'Renata S.', role: 'Professora · 38 anos', text: 'Finalmente entendi quanto o INSS vai me pagar de verdade. Foi um choque, mas melhor saber agora.' },
              { name: 'Carlos M.', role: 'Engenheiro · 44 anos', text: 'Usei o simulador dos bancos e sempre dava resultado ótimo. No Prever vi que estou 40% abaixo. Corrigi na hora.' },
              { name: 'Ana P.', role: 'MEI · 31 anos', text: 'Como autônoma eu não entendia minha contribuição do INSS. O Prever explicou de forma simples e me mostrou quanto falta.' },
            ].map(({ name, role, text }, i) => (
              <Reveal key={name} delay={i * 0.07}>
                <div style={{ background: '#fff', border: `1px solid ${BD}`, borderRadius: 14, padding: '28px 26px' }}>
                  <div style={{ display: 'flex', gap: 2, marginBottom: 16 }}>
                    {Array(5).fill(0).map((_, j) => <span key={j} style={{ color: '#F59E0B', fontSize: 12 }}>★</span>)}
                  </div>
                  <p style={{ fontSize: 15, color: '#444', lineHeight: 1.72, marginBottom: 20 }}>"{text}"</p>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: TX, margin: 0 }}>{name}</p>
                    <p style={{ fontSize: 12, color: MU, margin: '3px 0 0' }}>{role}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ── FINAL CTA ───────────────────────────────────────── */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px 120px' }}>
        <Reveal>
          <div style={{ borderTop: `2px solid ${TX}`, paddingTop: 64, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 40, flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: 'clamp(30px, 4.5vw, 60px)', fontWeight: 900, letterSpacing: '-3px', lineHeight: 1, color: TX, margin: 0, maxWidth: 600 }}>
              Descubra seu número.<br />
              <span style={{ color: EM }}>Comece hoje.</span>
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-end' }}>
              <Link href="/cadastro" style={{
                padding: '18px 40px', fontSize: 17, fontWeight: 800, borderRadius: 12,
                background: TX, color: '#fff', textDecoration: 'none', letterSpacing: '-0.3px',
                transition: 'transform .2s, box-shadow .2s',
                boxShadow: '0 6px 24px rgba(0,0,0,0.15)',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 36px rgba(0,0,0,0.2)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 24px rgba(0,0,0,0.15)'; }}>
                Simular minha aposentadoria
              </Link>
              <span style={{ fontSize: 13, color: MU }}>Grátis · Sem cartão · 2 minutos</span>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────── */}
      <footer style={{ borderTop: `1px solid ${BD}`, padding: '32px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 22, height: 22, borderRadius: 5, background: EM, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: 11 }}>P</span>
            <span style={{ fontWeight: 800, fontSize: 14, color: TX }}>prever</span>
          </div>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {[['/privacidade', 'Privacidade'], ['/termos', 'Termos'], ['/login', 'Entrar']].map(([href, label]) => (
              <Link key={label} href={href} style={{ fontSize: 13, color: MU, textDecoration: 'none', transition: 'color .2s' }}
                onMouseEnter={e => (e.currentTarget.style.color = TX)}
                onMouseLeave={e => (e.currentTarget.style.color = MU)}>{label}</Link>
            ))}
          </div>
        </div>
        <p style={{ marginTop: 20, fontSize: 12, color: '#BBB', lineHeight: 1.7 }}>
          © 2025 Prever. Conteúdo educativo — não constitui consultoria financeira.
        </p>
      </footer>

      {/* ── CSS ─────────────────────────────────────────────── */}
      <style>{`
        * { -webkit-font-smoothing: antialiased; }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @media (max-width: 900px) {
          .hero-grid { grid-template-columns: 1fr !important; gap: 48px !important; }
          .feat-grid { grid-template-columns: 1fr !important; }
          .feat-grid > div { border-right: none !important; }
          .price-grid { grid-template-columns: 1fr !important; }
          .test-grid { grid-template-columns: 1fr !important; }
          .nav-links { display: none !important; }
          .mob-btn { display: block !important; }
        }
      `}</style>
    </div>
  );
}
