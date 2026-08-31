/**
 * JalNetra - National Telemetry Map
 * High-performance pan-India groundwater monitoring network with:
 * - CARTO Voyager Basemap with authenticated API key (Zero watermark)
 * - Pointers across all 28 States & 8 Union Territories
 * - Dynamic District Search Bar with auto-complete & smooth fly-to navigation
 * - Hover & click interactive telemetry markers with risk-tier aura
 * - Artificial recharge candidate site layer across all Indian zones
 */

import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip, useMapEvents } from 'react-leaflet';
import { DistrictSummary, RechargeFeatureCollection } from '../../data/types';
import { getTierColor } from '../../lib/risk';
import { RechargeLayer } from './RechargeLayer';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix leaflet default icon issues
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Authenticated CARTO Voyager Basemap (No Watermark)
const CARTO_API_KEY = 'cb1_2iyp_1_e7fdb5e82d3e9b8e5733a64b';
const CARTO_VOYAGER_URL = `https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=${CARTO_API_KEY}`;

function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMapEvents({});
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.2, easeLinearity: 0.3 });
  }, [center, zoom, map]);
  return null;
}

interface IndiaChoroplethProps {
  districts: DistrictSummary[];
  activeLayer: 'drawdown' | 'salinity';
  selectedDistrictId?: string | null;
  onDistrictClick: (id: string) => void;
  onDistrictDoubleClick?: (id: string) => void;
  isInfoMinimised?: boolean;
  className?: string;
  rechargeCollection?: RechargeFeatureCollection | null;
  showRechargeLayer?: boolean;
}

