# JalNetra

**AI-Powered Groundwater & Salinity Early-Warning System** — Prototype for Smart India Hackathon 2026 prep.

A district-officer dashboard that forecasts groundwater depletion and coastal salinity risk 12 months ahead with confidence bands. Built with mock/synthetic data for demo purposes; shaped for drop-in replacement with real India-WRIS, CGWB, and IMD datasets.

---

## Quick Start

```bash
# Install dependencies
npm install

# Start dev server (opens at http://localhost:3000)
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

---

## Project Structure

```
jalnetra/
├── public/
│   └── favicon.svg
├── src/
│   ├── main.tsx                 # React 18 entry point
│   ├── App.tsx                  # Router + Navbar layout
│   ├── index.css                # Tailwind + design tokens (light theme)
│   ├── data/
│   │   ├── types.ts             # API-shaped TypeScript interfaces
│   │   ├── seed.ts              # 23 real Indian districts with coords & CGWB tiers
│   │   ├── generateMockData.ts  # Procedural generator (seeded PRNG, seasonal+trend+noise)
│   │   ├── mockData.ts          # Pre-generated dataset + O(1) lookups
│   │   └── api.ts               # Mock API layer (FastAPI-shaped responses)
│   ├── lib/
│   │   ├── risk.ts              # Composite scoring + tier color/label maps
│   │   └── format.ts            # Number/date/chart formatting utilities
│   ├── hooks/
│   │   └── useMockData.ts       # React hooks for data fetching with loading states
│   ├── components/
│   │   ├── Navbar.tsx
│   │   ├── RiskBadge.tsx        # Classification, trend, salinity badges + StatCard
│   │   ├── StatsStrip.tsx       # National KPI cards
│   │   ├── map/
│   │   │   ├── IndiaChoropleth.tsx  # Leaflet map with CircleMarkers
│   │   │   ├── LayerToggle.tsx      # Drawdown ↔ Salinity layer switch
│   │   │   └── Legend.tsx           # Tier legend per layer
│   │   └── charts/
│   │       └── ForecastChart.tsx    # Recharts: historical+forecast+confidence band
│   └── pages/
│       ├── NationalOverview.tsx     # "/" — map + stats + layer toggle
│       ├── DistrictDrillDown.tsx    # "/district/:id" — charts + factors
│       ├── AlertsDashboard.tsx      # "/alerts" — sortable/filterable table
│       └── About.tsx                # "/about" — methodology + disclaimer
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
└── postcss.config.js
```

---

## Routes

| Path | Page | Purpose |
|------|------|---------|
| `/` | **National Overview** | Choropleth map, layer toggle (Drawdown/Salinity), stats strip, district click → drill-down |
| `/district/:id` | **District Drill-Down** | 5-yr history + 12-mo forecast with confidence band, contributing factors, coastal salinity chart |
| `/alerts` | **Alerts Dashboard** | Ranked table, filters (state, tier), search, manual refresh |
| `/about` | **Methodology** | Risk scoring formulas, CGWB tier definitions, data provenance disclaimer |

---

## Mock Data — How It Works

### District Coverage (23 districts)
- **Over-Exploited (6):** Sangrur, Patiala, Barnala (Punjab); Kurukshetra, Karnal, Mahendragarh (Haryana)
- **Critical (5):** Firozpur, Muktsar (Punjab); Hisar, Bhiwani (Haryana); Nagaur (Rajasthan)
- **Semi-Critical (4):** Amritsar, Ludhiana (Punjab); Jaipur, Ajmer (Rajasthan)
- **Safe (3):** Pathankot, Gurdaspur (Punjab); Shimla (HP)
- **Coastal Saline/Critical (5):** Chennai, Cuddalore, Kanchipuram, Villupuram (TN); Puducherry

### Generated Series per District
| Series | Length | Pattern |
|--------|--------|---------|
| Groundwater history | 60 months | `base + trend·t + amp·sin(2π(month-9)/12) + noise` |
| Groundwater forecast | 12 months | Continued trend + seasonal + widening confidence band |
| EC/Salinity history | 60 months (coastal) | Similar with peak pre-monsoon (May) |
| EC/Salinity forecast | 12 months (coastal) | Same pattern with confidence band |

### Regeneration
Change `DEFAULT_SEED` in `src/data/mockData.ts` or call `refreshMockData(newSeed)` to get a new deterministic dataset. The API endpoint `POST /api/refresh` simulates this in the UI.

---

## Design System

**Light theme only** (demo runs on projected laptop):

| Role | Token | Value |
|------|-------|-------|
| Ground | `--color-ground` | `#F7FAFC` |
| Surface | `--color-surface` | `#FFFFFF` |
| Hairline | `--color-hairline` | `#E2E8F0` |
| Ink (primary) | `--color-ink-primary` | `#0F2942` |
| Ink (secondary) | `--color-ink-secondary` | `#475569` |
| Accent (water) | `--color-accent` | `#0E7490` |
| CGWB Safe | `--color-cgwb-safe` | `#16A34A` |
| CGWB Semi-Critical | `--color-cgwb-semi-critical` | `#EAB308` |
| CGWB Critical | `--color-cgwb-critical` | `#F97316` |
| CGWB Over-Exploited | `--color-cgwb-over-exploited` | `#DC2626` |
| CGWB Saline | `--color-cgwb-saline` | `#7C3AED` |

Typography: **Inter** (Google Fonts) — all weights 400–800. Numeric columns use `tabular-nums`.

---

## Connecting Real Data (Future)

The mock API layer in `src/data/api.ts` returns `ApiResponse<T>` shaped exactly like a FastAPI backend:

```typescript
interface ApiResponse<T> {
  data: T;
  meta: {
    source: 'mock' | 'india-wris' | 'cgwb' | 'imd';
    generatedAt: string;
    disclaimer: string;
  };
}
```

### Drop-in replacement steps:
1. **Replace `fetchDistricts()`** → `GET /api/v1/districts` (returns `DistrictSummary[]`)
2. **Replace `fetchDistrict(id)`** → `GET /api/v1/districts/{id}` (returns `DistrictDetail`)
3. **Replace `fetchNationalStats()`** → `GET /api/v1/national-stats`
4. **Replace `refreshData()`** → `POST /api/v1/refresh` (triggers ETL)
5. Update `meta.source` to `'india-wris'` / `'cgwb'` / `'imd'`
6. Remove the mock generator files (`generateMockData.ts`, `mockData.ts`, `seed.ts`)

The React hooks (`useDistricts`, `useDistrict`, `useNationalStats`) and all UI components stay unchanged.

---

## Key Technical Decisions

| Decision | Rationale |
|----------|-----------|
| **Leaflet CircleMarkers (not polygons)** | Real district polygons are heavy; circles colored by tier give identical demo UX |
| **Seeded PRNG (mulberry32)** | Deterministic "random" data — refresh changes seed, same seed = same data |
| **Single combined chart dataset** | Historical + forecast in one Recharts `LineChart` with polygon `Area` for confidence band |
| **No Redux/Context** | 4 pages, simple prop-drilling + 3 hooks — overkill for prototype |
| **FastAPI-shaped mocks** | Zero-rewrite swap when real backend lands |

## License

Prototype for educational/hackathon use. Not for operational deployment.
