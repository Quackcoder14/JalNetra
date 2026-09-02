/**
 * JalNetra Navigation Bar
 * Clean, spacious, modern glassmorphism header with zero congestion.
 */

import { Link, useLocation } from 'react-router-dom';
import { useRefresh } from '../hooks/useMockData';

interface NavbarProps {
  onRefresh?: () => void;
}

export function Navbar({ onRefresh }: NavbarProps) {
  const location = useLocation();
  const { refreshing, triggerRefresh } = useRefresh();

  const navItems = [
    { path: '/', label: 'Overview', icon: '🗺️' },
    { path: '/simulator', label: 'Simulator', icon: '🧪' },
    { path: '/alerts', label: 'Alerts', icon: '⚠️' },
    { path: '/about', label: 'Methodology', icon: '📋' },
  ];

  const handleRefresh = async () => {
    if (onRefresh) onRefresh();
    await triggerRefresh();
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200/80 shadow-[0_2px_15px_-3px_rgba(15,41,66,0.05)]">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-2 sm:gap-4">
          
          {/* Logo / Brand */}
          <Link
            to="/"
            className="flex items-center gap-2.5 text-ink-primary focus-visible:outline-none group flex-shrink-0"
            aria-label="JalNetra Home"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 via-cyan-600 to-sky-500 p-0.5 flex items-center justify-center shadow-md shadow-sky-500/25 group-hover:scale-105 group-hover:shadow-sky-500/40 transition-all flex-shrink-0">
              <svg className="w-full h-full" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="512" height="512" rx="128" fill="url(#navBgGrad)"/>
                <circle cx="256" cy="276" r="170" stroke="#38BDF8" strokeWidth="6" strokeOpacity="0.35" strokeDasharray="16 16"/>
                <circle cx="256" cy="276" r="125" stroke="#7DD3FC" strokeWidth="8" strokeOpacity="0.45"/>
                <path d="M256 86 C256 86, 140 226, 140 316 C140 380.065, 191.935 432, 256 432 C320.065 432, 372 380.065, 372 316 C372 226, 256 86, 256 86 Z" fill="url(#navDropGrad)"/>
                <path d="M256 124 C256 124, 168 238, 168 312 C168 360.598, 207.402 400, 256 400 C274.6 400, 291.8 394.2, 306 384 C280 380, 240 354, 240 300 C240 240, 256 124, 256 124 Z" fill="#BAE6FD" fillOpacity="0.75"/>
                <circle cx="256" cy="316" r="42" fill="#0369A1" stroke="#BAE6FD" strokeWidth="10"/>
                <circle cx="256" cy="316" r="20" fill="#E0F2FE"/>
                <circle cx="248" cy="308" r="7" fill="#FFFFFF"/>
                <path d="M190 354 C206 370, 230 380, 256 380 C282 380, 306 370, 322 354" stroke="#BAE6FD" strokeWidth="8" strokeLinecap="round" strokeOpacity="0.9"/>
                <defs>
                  <linearGradient id="navBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#0284C7"/>
                    <stop offset="100%" stopColor="#0369A1"/>
                  </linearGradient>
                  <linearGradient id="navDropGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#38BDF8"/>
                    <stop offset="50%" stopColor="#0EA5E9"/>
                    <stop offset="100%" stopColor="#0284C7"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-black text-xl tracking-tight bg-gradient-to-r from-sky-900 via-sky-800 to-cyan-700 bg-clip-text text-transparent leading-none">
                  JalNetra
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-sky-100 text-sky-700 rounded border border-sky-200/70">
                  INDIA
                </span>
              </div>
              <span className="text-[10px] font-bold text-ink-muted tracking-wider uppercase leading-none mt-1 hidden sm:block">
                National Groundwater Intelligence
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Pills */}
          <div className="hidden md:flex items-center gap-1 p-1 bg-slate-100/80 rounded-xl border border-slate-200/70">
            {navItems.map(item => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-white text-accent shadow-xs'
                      : 'text-ink-secondary hover:text-ink-primary hover:bg-white/60'
                  }`}
                >
                  <span className="text-sm" aria-hidden="true">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Live Sync Button */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-ink-secondary bg-white hover:bg-slate-50 border border-slate-200/80 rounded-xl hover:shadow-xs transition-all disabled:opacity-50 focus-visible:outline-none"
              title="Sync latest live telemetry readings"
            >
              <svg
                className={`w-3.5 h-3.5 text-accent transition-transform ${refreshing ? 'animate-spin' : ''}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M23 4v6h-6" />
                <path d="M1 20v-6h6" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
              <span className="hidden sm:inline">{refreshing ? 'Syncing…' : 'Live Sync'}</span>
            </button>



            {/* Government Ministry Badge */}
            <div className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-sky-900 bg-sky-50/80 border border-sky-200/70 rounded-xl">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>MoJS • India</span>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="md:hidden border-t border-slate-200/60 py-1.5 flex items-center justify-around gap-1">
          {navItems.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-accent text-white shadow-xs'
                    : 'text-ink-secondary hover:text-ink-primary'
                }`}
              >
                <span className="text-sm">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}