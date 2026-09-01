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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 via-cyan-500 to-sky-400 flex items-center justify-center shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform flex-shrink-0">
              <span className="text-xl leading-none">💧</span>
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