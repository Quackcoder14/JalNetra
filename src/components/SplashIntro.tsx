/**
 * JalNetra — Opening Splash Screen
 * Clean, data-driven initialization screen that matches the app's
 * light glassmorphism + ocean-blue intelligence aesthetic.
 * No excessive gimmicks. Just the platform booting up.
 */

import { useState, useEffect } from 'react';

interface SplashIntroProps {
  onComplete: () => void;
}

const BOOT_STEPS = [
  { pct: 0,   label: 'Initializing JalNetra Intelligence Engine…' },
  { pct: 28,  label: 'Loading 138 CGWB DWLR Observation Well Stations…' },
  { pct: 55,  label: 'Connecting India-WRIS & IMD Monsoon Radar Grid…' },
  { pct: 80,  label: 'Calibrating AI Drawdown & Salinity Forecast Models…' },
  { pct: 100, label: 'All Systems Online. Ready.' },
];

export function SplashIntro({ onComplete }: SplashIntroProps) {
  const [stepIdx, setStepIdx] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    BOOT_STEPS.forEach((_, i) => {
      if (i === 0) return; // first step is default state
      timers.push(setTimeout(() => setStepIdx(i), i * 420));
    });

    // Start fade-out after last step
    timers.push(setTimeout(() => setIsFadingOut(true), BOOT_STEPS.length * 420 + 300));

    // Call onComplete after fade-out finishes
    timers.push(setTimeout(() => onComplete(), BOOT_STEPS.length * 420 + 700));

    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  const current = BOOT_STEPS[stepIdx];

  return (
    <div
      style={{ transition: 'opacity 350ms ease-out', opacity: isFadingOut ? 0 : 1 }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center pointer-events-auto"
      aria-live="polite"
      aria-label="JalNetra system initialization"
    >
      {/* Background — matches the app's body gradient exactly */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 90% 60% at 15% -5%, rgba(56,189,248,0.22) 0%, transparent 60%),
            radial-gradient(ellipse 70% 50% at 85% 10%, rgba(14,165,233,0.16) 0%, transparent 55%),
            radial-gradient(ellipse 60% 60% at 50% 50%, rgba(125,211,252,0.1) 0%, transparent 65%),
            linear-gradient(180deg, #F4F8FC 0%, #EBF3FA 100%)
          `
        }}
      />

      {/* Subtle scan line effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-sky-400/30 to-transparent animate-scan-line"
          style={{ top: '30%' }}
        />
      </div>

      {/* ── Main Content Card ── */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-sm w-full">

        {/* Logo */}
        <div className="relative mb-8">
          {/* Outer glow ring */}
          <div className="absolute inset-0 -m-3 rounded-full border border-sky-400/20 animate-pulse" />
          <div className="absolute inset-0 -m-7 rounded-full border border-sky-300/10" />

          <div className="w-20 h-20 rounded-2xl bg-white border border-slate-200/80 shadow-elevated flex items-center justify-center relative">
            {/* Inner shimmer */}
            <div className="absolute inset-0 rounded-2xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-sky-50 to-cyan-50/60" />
            </div>
            <svg
              className="w-10 h-10 relative z-10"
              viewBox="0 0 40 40"
              fill="none"
              aria-hidden="true"
            >
              {/* Water drop */}
              <path
                d="M20 4C20 4 8 16 8 24C8 30.627 13.373 36 20 36C26.627 36 32 30.627 32 24C32 16 20 4 20 4Z"
                fill="url(#dropGrad)"
              />
              {/* Ripple lines inside drop */}
              <path d="M13 26C13.8 23 16.5 21 20 21" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.7"/>
              <defs>
                <linearGradient id="dropGrad" x1="8" y1="4" x2="32" y2="36" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#0EA5E9" />
                  <stop offset="100%" stopColor="#0369A1" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Platform name */}
        <div className="mb-1">
          <h1 className="text-4xl font-black tracking-tight text-ink-primary">
            JalNetra
          </h1>
          <p className="text-xs font-bold tracking-[0.15em] uppercase text-ink-muted mt-1">
            National Groundwater Intelligence Network
          </p>
        </div>

        {/* Divider */}
        <div className="w-16 h-px bg-gradient-to-r from-transparent via-accent to-transparent my-5 opacity-40" />

        {/* Status line */}
        <p className="text-xs font-mono text-ink-muted mb-5 min-h-[1.2rem] transition-all duration-300">
          {current.label}
        </p>

        {/* Progress track */}
        <div className="w-full max-w-[260px] mb-6">
          <div className="h-[3px] w-full rounded-full bg-slate-200 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-400 transition-all duration-500 ease-out"
              style={{ width: `${current.pct}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[10px] text-ink-muted font-mono">{current.pct}%</span>
            <span className="text-[10px] text-ink-muted font-mono">
              {current.pct === 100 ? '✓ Ready' : 'Loading…'}
            </span>
          </div>
        </div>

        {/* Data source badges */}
        <div className="flex items-center gap-2 flex-wrap justify-center mb-8">
          {[
            { dot: 'bg-emerald-500', text: '138 WRIS Stations' },
            { dot: 'bg-sky-500', text: 'CGWB Models' },
            { dot: 'bg-violet-500', text: 'IMD Radar' },
          ].map(({ dot, text }) => (
            <span
              key={text}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-slate-200/80 bg-white/80 text-[10px] font-semibold text-ink-secondary"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${dot} animate-pulse`} />
              {text}
            </span>
          ))}
        </div>

        {/* Skip */}
        <button
          onClick={() => {
            setIsFadingOut(true);
            setTimeout(onComplete, 300);
          }}
          className="text-xs text-ink-muted hover:text-ink-secondary font-medium transition-colors underline-offset-2 hover:underline"
        >
          Skip intro
        </button>
      </div>

      {/* Bottom attribution */}
      <div className="absolute bottom-5 text-[10px] text-ink-muted font-medium">
        Ministry of Jal Shakti, Government of India
      </div>
    </div>
  );
}
