'use client';
import { useRef, useEffect } from 'react';

export default function DraggableRange({ min, max, step, value, onChange, className, style, ...props }) {
  const inputRef = useRef(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => { onChangeRef.current = onChange; });

  // Update CSS custom property for track fill
  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    const minV = parseFloat(min) || 0;
    const maxV = parseFloat(max) || 100;
    const val = parseFloat(value) || 0;
    const pct = ((val - minV) / (maxV - minV)) * 100;
    input.style.setProperty('--pct', `${pct}%`);
  }, [value, min, max]);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    function computeValue(clientX) {
      const rect = input.getBoundingClientRect();
      const minV = parseFloat(input.min) || 0;
      const maxV = parseFloat(input.max) || 100;
      const stepV = parseFloat(input.step) || 1;
      let pct = (clientX - rect.left) / rect.width;
      pct = Math.max(0, Math.min(1, pct));
      let v = minV + pct * (maxV - minV);
      v = Math.round(v / stepV) * stepV;
      return Math.max(minV, Math.min(maxV, v));
    }

    function onPointerDown(e) {
      input.setPointerCapture(e.pointerId);
      const v = computeValue(e.clientX);
      onChangeRef.current?.({ target: { value: String(v) } });
    }

    function onPointerMove(e) {
      if (!input.hasPointerCapture(e.pointerId)) return;
      e.preventDefault();
      const v = computeValue(e.clientX);
      onChangeRef.current?.({ target: { value: String(v) } });
    }

    input.addEventListener('pointerdown', onPointerDown, { passive: true });
    input.addEventListener('pointermove', onPointerMove, { passive: false });

    return () => {
      input.removeEventListener('pointerdown', onPointerDown);
      input.removeEventListener('pointermove', onPointerMove);
    };
  }, []);

  return (
    <input
      ref={inputRef}
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={onChange}
      className={className}
      style={style}
      {...props}
    />
  );
}
