'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '../lib/supabase';
import DraggableRange from '../components/DraggableRange';

// ─── Types ────────────────────────────────────────────────────
interface Profile { id: string; email: string; plan: string; }

// ─── Formatters ───────────────────────────────────────────────
function fmtBRL(v: number) { return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }); }
function fmtNum(v: number) { return v.toLocaleString('pt-BR', { maximumFractionDigits: 0 }); }
function fmtPct(v: number) { return `${v.toFixed(1)}%`; }

// ─── INSS 2025 ────────────────────────────────────────────────
const INSS_FAIXAS = [
  { ate: 1518.00, aliquota: 0.075 },
  { ate: 2793.88, aliquota: 0.09 },
  { ate: 4190.83, aliquota: 0.12 },
  { ate: 8157.41, aliquota: 0.14 },
];
const INSS_TETO = 8157.41;
const INSS_BENEFICIO_TETO = 7786.02;
const INSS_BENEFICIO_MIN = 1412.00;

function calcBeneficioINSS(salario: number, anosContrib: number): number {
  const base = Math.min(salario, INSS_TETO);
  const coef = Math.min(anosContrib / 35, 1);
  const beneficio = base * (0.60 + coef * 0.40);
  return Math.max(INSS_BENEFICIO_MIN, Math.min(beneficio, INSS_BENEFICIO_TETO));
}

function calcINSSContrib(salario: number) {
  let contrib = 0; let base = 0;
  for (const f of INSS_FAIXAS) {
    const topo = Math.min(salario, f.ate);
    if (topo > base) { contrib += (topo - base) * f.aliquota; base = topo; }
    if (salario <= f.ate) break;
  }
  return contrib;
}

// ─── Investment math ──────────────────────────────────────────
function calcPatrimonio(aporte: number, anos: number, taxaAnual: number, inicial = 0) {
  const tm = Math.pow(1 + taxaAnual, 1 / 12) - 1;
  const m = anos * 12;
  return inicial * Math.pow(1 + tm, m) + aporte * ((Math.pow(1 + tm, m) - 1) / tm);
}

function calcRendaMensal(patrimonio: number, taxaAnual: number, anosRetiro: number) {
  if (anosRetiro <= 0 || patrimonio <= 0) return 0;
  const tm = Math.pow(1 + taxaAnual, 1 / 12) - 1;
  const m = anosRetiro * 12;
  return (patrimonio * tm) / (1 - Math.pow(1 + tm, -m));
}

// ─── PGBL tax benefit ─────────────────────────────────────────
function calcBeneficioPGBL(salarioBruto: number, aporteAnual: number): number {
  const limiteDeducao = salarioBruto * 12 * 0.12;
  const deducao = Math.min(aporteAnual, limiteDeducao);
  const aliquota = salarioBruto > 4664 ? 0.275 : salarioBruto > 2824 ? 0.225 : 0.15;
  return deducao * aliquota;
}

// ─── Animated number ──────────────────────────────────────────
function AnimNum({ value, prefix = 'R$ ' }: { value: number; prefix?: string }) {
  const [disp, setDisp] = useState(value);
  const prev = useRef(value);
  useEffect(() => {
    const from = prev.current; const to = value;
    if (from === to) return;
    const dur = 400; const start = performance.now();
    let raf: number;
    function tick(now: number) {
      const t = Math.min((now - start) / dur, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setDisp(Math.round(from + (to - from) * ease));
      if (t < 1) raf = requestAnimationFrame(tick); else prev.current = to;
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <span>{prefix}{fmtNum(disp)}</span>;
}

// ─── Slider row ───────────────────────────────────────────────
function SRow({ label, value, min, max, step, onChange, fmt }: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; fmt: (v: number) => string;
}) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{label}</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{fmt(value)}</span>
      </div>
      <DraggableRange min={min} max={max} step={step} value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(Number(e.target.value))}
        className="" style={{}} />
    </div>
  );
}