export function IndiaChoropleth({
  districts,
  activeLayer,
  selectedDistrictId,
  onDistrictClick,
  onDistrictDoubleClick,
  isInfoMinimised: _isInfoMinimised = false,
  className = '',
  rechargeCollection = null,
  showRechargeLayer = false,
}: IndiaChoroplethProps) {
  const navigate = useNavigate();
  const mapRef = useRef<L.Map | null>(null);
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [displayFilter, setDisplayFilter] = useState<'all' | 'critical'>('all');

  const DEFAULT_CENTER: [number, number] = [22.8, 79.6];
  const DEFAULT_ZOOM = 5;

  const [mapCenter, setMapCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [mapZoom, setMapZoom] = useState<number>(DEFAULT_ZOOM);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Center map on selected district
  useEffect(() => {
    if (selectedDistrictId) {
      const d = districts.find(x => x.id === selectedDistrictId);
      if (d) {
        setMapCenter([d.lat, d.lng]);
        setMapZoom(7.5);
      }
    }
  }, [selectedDistrictId, districts]);

  // Search filter
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return districts
      .filter(d => d.name.toLowerCase().includes(q) || d.state.toLowerCase().includes(q))
      .slice(0, 8);
  }, [districts, searchQuery]);

  const handleSelectSearchResult = (district: DistrictSummary) => {
    setSearchQuery('');
    setIsSearchOpen(false);
    setMapCenter([district.lat, district.lng]);
    setMapZoom(8);
    onDistrictClick(district.id);
  };

  // Filtered districts to display
  const visibleDistricts = useMemo(() => {
    if (displayFilter === 'critical') {
      return districts.filter(d => ['Over-Exploited', 'Critical', 'Saline'].includes(d.cgwbClassification));
    }
    return districts;
  }, [districts, displayFilter]);

  if (!mounted) {
    return (
      <div className={`relative h-[460px] sm:h-[580px] lg:h-[620px] w-full rounded-2xl glass-card flex items-center justify-center ${className}`}>
        <div className="flex flex-col items-center gap-3 text-ink-muted">
          <div className="w-10 h-10 border-3 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-body-sm font-semibold">Initializing JalNetra India Telemetry Map…</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative h-[460px] sm:h-[580px] lg:h-[620px] w-full rounded-2xl overflow-hidden glass-card shadow-elevated border border-white/90 ${className}`}>
      {/* ── Search & Filter Control Bar (Top) ── */}
      <div className="absolute top-3.5 left-3.5 right-3.5 z-[400] flex flex-wrap items-center justify-between gap-2.5 pointer-events-none">
        {/* Left: District Search Bar */}
        <div className="relative pointer-events-auto w-72 sm:w-84">
          <div className="glass-strong rounded-xl border border-white/90 shadow-md flex items-center px-3 py-1.5 focus-within:ring-2 focus-within:ring-accent transition-all">
            <svg className="w-4 h-4 text-ink-muted mr-2 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Search district or state (e.g. Sangrur, Chennai, Jaipur)…"
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              className="w-full bg-transparent text-xs font-semibold text-ink-primary placeholder:text-ink-muted/70 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setIsSearchOpen(false);
                }}
                className="text-ink-muted hover:text-ink-primary p-0.5"
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {isSearchOpen && searchResults.length > 0 && (
            <div className="absolute top-full mt-1.5 left-0 right-0 bg-white/95 backdrop-blur-md rounded-xl border border-slate-200 shadow-xl overflow-hidden z-50 max-h-64 overflow-y-auto">
              {searchResults.map(d => {
                const color = getTierColor(d.cgwbClassification);
                return (
                  <button
                    key={d.id}
                    onClick={() => handleSelectSearchResult(d)}
                    className="w-full px-3.5 py-2.5 text-left hover:bg-sky-50 flex items-center justify-between border-b border-slate-100 last:border-0 transition-colors"
                  >
                    <div>
                      <span className="font-bold text-xs text-ink-primary block">{d.name}</span>
                      <span className="text-[11px] text-ink-muted">{d.state}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold tabular-nums text-slate-700">{d.latestGwLevel.toFixed(1)}m</span>
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-xs"
                        style={{ backgroundColor: color }}
                      >
                        {d.cgwbClassification}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Layer Indicator & Filter Switch */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Filter toggle */}
          <div className="glass-pill p-1 rounded-xl flex items-center gap-1 shadow-md border border-white/90">
            <button
              onClick={() => setDisplayFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-caption font-bold transition-all ${
                displayFilter === 'all' ? 'bg-accent text-white shadow-xs' : 'text-ink-secondary hover:text-ink-primary'
              }`}
            >
              🇮🇳 All ({districts.length})
            </button>
            <button
              onClick={() => setDisplayFilter('critical')}
              className={`px-2.5 py-1 rounded-lg text-caption font-bold transition-all ${
                displayFilter === 'critical' ? 'bg-red-600 text-white shadow-xs' : 'text-ink-secondary hover:text-ink-primary'
              }`}
            >
              ⚠️ High Risk
            </button>
          </div>

          <div className="glass-pill px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-md border border-white/90">
            <span
              className="w-2.5 h-2.5 rounded-full animate-ping"
              style={{ backgroundColor: activeLayer === 'drawdown' ? 'var(--color-accent)' : '#7C3AED' }}
            />
            <span className="text-caption font-bold text-ink-primary hidden sm:inline">
              {activeLayer === 'drawdown' ? 'DWLR Telemetry Network' : 'Coastal Salinity Layer'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Main Leaflet Map ── */}
      <MapContainer
        ref={mapRef}
        center={mapCenter}
        zoom={mapZoom}
        zoomControl={false}
        scrollWheelZoom={true}
        doubleClickZoom={false}
        touchZoom={true}
        style={{ height: '100%', width: '100%' }}
        aria-label="JalNetra National Groundwater Telemetry Map"
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a> &amp; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url={CARTO_VOYAGER_URL}
          maxZoom={18}
          minZoom={4}
        />

        <MapController center={mapCenter} zoom={mapZoom} />

        {/* ── Telemetry Station Pointers ── */}
        {visibleDistricts.map(district => {
          const isSelected = selectedDistrictId === district.id;
          const isHovered = hoveredId === district.id;
          const tierColor = getTierColor(district.cgwbClassification);
          const isCoastalSaline = activeLayer === 'salinity' && district.isCoastal;
          const markerColor = isCoastalSaline ? '#7C3AED' : tierColor;

          const radius = isSelected ? 15 : isHovered ? 13 : 8;

          return (
            <CircleMarker
              key={district.id}
              center={[district.lat, district.lng]}
              radius={radius}
              pathOptions={{
                fillColor: markerColor,
                fillOpacity: isSelected ? 0.95 : isHovered ? 0.90 : 0.75,
                color: isSelected ? '#0F172A' : '#FFFFFF',
                weight: isSelected ? 3.5 : isHovered ? 2.5 : 1.5,
              }}
              eventHandlers={{
                click: () => onDistrictClick(district.id),
                dblclick: (e) => {
                  L.DomEvent.stopPropagation(e);
                  if (onDistrictDoubleClick) onDistrictDoubleClick(district.id);
                },
                mouseover: () => setHoveredId(district.id),
                mouseout: () => setHoveredId(null),
              }}
            >
              <Tooltip direction="top" offset={[0, -10]} opacity={0.95}>
                <div className="p-1.5 text-xs min-w-[160px]">
                  <div className="flex items-center justify-between gap-2 border-b pb-1 mb-1">
                    <span className="font-extrabold text-ink-primary">{district.name}</span>
                    <span className="text-[10px] text-ink-muted">{district.state}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-bold" style={{ color: markerColor }}>
                    <span>{district.cgwbClassification}</span>
                    <span>{district.latestGwLevel.toFixed(1)}m GW</span>
                  </div>
                </div>
              </Tooltip>

              <Popup closeButton={false}>
                <div className="p-2 min-w-[180px]">
                  <h4 className="font-extrabold text-ink-primary text-xs">{district.name} ({district.state})</h4>
                  <p className="text-[11px] font-bold mt-1" style={{ color: markerColor }}>
                    {district.cgwbClassification} • {district.latestGwLevel.toFixed(1)}m mbgl
                  </p>
                  <p className="text-[10px] text-ink-secondary mt-0.5">
                    Trend: <span className="font-semibold capitalize">{district.gwTrend}</span> • Rainfall Deficit: <span className="font-semibold">{district.rainfallDeficitPct}%</span>
                  </p>
                  <div className="mt-2.5 flex flex-col gap-1.5">
                    <button
                      onClick={() => onDistrictClick(district.id)}
                      className="w-full px-2 py-1.5 bg-accent hover:bg-accent-dark text-white text-[11px] font-bold rounded-lg shadow-2xs transition-all"
                    >
                      Select Station
                    </button>
                    <button
                      onClick={() => navigate(`/district/${district.id}`)}
                      className="w-full text-center px-2 py-1 bg-slate-100 hover:bg-slate-200 text-ink-primary text-[10px] font-bold rounded-lg transition-colors"
                    >
                      View Full Analysis →
                    </button>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

        {/* Artificial Recharge Candidates Layer */}
        {showRechargeLayer && rechargeCollection && (
          <RechargeLayer collection={rechargeCollection} />
        )}
      </MapContainer>

      {/* ── Bottom Controls & Legend Summary ── */}
      <div className="absolute bottom-3 left-3 z-[400] hidden sm:flex items-center gap-2">
        <div className="glass-pill px-3 py-1.5 rounded-xl text-caption text-ink-secondary shadow-sm flex items-center gap-2 border border-white/80">
          <span className="text-accent font-bold">📍 Coverage:</span>
          <span>{districts.length} Telemetry Stations across India • Click any pointer to inspect</span>
        </div>
      </div>

      {/* Zoom and Reset Controls */}
      <div className="absolute bottom-3 right-3 z-[400] flex flex-col gap-1.5">
        <button
          onClick={() => mapRef.current?.zoomIn()}
          className="w-9 h-9 glass-strong rounded-xl flex items-center justify-center text-ink-primary hover:text-accent hover:bg-white transition-all shadow-md"
          title="Zoom in"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
        <button
          onClick={() => mapRef.current?.zoomOut()}
          className="w-9 h-9 glass-strong rounded-xl flex items-center justify-center text-ink-primary hover:text-accent hover:bg-white transition-all shadow-md"
          title="Zoom out"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M5 12h14" />
          </svg>
        </button>
        <button
          onClick={() => {
            setMapCenter(DEFAULT_CENTER);
            setMapZoom(DEFAULT_ZOOM);
          }}
          className="w-9 h-9 glass-strong rounded-xl flex items-center justify-center text-ink-primary hover:text-accent hover:bg-white transition-all shadow-md"
          title="Reset to All-India View"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
        </button>
      </div>
    </div>
  );
}
