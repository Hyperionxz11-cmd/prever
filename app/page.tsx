'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import DraggableRange from './components/DraggableRange';

// ─── Math ──────────────────────────────────────────────────────
const INSS_FAIXAS = [
  { ate: 1518.00, aliquota: 0.075 },
  { ate: 2793.88, aliquota: 0.09 },
  { ate: 4190.83, aliquota: 0.12 },
  { ate: 8157.41, aliquota: 0.14 },
];
const INSS_TETO = 8157.41;
const INSS_BENEFICIO_TETO = 7786.02;
const INSS_BENEFICIO_MIN = 1412.00;

function calcBeneficioINSS(salario: number, anos: number) {
  const base = Math.min(salario, INSS_TETO);
  const coef = Math.min(anos / 35, 1);
  return Math.max(INSS_BENEFICIO_MIN, Math.min(base * (0.60 + coef * 0.40), INSS_BENEFICIO_TETO));
}
function calcPatrimonio(aporte: number, anos: number, taxa: number, inicial = 0) {
  const tm = Math.pow(1 + taxa, 1 / 12) - 1;
  const m = anos * 12;
  return inicial * Math.pow(1 + tm, m) + aporte * ((Math.pow(1 + tm, m) - 1) / tm);
}
function calcRenda(patrimonio: number, taxa: number, anos: number) {
  if (anos <= 0) return patrimonio * (taxa / 12);
  const tm = Math.pow(1 + taxa, 1 / 12) - 1;
  return (patrimonio * tm) / (1 - Math.pow(1 + tm, -(anos * 12)));
}
function fmtBRL(v: number) { return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }); }
function fmtNum(v: number) { return v.toLocaleString('pt-BR', { maximumFractionDigits: 0 }); }

