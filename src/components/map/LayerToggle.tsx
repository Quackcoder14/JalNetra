/**
 * Layer toggle control for switching between Drawdown Risk and Salinity Risk map views.
 * Glassmorphic segmented pill control with smooth transitions.
 */

import { LAYER_TYPES, LayerType } from '../../data/types';
import { useEffect } from 'react';
import anime from 'animejs';

interface LayerToggleProps {
  activeLayer: LayerType['id'];
  onChange: (layer: LayerType['id']) => void;
  disabled?: boolean;
}

export function LayerToggle({ activeLayer, onChange, disabled = false }: LayerToggleProps) {
  useEffect(() => {
    anime({
      targets: '.layer-toggle-option',
      opacity: [0, 1],
      translateY: [6, 0],
      delay: anime.stagger(50),
      duration: 350,
      easing: 'easeOutQuad',
    });
  }, []);

  return (
    <div
      className="inline-flex items-center gap-1.5 p-1.5 glass rounded-xl shadow-card border border-white/90"
      role="radiogroup"
      aria-label="Map layer selection"
    >
      {LAYER_TYPES.map(layer => {
        const isActive = activeLayer === layer.id;
        const icon = layer.id === 'drawdown' ? '💧' : '🌊';

        return (
          <button
            key={layer.id}
            onClick={() => !disabled && onChange(layer.id)}
            disabled={disabled}
            className={`layer-toggle-option relative flex items-center gap-2 px-3.5 py-2 rounded-lg text-body-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
              isActive
                ? 'bg-gradient-to-r from-sky-600 to-cyan-600 text-white shadow-md shadow-sky-500/20'
                : 'text-ink-secondary hover:text-ink-primary hover:bg-white/60'
            }`}
            role="radio"
            aria-checked={isActive}
            aria-disabled={disabled}
          >
            <span>{icon}</span>
            <span className="relative z-10">{layer.label}</span>
            {isActive && (
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            )}
          </button>
        );
      })}
    </div>
  );
}