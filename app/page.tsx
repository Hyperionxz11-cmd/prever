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
      transform: vis ? 'translateY(0)' : 'translateY(28px)',
      transition: `opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s`,
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
    <div style={{ background: '#000', minHeight: '100vh', overflowX: 'hidden' }}>

      {/* ── NAV ─────────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        transition: 'all 0.4s ease',
        background: scrolled ? 'rgba(0,0,0,0.82)' : 'transparent',
        backdropFilter: scrolled ? 'blur(24px) saturate(180%)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : 'none',
      }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg,#00D4A1,#00a070)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 13, color: '#000', letterSpacing: '-0.5px' }}>P</div>
            <span style={{ fontWeight: 700, fontSize: 17, color: '#fff', letterSpacing: '-0.3px' }}>prever</span>
          </Link>
          <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            <a href="#recursos" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, textDecoration: 'none', transition: 'color .2s' }} onMouseEnter={e=>(e.currentTarget.style.color='#fff')} onMouseLeave={e=>(e.currentTarget.style.color='rgba(255,255,255,0.6)')}>Recursos</a>
            <a href="#planos" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, textDecoration: 'none', transition: 'color .2s' }} onMouseEnter={e=>(e.currentTarget.style.color='#fff')} onMouseLeave={e=>(e.currentTarget.style.color='rgba(255,255,255,0.6)')}>Planos</a>
            <Link href="/login" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, textDecoration: 'none', transition: 'color .2s' }} onMouseEnter={e=>(e.currentTarget.style.color='#fff')} onMouseLeave={e=>(e.currentTarget.style.color='rgba(255,255,255,0.6)')}>Entrar</Link>
            <Link href="/cadastro" style={{
              padding: '8px 20px', fontSize: 13, fontWeight: 600, borderRadius: 980,
              background: '#fff', color: '#000', textDecoration: 'none',
              transition: 'opacity .2s',
            }} onMouseEnter={e=>(e.currentTarget.style.opacity='0.85')} onMouseLeave={e=>(e.currentTarget.style.opacity='1')}>
              Começar grátis
            </Link>
          </div>
          <button onClick={() => setMenuOpen(!menuOpen)} className="mobile-menu-btn" style={{ display: 'none', background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 6 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {menuOpen ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></> : <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>}
            </svg>
          </button>
        </div>
        {menuOpen && (
          <div style={{ padding: '20px 24px 28px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: 20 }}>
            <a href="#recursos" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: 17 }} onClick={() => setMenuOpen(false)}>Recursos</a>
            <a href="#planos" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: 17 }} onClick={() => setMenuOpen(false)}>Planos</a>
            <Link href="/login" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: 17 }}>Entrar</Link>
            <Link href="/cadastro" style={{ padding: '15px', background: '#fff', color: '#000', borderRadius: 14, textDecoration: 'none', textAlign: 'center', fontWeight: 700, fontSize: 16 }}>Começar grátis →</Link>
          </div>
        )}
      </nav>

      {/* ── HERO ────────────────────────────────────────────── */}
      <section style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '120px 24px 80px', position: 'relative', overflow: 'hidden' }}>
        {/* Background glow blobs */}
        <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translate(-50%,-50%)', width: 600, height: 600, background: 'radial-gradient(circle, rgba(0,212,161,0.12) 0%, transparent 70%)', pointerEvents: 'none', borderRadius: '50%' }}/>
        <div style={{ position: 'absolute', top: '60%', left: '30%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(0,212,161,0.06) 0%, transparent 70%)', pointerEvents: 'none', borderRadius: '50%' }}/>

        <div style={{ textAlign: 'center', maxWidth: 860, position: 'relative', zIndex: 1 }}>
          {/* Pill badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(0,212,161,0.08)', border: '1px solid rgba(0,212,161,0.2)', borderRadius: 980, padding: '6px 18px', marginBottom: 32 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00D4A1', display: 'inline-block', animation: 'pulse 2s infinite' }}/>
            <span style={{ fontSize: 13, color: '#00D4A1', fontWeight: 500, letterSpacing: 0.3 }}>Simulador gratuito · Tabelas INSS 2025</span>
          </div>

          {/* Headline */}
          <h1 style={{ fontSize: 'clamp(44px, 7.5vw, 88px)', fontWeight: 800, lineHeight: 1.02, letterSpacing: '-3px', color: '#fff', marginBottom: 24 }}>
            Descubra quanto você<br />
            <span style={{ background: 'linear-gradient(135deg, #00D4A1 0%, #4ade80 50%, #00b4d8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>precisa para se aposentar</span>
          </h1>

          <p style={{ fontSize: 'clamp(17px, 2.5vw, 21px)', color: 'rgba(255,255,255,0.55)', maxWidth: 560, margin: '0 auto 44px', lineHeight: 1.65, letterSpacing: '-0.2px' }}>
            O único simulador que combina INSS real&nbsp;+ investimentos e calcula <strong style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>exatamente quanto guardar por mês</strong>.
          </p>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 56 }}>
            <a href="#simulador" style={{
              padding: '16px 36px', fontSize: 16, fontWeight: 600, borderRadius: 980,
              background: '#fff', color: '#000', textDecoration: 'none',
              transition: 'all .25s', letterSpacing: '-0.2px',
            }} onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.transform='scale(1.03)';(e.currentTarget as HTMLElement).style.boxShadow='0 0 40px rgba(255,255,255,0.2)'}} onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.transform='scale(1)';(e.currentTarget as HTMLElement).style.boxShadow='none'}}>
              Simular agora — grátis
            </a>
            <a href="#planos" style={{
              padding: '16px 30px', fontSize: 16, fontWeight: 500, borderRadius: 980,
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
              color: 'rgba(255,255,255,0.8)', textDecoration: 'none', transition: 'all .25s',
            }} onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.1)'}} onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.06)'}}>
              Ver planos
            </a>
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, flexWrap: 'wrap' }}>
            {[
              { n: '12.400+', label: 'simulações' },
              { n: '4.9★', label: 'avaliação' },
              { n: '100%', label: 'grátis para começar' },
            ].map(({ n, label }, i) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                {i > 0 && <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.12)', margin: '0 28px' }}/>}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 19, fontWeight: 700, color: '#fff', letterSpacing: '-0.5px' }}>{n}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{label}</div>
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
            borderRadius: 28, overflow: 'hidden',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 60px 120px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05)',
          }}>
            {/* Window chrome */}
            <div style={{ padding: '14px 20px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 11, height: 11, borderRadius: '50%', background: 'rgba(255,95,87,0.7)' }}/>
              <div style={{ width: 11, height: 11, borderRadius: '50%', background: 'rgba(255,189,46,0.7)' }}/>
              <div style={{ width: 11, height: 11, borderRadius: '50%', background: 'rgba(39,201,63,0.7)' }}/>
              <span style={{ marginLeft: 14, fontSize: 12, color: 'rgba(255,255,255,0.3)', fontFamily: 'ui-monospace,monospace', letterSpacing: 0.3 }}>simulador.prever.app</span>
            </div>

            <div className="sim-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
              {/* Inputs */}
              <div style={{ padding: '36px 32px', borderRight: '1px solid rgba(255,255,255,0.07)' }}>
                <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 2, color: '#00D4A1', marginBottom: 28 }}>Seus dados</p>
                {[
                  { label: 'Sua idade', value: idade, min: 18, max: 60, step: 1, set: setIdade, fmt: (v: number) => `${v} anos` },
                  { label: 'Aposentar com', value: idadeApos, min: idade + 5, max: 75, step: 1, set: setIdadeApos, fmt: (v: number) => `${v} anos`, sub: `${anos} anos para aposentar` },
                  { label: 'Salário bruto mensal', value: salario, min: 1412, max: 30000, step: 200, set: setSalario, fmt: fmtBRL },
                  { label: 'Renda desejada', value: renda, min: 2000, max: 50000, step: 500, set: setRenda, fmt: fmtBRL },
                  { label: 'Investimento mensal', value: aporte, min: 0, max: 10000, step: 100, set: setAporte, fmt: fmtBRL },
                ].map(({ label, value, min, max, step, set, fmt, sub }: any) => (
                  <div key={label} style={{ marginBottom: 26 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', fontWeight: 400 }}>{label}</span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{fmt(value)}</span>
                    </div>
                    <DraggableRange min={min} max={max} step={step} value={value}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => set(Number(e.target.value))}
                      className="" style={{}} />
                    {sub && <div style={{ fontSize: 11, color: '#00D4A1', marginTop: 5, letterSpacing: 0.2 }}>{sub}</div>}
                  </div>
                ))}
              </div>

              {/* Results */}
              <div style={{ padding: '36px 32px', display: 'flex', flexDirection: 'column', gap: 0 }}>
                <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 2, color: '#00D4A1', marginBottom: 28 }}>Resultado em tempo real</p>

                {/* Big result */}
                <div style={{
                  background: deficit ? 'rgba(248,113,113,0.06)' : 'rgba(0,212,161,0.06)',
                  border: `1px solid ${deficit ? 'rgba(248,113,113,0.2)' : 'rgba(0,212,161,0.2)'}`,
                  borderRadius: 18, padding: '24px', marginBottom: 16,
                }}>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 8, letterSpacing: 0.3 }}>Renda mensal na aposentadoria</div>
                  <div style={{ fontSize: 48, fontWeight: 800, letterSpacing: '-2.5px', color: deficit ? '#F87171' : '#00D4A1', lineHeight: 1, marginBottom: 10 }}>
                    <AnimNum value={Math.round(rendaTotal)} />
                  </div>
                  {/* Progress bar */}
                  <div style={{ height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden', marginBottom: 10 }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: deficit ? 'linear-gradient(90deg,#F87171,#FBBF24)' : 'linear-gradient(90deg,#00a070,#00D4A1)', borderRadius: 3, transition: 'width 0.5s ease' }}/>
                  </div>
                  <div style={{ fontSize: 13, color: deficit ? 'rgba(248,113,113,0.8)' : 'rgba(0,212,161,0.8)' }}>
                    {deficit ? `⚠ Falta ${fmtBRL(gap)} para atingir ${fmtBRL(renda)}` : `✓ Objetivo atingido — excedente ${fmtBRL(-gap)}`}
                  </div>
                </div>

                {/* Breakdown */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                  {[
                    { label: 'INSS estimado', value: rendaINSS, color: '#60A5FA' },
                    { label: 'Investimentos', value: rendaInvest, color: '#00D4A1' },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '16px' }}>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 6, letterSpacing: 0.3 }}>{label}</div>
                      <div style={{ fontSize: 20, fontWeight: 700, color, letterSpacing: '-0.8px' }}>
                        <AnimNum value={Math.round(value)} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Patrimônio */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, marginBottom: 20 }}>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Patrimônio acumulado</span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>
                    <AnimNum value={Math.round(patrimonio)} />
                  </span>
                </div>

                <Link href="/cadastro" style={{
                  display: 'block', textAlign: 'center', padding: '16px',
                  background: 'linear-gradient(135deg, #00D4A1, #00a878)',
                  color: '#000', fontWeight: 700, fontSize: 15,
                  borderRadius: 14, textDecoration: 'none', letterSpacing: '-0.3px',
                  transition: 'opacity .2s',
                }} onMouseEnter={e => (e.currentTarget.style.opacity = '.85')} onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
                  Ver análise completa + PGBL/VGBL →
                </Link>

                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', textAlign: 'center', marginTop: 12 }}>
                  Simulação educativa · Não constitui consultoria financeira
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── FEATURES ────────────────────────────────────────── */}
      <section id="recursos" style={{ padding: '80px 24px 120px', maxWidth: 1120, margin: '0 auto' }}>
        <Reveal>
          <div style={{ textAlign: 'center', marginBottom: 72 }}>
            <p style={{ fontSize: 13, letterSpacing: 3, color: '#00D4A1', fontWeight: 600, textTransform: 'uppercase', marginBottom: 16 }}>Por que Prever</p>
            <h2 style={{ fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 800, letterSpacing: '-2.5px', color: '#fff', marginBottom: 18, lineHeight: 1.05 }}>
              Diferente de tudo<br />que existe.
            </h2>
            <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.45)', maxWidth: 520, margin: '0 auto', lineHeight: 1.6 }}>
              A maioria calcula só o INSS. Nós calculamos <span style={{ color: 'rgba(255,255,255,0.85)' }}>sua aposentadoria real</span>.
            </p>
          </div>
        </Reveal>

        <div className="features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          {[
            {
              icon: <svg width="28" height="28" fill="none" stroke="#00D4A1" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
              title: 'INSS real, sem ilusão',
              desc: 'Calculamos seu benefício com as regras pós-reforma 2019, usando a tabela atualizada 2025. Nada de estimativas otimistas dos bancos.',
              tag: 'Gratuito',
            },
            {
              icon: <svg width="28" height="28" fill="none" stroke="#00D4A1" strokeWidth="1.5" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
              title: 'INSS + Investimentos juntos',
              desc: 'O único simulador que combina previdência pública com CDB, Tesouro Direto, PGBL e VGBL num único número.',
              tag: 'Exclusivo',
            },
            {
              icon: <svg width="28" height="28" fill="none" stroke="#00D4A1" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
              title: 'Resultado em tempo real',
              desc: 'Mova os sliders e veja os números mudarem instantaneamente. Sem precisar clicar em "calcular".',
              tag: 'Grátis',
            },
            {
              icon: <svg width="28" height="28" fill="none" stroke="#00D4A1" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>,
              title: 'Análise PGBL vs VGBL',
              desc: 'Compare os dois produtos de previdência privada lado a lado e veja qual economiza mais no seu IR.',
              tag: 'Premium',
            },
          ].map(({ icon, title, desc, tag }, i) => (
            <Reveal key={title} delay={i * 0.08}>
              <div style={{
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 22, padding: '32px',
                transition: 'all .35s',
                cursor: 'default',
              }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(255,255,255,0.05)'; el.style.borderColor = 'rgba(0,212,161,0.2)'; el.style.transform = 'translateY(-3px)'; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(255,255,255,0.03)'; el.style.borderColor = 'rgba(255,255,255,0.07)'; el.style.transform = 'translateY(0)'; }}
              >
                <div style={{ marginBottom: 20 }}>{icon}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff', letterSpacing: '-0.5px' }}>{title}</h3>
                  <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 980, background: tag === 'Premium' ? 'rgba(0,212,161,0.12)' : 'rgba(255,255,255,0.07)', color: tag === 'Premium' ? '#00D4A1' : 'rgba(255,255,255,0.4)', fontWeight: 600, border: tag === 'Premium' ? '1px solid rgba(0,212,161,0.2)' : '1px solid rgba(255,255,255,0.08)' }}>{tag}</span>
                </div>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7 }}>{desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── COMPARISON ──────────────────────────────────────── */}
      <section style={{ padding: '0 24px 120px', maxWidth: 900, margin: '0 auto' }}>
        <Reveal>
          <h2 style={{ textAlign: 'center', fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 800, letterSpacing: '-2px', color: '#fff', marginBottom: 48, lineHeight: 1.05 }}>
            Prever vs. os outros
          </h2>
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 22, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 420 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    <th style={{ padding: '18px 24px', textAlign: 'left', color: 'rgba(255,255,255,0.35)', fontSize: 12, fontWeight: 500, letterSpacing: 1, textTransform: 'uppercase' }}>Funcionalidade</th>
                    {[
                      { label: 'Prever', color: '#00D4A1' },
                      { label: 'INSS.gov', color: 'rgba(255,255,255,0.35)' },
                      { label: 'Bancos', color: 'rgba(255,255,255,0.35)' },
                    ].map(({ label, color }) => (
                      <th key={label} style={{ padding: '18px 16px', textAlign: 'center', color, fontSize: 13, fontWeight: 700 }}>{label}</th>
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
                    <tr key={feat as string} style={{ borderBottom: idx < 6 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                      <td style={{ padding: '15px 24px', fontSize: 14, color: 'rgba(255,255,255,0.55)' }}>{feat as string}</td>
                      <td style={{ textAlign: 'center' }}>{p ? <span style={{ color: '#00D4A1', fontSize: 16 }}>✓</span> : <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 16 }}>—</span>}</td>
                      <td style={{ textAlign: 'center' }}>{i ? <span style={{ color: '#00D4A1', fontSize: 16 }}>✓</span> : <span style={{ color: 'rgba(255,255,255,0.2)' }}>—</span>}</td>
                      <td style={{ textAlign: 'center' }}>{b ? <span style={{ color: '#FBBF24', fontSize: 13 }}>∼</span> : <span style={{ color: 'rgba(255,255,255,0.2)' }}>—</span>}</td>
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
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <h2 style={{ fontSize: 'clamp(30px, 5vw, 52px)', fontWeight: 800, letterSpacing: '-2px', color: '#fff', marginBottom: 14, lineHeight: 1.05 }}>
              Comece grátis.<br />Evolua quando quiser.
            </h2>
            <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.4)', letterSpacing: '-0.1px' }}>Sem cartão de crédito para começar.</p>
          </div>
        </Reveal>

        <div className="pricing-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* Free */}
          <Reveal delay={0}>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: '36px 32px', height: '100%' }}>
              <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 20 }}>Gratuito</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 6 }}>
                <span style={{ fontSize: 52, fontWeight: 800, letterSpacing: '-3px', color: '#fff' }}>R$&nbsp;0</span>
              </div>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginBottom: 32 }}>para sempre</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 32 }}>
                {['Simulador INSS + investimentos', 'Resultado em tempo real', 'Sem cadastro necessário'].map(f => (
                  <div key={f} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <span style={{ color: '#00D4A1', fontSize: 16, lineHeight: 1.5, flexShrink: 0 }}>✓</span>
                    <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>{f}</span>
                  </div>
                ))}
              </div>
              <Link href="/cadastro" style={{
                display: 'block', textAlign: 'center', padding: '15px',
                border: '1px solid rgba(255,255,255,0.15)', borderRadius: 14,
                color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontWeight: 600, fontSize: 15,
                transition: 'all .2s',
              }} onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'rgba(255,255,255,0.3)'; el.style.color = '#fff'; }} onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'rgba(255,255,255,0.15)'; el.style.color = 'rgba(255,255,255,0.7)'; }}>
                Começar grátis
              </Link>
            </div>
          </Reveal>

          {/* Premium */}
          <Reveal delay={0.1}>
            <div style={{
              borderRadius: 24, padding: '36px 32px', height: '100%',
              background: 'linear-gradient(160deg, rgba(0,212,161,0.09) 0%, rgba(0,0,0,0) 60%)',
              border: '1px solid rgba(0,212,161,0.25)',
              position: 'relative', overflow: 'hidden',
              boxShadow: '0 0 60px rgba(0,212,161,0.08)',
            }}>
              <div style={{ position: 'absolute', top: 20, right: 20, background: '#00D4A1', color: '#000', fontSize: 11, fontWeight: 800, padding: '4px 12px', borderRadius: 980, letterSpacing: 0.5, textTransform: 'uppercase' }}>Popular</div>
              <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', color: '#00D4A1', marginBottom: 20 }}>Premium</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 6 }}>
                <span style={{ fontSize: 52, fontWeight: 800, letterSpacing: '-3px', color: '#fff' }}>R$&nbsp;29</span>
                <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.35)' }}>/mês</span>
              </div>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginBottom: 32 }}>cancele quando quiser</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 32 }}>
                {[
                  'Tudo do plano gratuito',
                  'Simulador PGBL vs VGBL',
                  'Plano personalizado mês a mês',
                  'Cenários "e se" (inflação, crises)',
                  'Exportar relatório em PDF',
                  'Tabelas atualizadas automaticamente',
                ].map(f => (
                  <div key={f} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <span style={{ color: '#00D4A1', fontSize: 16, lineHeight: 1.5, flexShrink: 0 }}>✓</span>
                    <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>{f}</span>
                  </div>
                ))}
              </div>
              <Link href="/cadastro?plan=premium" style={{
                display: 'block', textAlign: 'center', padding: '16px',
                background: 'linear-gradient(135deg, #00D4A1, #00a878)',
                color: '#000', fontWeight: 700, fontSize: 15,
                borderRadius: 14, textDecoration: 'none', letterSpacing: '-0.2px',
                transition: 'opacity .2s',
              }} onMouseEnter={e => (e.currentTarget.style.opacity = '.85')} onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
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
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: '28px', height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', gap: 3, marginBottom: 18 }}>
                    {Array(stars).fill(0).map((_, j) => <span key={j} style={{ color: '#FFD700', fontSize: 13 }}>★</span>)}
                  </div>
                  <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, marginBottom: 20, flex: 1 }}>"{text}"</p>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', letterSpacing: '-0.2px' }}>{name}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 3 }}>{role}</div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ── FINAL CTA ───────────────────────────────────────── */}
      <section style={{ padding: '0 24px 160px', maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
        <Reveal>
          <div style={{ position: 'relative', padding: '80px 48px', background: 'linear-gradient(160deg, rgba(0,212,161,0.08), rgba(0,0,0,0))', border: '1px solid rgba(0,212,161,0.15)', borderRadius: 32, overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 500, height: 500, background: 'radial-gradient(circle, rgba(0,212,161,0.08) 0%, transparent 70%)', pointerEvents: 'none', borderRadius: '50%' }}/>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <h2 style={{ fontSize: 'clamp(32px, 5vw, 54px)', fontWeight: 800, letterSpacing: '-2.5px', color: '#fff', marginBottom: 18, lineHeight: 1.05 }}>
                Seu futuro começa<br />
                <span style={{ background: 'linear-gradient(135deg, #00D4A1, #4ade80)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>com uma simulação.</span>
              </h2>
              <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.45)', marginBottom: 40, lineHeight: 1.6, letterSpacing: '-0.1px' }}>
                Em 2 minutos você descobre se está no caminho certo — ou o que mudar agora.
              </p>
              <Link href="/cadastro" style={{
                display: 'inline-block', padding: '18px 44px',
                background: '#fff', color: '#000',
                fontSize: 17, fontWeight: 700, borderRadius: 980,
                textDecoration: 'none', letterSpacing: '-0.3px',
                transition: 'all .25s',
                boxShadow: '0 0 0 0 rgba(255,255,255,0)',
              }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'scale(1.04)'; el.style.boxShadow = '0 0 50px rgba(255,255,255,0.2)'; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'scale(1)'; el.style.boxShadow = '0 0 0 0 rgba(255,255,255,0)'; }}
              >
                Simular minha aposentadoria
              </Link>
              <p style={{ marginTop: 18, fontSize: 13, color: 'rgba(255,255,255,0.25)', letterSpacing: 0.3 }}>Grátis · Sem cartão · 2 minutos</p>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '36px 24px 48px', maxWidth: 1120, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 26, height: 26, borderRadius: 7, background: 'linear-gradient(135deg,#00D4A1,#00a070)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: '#000' }}>P</div>
            <span style={{ fontWeight: 700, color: '#fff', fontSize: 15 }}>prever</span>
          </div>
          <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
            <Link href="/privacidade" style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', textDecoration: 'none', transition: 'color .2s' }} onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')} onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}>Privacidade</Link>
            <Link href="/termos" style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', textDecoration: 'none', transition: 'color .2s' }} onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')} onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}>Termos</Link>
            <Link href="/login" style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', textDecoration: 'none', transition: 'color .2s' }} onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')} onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}>Entrar</Link>
          </div>
        </div>
        <p style={{ marginTop: 24, fontSize: 12, color: 'rgba(255,255,255,0.18)', lineHeight: 1.7 }}>
          © 2025 Prever. Conteúdo educativo — não constitui consultoria financeira. Consulte um profissional habilitado para decisões personalizadas.
        </p>
      </footer>

      {/* ── CSS ─────────────────────────────────────────────── */}
      <style>{`
        * { -webkit-font-smoothing: antialiased; }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @media (max-width: 768px) {
          .nav-links { display: none !important; }
          .mobile-menu-btn { display: block !important; }
          .sim-grid { grid-template-columns: 1fr !important; }
          .sim-grid > div:first-child { border-right: none !important; border-bottom: 1px solid rgba(255,255,255,0.07); }
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
