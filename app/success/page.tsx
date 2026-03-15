'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function SuccessPage() {
  useEffect(() => {
    // Confetti effect
    const colors = ['#00D4A1', '#5EEAD4', '#FFFFFF', '#F59E0B'];
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999';
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d')!;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = Array.from({ length: 80 }, () => ({
      x: Math.random() * canvas.width,
      y: -10,
      r: Math.random() * 6 + 3,
      d: Math.random() * 2 + 1,
      color: colors[Math.floor(Math.random() * colors.length)],
      tilt: Math.random() * 10 - 5,
      tiltAngle: 0,
      tiltSpeed: 0.05 + Math.random() * 0.05,
    }));

    let frame = 0;
    const interval = setInterval(() => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.tiltAngle += p.tiltSpeed;
        p.y += p.d;
        p.tilt = Math.sin(p.tiltAngle) * 12;
        ctx.beginPath();
        ctx.fillStyle = p.color;
        ctx.ellipse(p.x + p.tilt, p.y, p.r, p.r * 0.4, p.tiltAngle, 0, Math.PI * 2);
        ctx.fill();
        if (p.y > canvas.height) { p.y = -10; p.x = Math.random() * canvas.width; }
      });
      frame++;
      if (frame > 180) { clearInterval(interval); canvas.remove(); }
    }, 16);

    return () => { clearInterval(interval); canvas.remove(); };
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: '20px' }}>
      <div style={{ textAlign: 'center', maxWidth: 480 }}>
        <div style={{ fontSize: 64, marginBottom: 24 }}>🎉</div>
        <h1 style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-1px', marginBottom: 12 }}>
          Bem-vindo ao <span className="text-gradient">Prever Premium!</span>
        </h1>
        <p style={{ fontSize: 17, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 32 }}>
          Sua assinatura está ativa. Agora você tem acesso completo ao simulador PGBL/VGBL, cenários personalizados e muito mais.
        </p>
        <Link href="/dashboard" className="btn-emerald" style={{ display: 'inline-block', padding: '16px 36px', fontSize: 16, borderRadius: 14, textDecoration: 'none', fontWeight: 700 }}>
          Ir para meu dashboard →
        </Link>
        <p style={{ marginTop: 16, fontSize: 13, color: 'var(--text-muted)' }}>
          Dúvidas? <a href="mailto:suporte@prever.app" style={{ color: 'var(--emerald)', textDecoration: 'none' }}>suporte@prever.app</a>
        </p>
      </div>
    </div>
  );
}