// ─── MAIN DASHBOARD ───────────────────────────────────────────
export default function Dashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'basico' | 'investimentos' | 'pgbl'>('basico');
  const router = useRouter();
  const supabase = createClient();

  // Simulator state
  const [idade, setIdade] = useState(35);
  const [idadeApos, setIdadeApos] = useState(65);
  const [salario, setSalario] = useState(6000);
  const [renda, setRenda] = useState(10000);
  const [aporte, setAporte] = useState(1000);
  const [patrimonioAtual, setPatrimonioAtual] = useState(30000);
  const [taxaRetorno, setTaxaRetorno] = useState(10);
  const [inflacao, setInflacao] = useState(4.5);
  const [anosRetiro, setAnosRetiro] = useState(25);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return; }
      supabase.from('profiles').select('*').eq('id', user.id).single()
        .then(({ data }) => { setProfile(data); setLoading(false); });
    });
  }, []);

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTopColor: 'var(--emerald)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }}/>
        <p style={{ color: 'var(--text-muted)' }}>Carregando...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );

  const anos = Math.max(idadeApos - idade, 1);
  const anosContrib = anos;
  const TAXA_REAL = (taxaRetorno - inflacao) / 100;
  const TAXA_RETIRO = 0.06;

  const beneficioINSS = calcBeneficioINSS(salario, anosContrib);
  const contrib = calcINSSContrib(salario);
  const patrimonio = calcPatrimonio(aporte, anos, TAXA_REAL, patrimonioAtual);
  const rendaInvest = calcRendaMensal(patrimonio, TAXA_RETIRO, anosRetiro);
  const rendaTotal = beneficioINSS + rendaInvest;
  const gap = renda - rendaTotal;
  const deficit = gap > 0;
  const pctCob = Math.min((rendaTotal / renda) * 100, 100);
  const isPremium = profile?.plan === 'premium';

  // PGBL calc
  const aporteAnualPGBL = aporte * 12;
  const beneficioPGBL = calcBeneficioPGBL(salario, aporteAnualPGBL);
  const patrimonioComPGBL = calcPatrimonio(aporte * 1.1, anos, TAXA_REAL, patrimonioAtual);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/');
  }

  async function handleUpgrade() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: 'premium', userId: user.id }),
    });
    const { url } = await res.json();
    if (url) window.location.href = url;
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* NAV */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(8,12,20,0.92)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--emerald)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 13, color: '#020A06' }}>P</div>
            <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)' }}>prever</span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {!isPremium && (
              <button onClick={handleUpgrade} className="btn-emerald" style={{ padding: '7px 16px', fontSize: 13, border: 'none', cursor: 'pointer', borderRadius: 8 }}>
                ⚡ Premium
              </button>
            )}
            {isPremium && (
              <span style={{ fontSize: 12, padding: '4px 10px', background: 'rgba(0,212,161,0.1)', border: '1px solid rgba(0,212,161,0.25)', borderRadius: 100, color: 'var(--emerald)', fontWeight: 700 }}>✨ Premium</span>
            )}
            <button onClick={handleLogout} style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: 13, padding: '7px 14px', borderRadius: 8, cursor: 'pointer' }}>
              Sair
            </button>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 20px' }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 4 }}>Minha Simulação</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Ajuste os valores para ver sua aposentadoria em tempo real.</p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, padding: 4, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, width: 'fit-content' }}>
          {(['basico', 'investimentos', 'pgbl'] as const).map(tab => {
            const labels: Record<string, string> = { basico: '📊 Básico', investimentos: '📈 Investimentos', pgbl: '🏦 PGBL/VGBL' };
            const active = activeTab === tab;
            const locked = tab !== 'basico' && !isPremium;
            return (
              <button key={tab} onClick={() => locked ? handleUpgrade() : setActiveTab(tab)}
                style={{ padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: active ? 700 : 500, background: active ? 'var(--emerald)' : 'transparent', color: active ? '#020A06' : locked ? 'var(--text-muted)' : 'var(--text-secondary)', transition: 'all 0.15s' }}>
                {labels[tab]}{locked ? ' 🔒' : ''}
              </button>
            );
          })}
        </div>

        {/* Main grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>

          {/* LEFT — inputs */}
          <div className="glass" style={{ borderRadius: 20, padding: '24px' }}>
            <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--emerald)', marginBottom: 24 }}>
              {activeTab === 'basico' ? 'Seus dados' : activeTab === 'investimentos' ? 'Parâmetros de investimento' : 'Previdência Privada'}
            </p>

            {activeTab === 'basico' && <>
              <SRow label="Sua idade" value={idade} min={18} max={60} step={1} onChange={setIdade} fmt={v => `${v} anos`} />
              <SRow label="Aposentar com" value={idadeApos} min={idade + 5} max={75} step={1} onChange={setIdadeApos} fmt={v => `${v} anos`} />
              <SRow label="Salário bruto mensal" value={salario} min={1412} max={30000} step={200} onChange={setSalario} fmt={fmtBRL} />
              <SRow label="Renda desejada na aposentadoria" value={renda} min={2000} max={50000} step={500} onChange={setRenda} fmt={fmtBRL} />
              <SRow label="Investimento mensal atual" value={aporte} min={0} max={10000} step={100} onChange={setAporte} fmt={fmtBRL} />
            </>}

            {activeTab === 'investimentos' && <>
              <SRow label="Taxa de retorno esperada (a.a.)" value={taxaRetorno} min={4} max={20} step={0.5} onChange={setTaxaRetorno} fmt={fmtPct} />
              <SRow label="Inflação estimada (a.a.)" value={inflacao} min={2} max={10} step={0.5} onChange={setInflacao} fmt={fmtPct} />
              <SRow label="Patrimônio atual investido" value={patrimonioAtual} min={0} max={500000} step={5000} onChange={setPatrimonioAtual} fmt={fmtBRL} />
              <SRow label="Anos de aposentadoria (duração)" value={anosRetiro} min={10} max={40} step={5} onChange={setAnosRetiro} fmt={v => `${v} anos`} />
              <div style={{ padding: '14px', background: 'rgba(0,212,161,0.05)', border: '1px solid rgba(0,212,161,0.15)', borderRadius: 10, marginTop: 8 }}>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  📊 Taxa real: <strong style={{ color: 'var(--emerald)' }}>{fmtPct(taxaRetorno - inflacao)}</strong> a.a.<br/>
                  Referência: CDI médio histórico ≈ 10-12% a.a.
                </p>
              </div>
            </>}

            {activeTab === 'pgbl' && <>
              <div style={{ marginBottom: 20, padding: '16px', background: 'rgba(0,212,161,0.05)', border: '1px solid rgba(0,212,161,0.15)', borderRadius: 12 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>PGBL vs VGBL — qual escolher?</h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 10 }}>
                  <strong style={{ color: 'var(--text)' }}>PGBL:</strong> Deduz até 12% da renda bruta anual no IR. Ideal se você faz declaração completa.
                </p>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  <strong style={{ color: 'var(--text)' }}>VGBL:</strong> Sem dedução anual, mas IR só sobre os rendimentos no resgate. Ideal para declaração simplificada.
                </p>
              </div>
              <SRow label="Salário bruto mensal" value={salario} min={1412} max={30000} step={200} onChange={setSalario} fmt={fmtBRL} />
              <SRow label="Aporte mensal em previdência" value={aporte} min={50} max={10000} step={50} onChange={setAporte} fmt={fmtBRL} />

              <div style={{ padding: '14px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10, marginTop: 8 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#F59E0B', marginBottom: 4 }}>💰 Economia no IR (PGBL)</p>
                <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>{fmtBRL(beneficioPGBL)}/ano</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  Dedução: {fmtBRL(Math.min(aporteAnualPGBL, salario * 12 * 0.12))}/ano (limite 12% renda)
                </p>
              </div>
            </>}
          </div>

          {/* RIGHT — results */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Main result */}
            <div className="result-card" style={{ padding: '24px' }}>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 }}>Renda mensal na aposentadoria</div>
              <div style={{ fontSize: 48, fontWeight: 900, letterSpacing: '-2px', color: deficit ? '#F87171' : 'var(--emerald)', lineHeight: 1, marginBottom: 8 }}>
                <AnimNum value={Math.round(rendaTotal)} />
              </div>
              <div style={{ fontSize: 14, color: deficit ? '#F87171' : 'var(--text-secondary)' }}>
                {deficit ? `⚠️ Falta ${fmtBRL(gap)} para atingir ${fmtBRL(renda)}` : `✅ Objetivo atingido! Excedente: ${fmtBRL(Math.abs(gap))}`}
              </div>

              {/* Progress bar */}
              <div style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Cobertura do objetivo</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: deficit ? '#F87171' : 'var(--emerald)' }}>{Math.round(pctCob)}%</span>
                </div>
                <div style={{ height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pctCob}%`, background: deficit ? 'linear-gradient(90deg, #F87171, #FBBF24)' : 'linear-gradient(90deg, var(--emerald-dark), var(--emerald))', borderRadius: 4, transition: 'width 0.4s ease' }}/>
                </div>
              </div>
            </div>

            {/* Breakdown cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { label: '🏛️ INSS', value: beneficioINSS, sub: `Contrib: ${fmtBRL(contrib)}/mês` },
                { label: '📈 Investimentos', value: rendaInvest, sub: `Patrimônio: ${fmtBRL(patrimonio)}` },
              ].map(({ label, value, sub }) => (
                <div key={label} className="glass" style={{ borderRadius: 14, padding: '16px' }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>{label}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px' }}>
                    <AnimNum value={Math.round(value)} />
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{sub}</div>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="glass" style={{ borderRadius: 16, padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {[
                { label: 'Anos até aposentar', value: `${anos} anos` },
                { label: 'Patrimônio final', value: fmtBRL(patrimonio) },
                { label: 'Taxa real', value: fmtPct(taxaRetorno - inflacao) },
              ].map(({ label, value }) => (
                <div key={label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--emerald)' }}>{value}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>{label}</div>
                </div>
              ))}
            </div>

            {/* PGBL extra result */}
            {activeTab === 'pgbl' && isPremium && (
              <div style={{ padding: '18px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 14 }}>
                <p style={{ fontSize: 13, color: '#F59E0B', fontWeight: 700, marginBottom: 12 }}>📊 Impacto do PGBL no longo prazo</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Sem PGBL</div>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>{fmtBRL(patrimonio)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Com PGBL (reinvestindo economia IR)</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#F59E0B' }}>{fmtBRL(patrimonioComPGBL)}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Upgrade CTA if free */}
            {!isPremium && (
              <div style={{ padding: '20px', background: 'linear-gradient(135deg, rgba(0,212,161,0.08), rgba(139,92,246,0.06))', border: '1px solid rgba(0,212,161,0.2)', borderRadius: 16, textAlign: 'center' }}>
                <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>⚡ Desbloqueie análise completa</p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.5 }}>
                  Compare PGBL vs VGBL, simule cenários de inflação, exporte PDF com seu plano personalizado.
                </p>
                <button onClick={handleUpgrade} className="btn-emerald" style={{ padding: '12px 24px', fontSize: 14, border: 'none', cursor: 'pointer', borderRadius: 10 }}>
                  Assinar Premium — R$29/mês →
                </button>
              </div>
            )}

            <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.5 }}>
              Simulação educativa. Não constitui consultoria financeira. Valores baseados em tabelas INSS 2025.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