// ─── Animated number ────────────────────────────────────────────
function AnimNum({ value, prefix = 'R$ ' }: { value: number; prefix?: string }) {
  const [disp, setDisp] = useState(value);
  const prev = useRef(value);
  useEffect(() => {
    const from = prev.current, to = value;
    if (from === to) return;
    const dur = 500, start = performance.now();
    let raf: number;
    function tick(now: number) {
      const t = Math.min((now - start) / dur, 1);
      setDisp(Math.round(from + (to - from) * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf = requestAnimationFrame(tick); else prev.current = to;
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <span>{prefix}{fmtNum(disp)}</span>;
}

// ─── Fade-in on scroll ─────────────────────────────────────────
function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVis(true); obs.disconnect(); } }, { threshold: 0.12 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className={className} style={{
      opacity: vis ? 1 : 0,
      transform: vis ? 'translateY(0)' : 'translateY(24px)',
      transition: `opacity 0.65s ease ${delay}s, transform 0.65s ease ${delay}s`,
    }}>{children}</div>
  );
}

// ─── Tokens ─────────────────────────────────────────────────────
const C = {
  bg: '#ffffff',
  bgSoft: '#f5f5f7',
  bgCard: '#ffffff',
  text: '#1d1d1f',
  textSec: '#6e6e73',
  textTer: '#a1a1a6',
  border: 'rgba(0,0,0,0.08)',
  borderMid: 'rgba(0,0,0,0.12)',
  emerald: '#059669',
  emeraldLight: '#d1fae5',
  emeraldDark: '#047857',
  shadow: '0 2px 20px rgba(0,0,0,0.06)',
  shadowMd: '0 8px 40px rgba(0,0,0,0.10)',
  shadowLg: '0 24px 80px rgba(0,0,0,0.13)',
};

// ─── MAIN ──────────────────────────────────────────────────────
export default function LandingPage() {
  const [idade, setIdade] = useState(32);
  const [idadeApos, setIdadeApos] = useState(65);
  const [salario, setSalario] = useState(5000);
  const [renda, setRenda] = useState(8000);
  const [aporte, setAporte] = useState(800);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const anos = Math.max(idadeApos - idade, 1);
  const patrimonio = calcPatrimonio(aporte, anos, 0.10);
  const rendaInvest = calcRenda(patrimonio, 0.06, 25);
  const rendaINSS = calcBeneficioINSS(salario, anos);
  const rendaTotal = rendaInvest + rendaINSS;
  const gap = renda - rendaTotal;
  const deficit = gap > 0;
  const pct = Math.min((rendaTotal / renda) * 100, 100);

  return (
    <div style={{ background: C.bg, minHeight: '100vh', overflowX: 'hidden', color: C.text }}>

      {/* ── NAV ─────────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        transition: 'all 0.3s ease',
        background: scrolled ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0)',
        backdropFilter: scrolled ? 'blur(20px) saturate(180%)' : 'none',
        borderBottom: scrolled ? `1px solid ${C.border}` : 'none',
      }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: `linear-gradient(135deg,${C.emerald},${C.emeraldDark})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 13, color: '#fff', letterSpacing: '-0.5px' }}>P</div>
            <span style={{ fontWeight: 700, fontSize: 16, color: C.text, letterSpacing: '-0.3px' }}>prever</span>
          </Link>
          <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            {['#recursos|Recursos', '#planos|Planos'].map(item => {
              const [href, label] = item.split('|');
              return (
                <a key={label} href={href} style={{ color: C.textSec, fontSize: 14, textDecoration: 'none', transition: 'color .2s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = C.text)}
                  onMouseLeave={e => (e.currentTarget.style.color = C.textSec)}>{label}</a>
              );
            })}
            <Link href="/login" style={{ color: C.textSec, fontSize: 14, textDecoration: 'none', transition: 'color .2s' }}
              onMouseEnter={e => (e.currentTarget.style.color = C.text)}
              onMouseLeave={e => (e.currentTarget.style.color = C.textSec)}>Entrar</Link>
            <Link href="/cadastro" style={{
              padding: '8px 20px', fontSize: 13, fontWeight: 600, borderRadius: 980,
              background: C.text, color: '#fff', textDecoration: 'none',
              transition: 'opacity .2s',
            }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.82')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
              Começar grátis
            </Link>
          </div>
          <button onClick={() => setMenuOpen(!menuOpen)} className="mobile-menu-btn"
            style={{ display: 'none', background: 'none', border: 'none', color: C.text, cursor: 'pointer', padding: 6 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {menuOpen
                ? <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>
                : <><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></>}
            </svg>
          </button>
        </div>
        {menuOpen && (
          <div style={{ background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(20px)', padding: '20px 24px 28px', borderTop: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <a href="#recursos" style={{ color: C.textSec, textDecoration: 'none', fontSize: 17 }} onClick={() => setMenuOpen(false)}>Recursos</a>
            <a href="#planos" style={{ color: C.textSec, textDecoration: 'none', fontSize: 17 }} onClick={() => setMenuOpen(false)}>Planos</a>
            <Link href="/login" style={{ color: C.textSec, textDecoration: 'none', fontSize: 17 }}>Entrar</Link>
            <Link href="/cadastro" style={{ padding: '15px', background: C.text, color: '#fff', borderRadius: 14, textDecoration: 'none', textAlign: 'center', fontWeight: 700, fontSize: 16 }}>
              Começar grátis →
            </Link>
          </div>
        )}
      </nav>

      {/* ── HERO ────────────────────────────────────────────── */}
      <section style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '120px 24px 80px', position: 'relative', overflow: 'hidden', background: 'linear-gradient(180deg, #f5f5f7 0%, #ffffff 60%)' }}>
        {/* Subtle bg circles */}
        <div style={{ position: 'absolute', top: '15%', right: '10%', width: 480, height: 480, background: `radial-gradient(circle, rgba(5,150,105,0.06) 0%, transparent 70%)`, pointerEvents: 'none', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '10%', left: '5%', width: 320, height: 320, background: `radial-gradient(circle, rgba(5,150,105,0.04) 0%, transparent 70%)`, pointerEvents: 'none', borderRadius: '50%' }} />

        <div style={{ textAlign: 'center', maxWidth: 820, position: 'relative', zIndex: 1 }}>
          {/* Pill badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: C.emeraldLight, border: `1px solid rgba(5,150,105,0.2)`, borderRadius: 980, padding: '6px 16px', marginBottom: 32 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.emerald, display: 'inline-block', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: 13, color: C.emeraldDark, fontWeight: 600, letterSpacing: 0.1 }}>Simulador gratuito · Tabelas INSS 2025</span>
          </div>

          {/* Headline */}
          <h1 style={{ fontSize: 'clamp(42px, 7vw, 82px)', fontWeight: 800, lineHeight: 1.03, letterSpacing: '-3px', color: C.text, marginBottom: 22 }}>
            Descubra quanto você<br />
            <span style={{ color: C.emerald }}>precisa para se aposentar</span>
          </h1>

          <p style={{ fontSize: 'clamp(17px, 2.2vw, 20px)', color: C.textSec, maxWidth: 520, margin: '0 auto 44px', lineHeight: 1.65, letterSpacing: '-0.1px' }}>
            O único simulador que combina INSS real&nbsp;+ investimentos e calcula{' '}
            <strong style={{ color: C.text, fontWeight: 600 }}>exatamente quanto guardar por mês</strong>.
          </p>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 56 }}>
            <a href="#simulador" style={{
              padding: '16px 34px', fontSize: 16, fontWeight: 600, borderRadius: 980,
              background: C.text, color: '#fff', textDecoration: 'none',
              transition: 'all .25s', letterSpacing: '-0.2px',
              boxShadow: C.shadowMd,
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.03)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 50px rgba(0,0,0,0.2)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; (e.currentTarget as HTMLElement).style.boxShadow = C.shadowMd; }}>
              Simular agora — grátis
            </a>
            <a href="#planos" style={{
              padding: '16px 28px', fontSize: 16, fontWeight: 500, borderRadius: 980,
              background: 'transparent', border: `1.5px solid ${C.borderMid}`,
              color: C.textSec, textDecoration: 'none', transition: 'all .25s',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = C.text; (e.currentTarget as HTMLElement).style.color = C.text; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.borderMid; (e.currentTarget as HTMLElement).style.color = C.textSec; }}>
              Ver planos
            </a>
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { n: '12.400+', label: 'simulações' },
              { n: '4.9★', label: 'avaliação' },
              { n: '100%', label: 'grátis para começar' },
            ].map(({ n, label }, i) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center' }}>
                {i > 0 && <div style={{ width: 1, height: 28, background: C.border, margin: '0 28px' }} />}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: C.text, letterSpacing: '-0.5px' }}>{n}</div>
                  <div style={{ fontSize: 12, color: C.textTer, marginTop: 2 }}>{label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SIMULATOR ───────────────────────────────────────── */}
      <section id="simulador" style={{ padding: '0 24px 120px', maxWidth: 1120, margin: '0 auto' }}>
        <Reveal>
          <div style={{
            borderRadius: 24, overflow: 'hidden',
            background: C.bgCard,
            border: `1px solid ${C.border}`,
            boxShadow: C.shadowLg,
          }}>
            {/* Window chrome */}
            <div style={{ padding: '13px 18px', background: C.bgSoft, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 7 }}>
              <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#FF5F57' }} />
              <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#FEBC2E' }} />
              <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#28C840' }} />
              <span style={{ marginLeft: 14, fontSize: 12, color: C.textTer, fontFamily: 'ui-monospace,monospace', letterSpacing: 0.3 }}>simulador.prever.app</span>
            </div>

            <div className="sim-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
              {/* Inputs */}
              <div style={{ padding: '36px 32px', borderRight: `1px solid ${C.border}` }}>
                <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.8, color: C.emerald, marginBottom: 28 }}>Seus dados</p>
                {[
                  { label: 'Sua idade', value: idade, min: 18, max: 60, step: 1, set: setIdade, fmt: (v: number) => `${v} anos` },
                  { label: 'Aposentar com', value: idadeApos, min: idade + 5, max: 75, step: 1, set: setIdadeApos, fmt: (v: number) => `${v} anos`, sub: `${anos} anos para aposentar` },
                  { label: 'Salário bruto mensal', value: salario, min: 1412, max: 30000, step: 200, set: setSalario, fmt: fmtBRL },
                  { label: 'Renda desejada', value: renda, min: 2000, max: 50000, step: 500, set: setRenda, fmt: fmtBRL },
                  { label: 'Investimento mensal', value: aporte, min: 0, max: 10000, step: 100, set: setAporte, fmt: fmtBRL },
                ].map(({ label, value, min, max, step, set, fmt, sub }: any) => (
                  <div key={label} style={{ marginBottom: 26 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                      <span style={{ fontSize: 13, color: C.textSec }}>{label}</span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{fmt(value)}</span>
                    </div>
                    <DraggableRange min={min} max={max} step={step} value={value}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => set(Number(e.target.value))}
                      className="" style={{}} />
                    {sub && <div style={{ fontSize: 11, color: C.emerald, marginTop: 5, fontWeight: 500 }}>{sub}</div>}
                  </div>
                ))}
              </div>

              {/* Results */}
              <div style={{ padding: '36px 32px', display: 'flex', flexDirection: 'column', background: C.bgSoft }}>
                <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.8, color: C.emerald, marginBottom: 28 }}>Resultado em tempo real</p>

                {/* Big result */}
                <div style={{
                  background: deficit ? '#FFF1F2' : '#ECFDF5',
                  border: `1px solid ${deficit ? 'rgba(239,68,68,0.2)' : 'rgba(5,150,105,0.2)'}`,
                  borderRadius: 16, padding: '22px', marginBottom: 14,
                }}>
                  <div style={{ fontSize: 12, color: C.textTer, marginBottom: 8, letterSpacing: 0.3 }}>Renda mensal na aposentadoria</div>
                  <div style={{ fontSize: 44, fontWeight: 800, letterSpacing: '-2.5px', color: deficit ? '#DC2626' : C.emerald, lineHeight: 1, marginBottom: 10 }}>
                    <AnimNum value={Math.round(rendaTotal)} />
                  </div>
                  <div style={{ height: 5, background: 'rgba(0,0,0,0.06)', borderRadius: 3, overflow: 'hidden', marginBottom: 10 }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: deficit ? 'linear-gradient(90deg,#DC2626,#F87171)' : `linear-gradient(90deg,${C.emeraldDark},${C.emerald})`, borderRadius: 3, transition: 'width 0.5s ease' }} />
                  </div>
                  <div style={{ fontSize: 13, color: deficit ? '#DC2626' : C.emeraldDark, fontWeight: 500 }}>
                    {deficit ? `⚠ Falta ${fmtBRL(gap)} para atingir ${fmtBRL(renda)}` : `✓ Objetivo atingido — excedente ${fmtBRL(-gap)}`}
                  </div>
                </div>

                {/* Breakdown */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                  {[
                    { label: 'INSS estimado', value: rendaINSS, color: '#2563EB' },
                    { label: 'Investimentos', value: rendaInvest, color: C.emerald },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, padding: '14px', boxShadow: C.shadow }}>
                      <div style={{ fontSize: 11, color: C.textTer, marginBottom: 6 }}>{label}</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color, letterSpacing: '-0.6px' }}>
                        <AnimNum value={Math.round(value)} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Patrimônio */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 16px', background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 11, marginBottom: 18, boxShadow: C.shadow }}>
                  <span style={{ fontSize: 13, color: C.textSec }}>Patrimônio acumulado</span>
                  <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>
                    <AnimNum value={Math.round(patrimonio)} />
                  </span>
                </div>

                <Link href="/cadastro" style={{
                  display: 'block', textAlign: 'center', padding: '15px',
                  background: `linear-gradient(135deg, ${C.emerald}, ${C.emeraldDark})`,
                  color: '#fff', fontWeight: 700, fontSize: 15,
                  borderRadius: 12, textDecoration: 'none', letterSpacing: '-0.2px',
                  transition: 'opacity .2s', boxShadow: `0 4px 20px rgba(5,150,105,0.3)`,
                }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '.87')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
                  Ver análise completa + PGBL/VGBL →
                </Link>

                <p style={{ fontSize: 11, color: C.textTer, textAlign: 'center', marginTop: 12 }}>
                  Simulação educativa · Não constitui consultoria financeira
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── FEATURES ────────────────────────────────────────── */}
      <section id="recursos" style={{ padding: '60px 24px 120px', maxWidth: 1120, margin: '0 auto' }}>
        <Reveal>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <p style={{ fontSize: 13, letterSpacing: 2, color: C.emerald, fontWeight: 700, textTransform: 'uppercase', marginBottom: 14 }}>Por que Prever</p>
            <h2 style={{ fontSize: 'clamp(30px, 4.5vw, 52px)', fontWeight: 800, letterSpacing: '-2px', color: C.text, marginBottom: 16, lineHeight: 1.06 }}>
              Diferente de tudo<br />que existe.
            </h2>
            <p style={{ fontSize: 18, color: C.textSec, maxWidth: 500, margin: '0 auto', lineHeight: 1.65 }}>
              A maioria calcula só o INSS. Nós calculamos{' '}
              <span style={{ color: C.text, fontWeight: 600 }}>sua aposentadoria real</span>.
            </p>
          </div>
        </Reveal>

        <div className="features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          {[
            {
              icon: <svg width="26" height="26" fill="none" stroke={C.emerald} strokeWidth="1.8" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>,
              title: 'INSS real, sem ilusão',
              desc: 'Calculamos seu benefício com as regras pós-reforma 2019, usando a tabela atualizada 2025. Nada de estimativas otimistas dos bancos.',
              tag: 'Gratuito',
              tagPremium: false,
            },
            {
              icon: <svg width="26" height="26" fill="none" stroke={C.emerald} strokeWidth="1.8" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>,
              title: 'INSS + Investimentos juntos',
              desc: 'O único simulador que combina previdência pública com CDB, Tesouro Direto, PGBL e VGBL num único número.',
              tag: 'Exclusivo',
              tagPremium: false,
            },
            {
              icon: <svg width="26" height="26" fill="none" stroke={C.emerald} strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
              title: 'Resultado em tempo real',
              desc: 'Mova os sliders e veja os números mudarem instantaneamente. Sem precisar clicar em "calcular".',
              tag: 'Grátis',
              tagPremium: false,
            },
            {
              icon: <svg width="26" height="26" fill="none" stroke={C.emerald} strokeWidth="1.8" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg>,
              title: 'Análise PGBL vs VGBL',
              desc: 'Compare os dois produtos de previdência privada lado a lado e veja qual economiza mais no seu IR.',
              tag: 'Premium',
              tagPremium: true,
            },
          ].map(({ icon, title, desc, tag, tagPremium }, i) => (
            <Reveal key={title} delay={i * 0.08}>
              <div style={{
                background: C.bgCard,
                border: `1px solid ${C.border}`,
                borderRadius: 20, padding: '30px',
                boxShadow: C.shadow,
                transition: 'all .3s',
                cursor: 'default',
              }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.boxShadow = C.shadowMd; el.style.borderColor = `rgba(5,150,105,0.25)`; el.style.transform = 'translateY(-3px)'; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.boxShadow = C.shadow; el.style.borderColor = C.border; el.style.transform = 'translateY(0)'; }}
              >
                <div style={{ width: 46, height: 46, borderRadius: 12, background: C.emeraldLight, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>{icon}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <h3 style={{ fontSize: 17, fontWeight: 700, color: C.text, letterSpacing: '-0.4px' }}>{title}</h3>
                  <span style={{
                    fontSize: 11, padding: '3px 9px', borderRadius: 980, fontWeight: 600,
                    background: tagPremium ? C.emeraldLight : C.bgSoft,
                    color: tagPremium ? C.emeraldDark : C.textTer,
                    border: `1px solid ${tagPremium ? 'rgba(5,150,105,0.2)' : C.border}`,
                  }}>{tag}</span>
                </div>
                <p style={{ fontSize: 14, color: C.textSec, lineHeight: 1.72 }}>{desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── COMPARISON ──────────────────────────────────────── */}
      <section style={{ padding: '0 24px 120px', maxWidth: 900, margin: '0 auto' }}>
        <Reveal>
          <h2 style={{ textAlign: 'center', fontSize: 'clamp(26px, 4vw, 46px)', fontWeight: 800, letterSpacing: '-2px', color: C.text, marginBottom: 48, lineHeight: 1.06 }}>
            Prever vs. os outros
          </h2>
          <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 20, overflow: 'hidden', boxShadow: C.shadowMd }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 420 }}>
                <thead>
                  <tr style={{ background: C.bgSoft, borderBottom: `1px solid ${C.border}` }}>
                    <th style={{ padding: '16px 24px', textAlign: 'left', color: C.textTer, fontSize: 12, fontWeight: 600, letterSpacing: 0.8, textTransform: 'uppercase' }}>Funcionalidade</th>
                    {[
                      { label: 'Prever', color: C.emerald },
                      { label: 'INSS.gov', color: C.textTer },
                      { label: 'Bancos', color: C.textTer },
                    ].map(({ label, color }) => (
                      <th key={label} style={{ padding: '16px 20px', textAlign: 'center', color, fontSize: 13, fontWeight: 700 }}>{label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Cálculo INSS 2025 atualizado', true, true, false],
                    ['Combina INSS + investimentos', true, false, false],
                    ['Resultado em tempo real', true, false, false],
                    ['100% neutro (sem produto para vender)', true, true, false],
                    ['Plano personalizado mês a mês', true, false, false],
                    ['PGBL / VGBL comparados', true, false, true],
                    ['Funciona perfeitamente no mobile', true, false, false],
                  ].map(([feat, p, i, b], idx) => (
                    <tr key={feat as string} style={{ borderBottom: idx < 6 ? `1px solid ${C.border}` : 'none' }}>
                      <td style={{ padding: '14px 24px', fontSize: 14, color: C.textSec }}>{feat as string}</td>
                      <td style={{ textAlign: 'center' }}>{p ? <span style={{ color: C.emerald, fontSize: 16, fontWeight: 700 }}>✓</span> : <span style={{ color: C.textTer, fontSize: 16 }}>—</span>}</td>
                      <td style={{ textAlign: 'center' }}>{i ? <span style={{ color: C.emerald, fontSize: 16, fontWeight: 700 }}>✓</span> : <span style={{ color: C.textTer }}>—</span>}</td>
                      <td style={{ textAlign: 'center' }}>{b ? <span style={{ color: '#D97706', fontSize: 13 }}>∼</span> : <span style={{ color: C.textTer }}>—</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── PRICING ─────────────────────────────────────────── */}
      <section id="planos" style={{ padding: '0 24px 120px', maxWidth: 860, margin: '0 auto' }}>
        <Reveal>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{ fontSize: 'clamp(28px, 4.5vw, 50px)', fontWeight: 800, letterSpacing: '-2px', color: C.text, marginBottom: 12, lineHeight: 1.06 }}>
              Comece grátis.<br />Evolua quando quiser.
            </h2>
            <p style={{ fontSize: 17, color: C.textSec }}>Sem cartão de crédito para começar.</p>
          </div>
        </Reveal>

        <div className="pricing-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>
          {/* Free */}
          <Reveal delay={0}>
            <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 22, padding: '34px 30px', boxShadow: C.shadow }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.8, textTransform: 'uppercase', color: C.textTer, marginBottom: 18 }}>Gratuito</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
                <span style={{ fontSize: 50, fontWeight: 800, letterSpacing: '-3px', color: C.text }}>R$&nbsp;0</span>
              </div>
              <p style={{ fontSize: 13, color: C.textTer, marginBottom: 30 }}>para sempre</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 13, marginBottom: 30 }}>
                {['Simulador INSS + investimentos', 'Resultado em tempo real', 'Sem cadastro necessário'].map(f => (
                  <div key={f} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span style={{ color: C.emerald, fontSize: 15, lineHeight: 1.6, flexShrink: 0, fontWeight: 700 }}>✓</span>
                    <span style={{ fontSize: 14, color: C.textSec, lineHeight: 1.55 }}>{f}</span>
                  </div>
                ))}
              </div>
              <Link href="/cadastro" style={{
                display: 'block', textAlign: 'center', padding: '14px',
                border: `1.5px solid ${C.borderMid}`, borderRadius: 12,
                color: C.textSec, textDecoration: 'none', fontWeight: 600, fontSize: 15,
                transition: 'all .2s',
              }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = C.text; el.style.color = C.text; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = C.borderMid; el.style.color = C.textSec; }}>
                Começar grátis
              </Link>
            </div>
          </Reveal>

          {/* Premium */}
          <Reveal delay={0.1}>
            <div style={{
              borderRadius: 22, padding: '34px 30px',
              background: C.text,
              position: 'relative', overflow: 'hidden',
              boxShadow: C.shadowLg,
            }}>
              <div style={{ position: 'absolute', top: 18, right: 18, background: C.emerald, color: '#fff', fontSize: 11, fontWeight: 800, padding: '4px 12px', borderRadius: 980, letterSpacing: 0.5, textTransform: 'uppercase' }}>Popular</div>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.8, textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', marginBottom: 18 }}>Premium</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
                <span style={{ fontSize: 50, fontWeight: 800, letterSpacing: '-3px', color: '#fff' }}>R$&nbsp;29</span>
                <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.4)' }}>/mês</span>
              </div>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginBottom: 30 }}>cancele quando quiser</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 13, marginBottom: 30 }}>
                {[
                  'Tudo do plano gratuito',
                  'Simulador PGBL vs VGBL',
                  'Plano personalizado mês a mês',
                  'Cenários "e se" (inflação, crises)',
                  'Exportar relatório em PDF',
                  'Tabelas atualizadas automaticamente',
                ].map(f => (
                  <div key={f} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span style={{ color: C.emerald, fontSize: 15, lineHeight: 1.6, flexShrink: 0, fontWeight: 700 }}>✓</span>
                    <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.55 }}>{f}</span>
                  </div>
                ))}
              </div>
              <Link href="/cadastro?plan=premium" style={{
                display: 'block', textAlign: 'center', padding: '15px',
                background: C.emerald,
                color: '#fff', fontWeight: 700, fontSize: 15,
                borderRadius: 12, textDecoration: 'none', letterSpacing: '-0.2px',
                transition: 'opacity .2s',
                boxShadow: `0 4px 20px rgba(5,150,105,0.4)`,
              }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '.87')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
                Assinar por R$&nbsp;29/mês →
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── TESTIMONIALS ────────────────────────────────────── */}
      <section style={{ padding: '0 24px 120px', maxWidth: 1000, margin: '0 auto' }}>
        <Reveal>
          <div className="testimonials-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {[
              { name: 'Renata S.', role: 'Professora · 38 anos', text: 'Finalmente entendi quanto o INSS vai me pagar de verdade. Foi um choque, mas melhor saber agora.', stars: 5 },
              { name: 'Carlos M.', role: 'Engenheiro · 44 anos', text: 'Usei o simulador dos bancos e sempre dava resultado ótimo. No Prever vi que estou 40% abaixo. Corrigi na hora.', stars: 5 },
              { name: 'Ana P.', role: 'MEI · 31 anos', text: 'Como autônoma eu não entendia minha contribuição do INSS. O Prever explicou de forma simples e me mostrou quanto falta.', stars: 5 },
            ].map(({ name, role, text, stars }, i) => (
              <Reveal key={name} delay={i * 0.08}>
                <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 18, padding: '26px', height: '100%', display: 'flex', flexDirection: 'column', boxShadow: C.shadow }}>
                  <div style={{ display: 'flex', gap: 3, marginBottom: 16 }}>
                    {Array(stars).fill(0).map((_, j) => <span key={j} style={{ color: '#F59E0B', fontSize: 13 }}>★</span>)}
                  </div>
                  <p style={{ fontSize: 15, color: C.textSec, lineHeight: 1.72, marginBottom: 20, flex: 1 }}>"{text}"</p>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.text, letterSpacing: '-0.2px' }}>{name}</div>
                    <div style={{ fontSize: 12, color: C.textTer, marginTop: 3 }}>{role}</div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ── FINAL CTA ───────────────────────────────────────── */}
      <section style={{ padding: '0 24px 160px', maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
        <Reveal>
          <div style={{ padding: '72px 48px', background: C.bgSoft, border: `1px solid ${C.border}`, borderRadius: 28, boxShadow: C.shadowMd }}>
            <h2 style={{ fontSize: 'clamp(28px, 4.5vw, 50px)', fontWeight: 800, letterSpacing: '-2px', color: C.text, marginBottom: 16, lineHeight: 1.06 }}>
              Seu futuro começa<br />
              <span style={{ color: C.emerald }}>com uma simulação.</span>
            </h2>
            <p style={{ fontSize: 18, color: C.textSec, marginBottom: 36, lineHeight: 1.65 }}>
              Em 2 minutos você descobre se está no caminho certo — ou o que mudar agora.
            </p>
            <Link href="/cadastro" style={{
              display: 'inline-block', padding: '17px 42px',
              background: C.text, color: '#fff',
              fontSize: 17, fontWeight: 700, borderRadius: 980,
              textDecoration: 'none', letterSpacing: '-0.3px',
              transition: 'all .25s',
              boxShadow: C.shadowMd,
            }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'scale(1.04)'; el.style.boxShadow = '0 16px 50px rgba(0,0,0,0.2)'; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'scale(1)'; el.style.boxShadow = C.shadowMd; }}>
              Simular minha aposentadoria
            </Link>
            <p style={{ marginTop: 16, fontSize: 13, color: C.textTer }}>Grátis · Sem cartão · 2 minutos</p>
          </div>
        </Reveal>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────── */}
      <footer style={{ borderTop: `1px solid ${C.border}`, padding: '36px 24px 48px', maxWidth: 1120, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ width: 24, height: 24, borderRadius: 6, background: `linear-gradient(135deg,${C.emerald},${C.emeraldDark})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: '#fff' }}>P</div>
            <span style={{ fontWeight: 700, color: C.text, fontSize: 14 }}>prever</span>
          </div>
          <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
            {[
              ['/privacidade', 'Privacidade'],
              ['/termos', 'Termos'],
              ['/login', 'Entrar'],
            ].map(([href, label]) => (
              <Link key={label} href={href} style={{ fontSize: 13, color: C.textTer, textDecoration: 'none', transition: 'color .2s' }}
                onMouseEnter={e => (e.currentTarget.style.color = C.text)}
                onMouseLeave={e => (e.currentTarget.style.color = C.textTer)}>{label}</Link>
            ))}
          </div>
        </div>
        <p style={{ marginTop: 24, fontSize: 12, color: C.textTer, lineHeight: 1.7 }}>
          © 2025 Prever. Conteúdo educativo — não constitui consultoria financeira. Consulte um profissional habilitado para decisões personalizadas.
        </p>
      </footer>

      {/* ── CSS ─────────────────────────────────────────────── */}
      <style>{`
        * { -webkit-font-smoothing: antialiased; }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @media (max-width: 768px) {
          .nav-links { display: none !important; }
          .mobile-menu-btn { display: block !important; }
          .sim-grid { grid-template-columns: 1fr !important; }
          .sim-grid > div:first-child { border-right: none !important; border-bottom: 1px solid rgba(0,0,0,0.07); }
          .features-grid { grid-template-columns: 1fr !important; }
          .pricing-grid { grid-template-columns: 1fr !important; }
          .testimonials-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 640px) {
          .sim-grid > div { padding: 24px 20px !important; }
        }
      `}</style>
    </div>
  );
}
