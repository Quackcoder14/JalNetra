/**
 * RechargeLayer - Leaflet layer for artificial recharge site pins.
 * Renders blue diamond CircleMarkers with interactive popups showing:
 * block name, structure type, slope, stream order, priority, and rationale.
 */

import { CircleMarker, Popup } from 'react-leaflet';
import { RechargeFeatureCollection } from '../../data/types';

interface RechargeLayerProps {
  collection: RechargeFeatureCollection;
}

const STRUCTURE_ICONS: Record<string, string> = {
  'Check Dam': '🏗️',
  'Percolation Tank': '💧',
  'Farm Pond': '🌾',
  'Recharge Shaft': '🕳️',
};

const PRIORITY_COLORS: Record<string, string> = {
  High: '#2563EB',
  Medium: '#0EA5E9',
};

export function RechargeLayer({ collection }: RechargeLayerProps) {
  return (
    <>
      {collection.features.map(feature => {
        const [lng, lat] = feature.geometry.coordinates;
        const p = feature.properties;
        const color = PRIORITY_COLORS[p.priority] ?? '#2563EB';
        const icon = STRUCTURE_ICONS[p.structure_type] ?? '📍';

        return (
          <CircleMarker
            key={p.block_id}
            center={[lat, lng]}
            radius={p.priority === 'High' ? 10 : 8}
            pathOptions={{
              fillColor: color,
              fillOpacity: 0.85,
              color: '#FFFFFF',
              weight: 2.5,
              opacity: 1,
            }}
          >
            <Popup closeButton={false} className="recharge-popup">
              <div className="p-3 min-w-[220px]">
                {/* Header */}
                <div className="flex items-start gap-2 pb-2 border-b border-hairline mb-2.5">
                  <span className="text-xl flex-shrink-0">{icon}</span>
                  <div>
                    <h4 className="font-bold text-ink-primary text-body-sm leading-tight">{p.block_name}</h4>
                    <p className="text-caption text-ink-muted">{p.district_name}</p>
                  </div>
                </div>

                {/* Priority badge */}
                <div className="mb-2.5">
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border"
                    style={{
                      backgroundColor: p.priority === 'High' ? '#EFF6FF' : '#F0F9FF',
                      borderColor: p.priority === 'High' ? '#BFDBFE' : '#BAE6FD',
                      color,
                    }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                    {p.priority} Priority — {p.structure_type}
                  </span>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-2 p-2 bg-slate-50/80 rounded-lg border border-slate-200/60 mb-2.5 text-caption">
                  <div>
                    <span className="text-ink-muted block text-[10px]">Slope</span>
                    <span className="font-bold text-ink-primary tabular-nums">{p.slope_pct}%</span>
                  </div>
                  <div>
                    <span className="text-ink-muted block text-[10px]">Stream Order</span>
                    <span className="font-bold text-ink-primary">{p.stream_order}</span>
                  </div>
                  <div>
                    <span className="text-ink-muted block text-[10px]">CGWB Status</span>
                    <span className="font-semibold text-ink-secondary text-[10px]">{p.cgwb_status}</span>
                  </div>
                  <div>
                    <span className="text-ink-muted block text-[10px]">Block ID</span>
                    <span className="font-mono text-[9px] text-ink-secondary">{p.block_id.slice(-8)}</span>
                  </div>
                </div>

                {/* Rationale */}
                <p className="text-[10px] text-ink-muted leading-relaxed mb-2.5">
                  <strong className="text-ink-secondary">Rationale:</strong> {p.rationale}
                </p>

                {/* Google Maps Navigation Button */}
                <a
                  href={`https://www.google.com/maps?q=${lat},${lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 w-full py-1.5 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] transition-colors shadow-2xs group"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                    <circle cx="12" cy="9" r="2.5" />
                  </svg>
                  <span>Navigate to Spot ↗</span>
                </a>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </>
  );
}
