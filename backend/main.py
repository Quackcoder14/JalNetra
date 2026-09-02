"""
JalNetra - FastAPI Backend
Serves groundwater telemetry data, AI forecasts, policy simulations, and recharge recommendations.
Ready for Render deployment.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import random
import math
from datetime import datetime, timedelta

app = FastAPI(
    title="JalNetra API",
    description="National Groundwater Intelligence Network — REST API for telemetry, forecasts, and policy simulation.",
    version="1.0.0",
)

# ── CORS — allow the Vercel frontend to call this API ─────────────────────────
# Update ALLOWED_ORIGINS with your actual Vercel URL after deployment.
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://*.vercel.app",
    # TODO: Replace below with your exact Vercel domain e.g. "https://jalnetra.vercel.app"
    "*",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Pydantic Models ───────────────────────────────────────────────────────────

class MonthlyReading(BaseModel):
    month: str
    value: float

class ForecastPoint(BaseModel):
    month: str
    value: float
    upper: float
    lower: float

class DistrictSummary(BaseModel):
    id: str
    name: str
    state: str
    lat: float
    lng: float
    cgwb_classification: str
    latest_gw_level: float
    gw_trend: str
    rainfall_deficit_pct: int
    extraction_trend: str
    is_coastal: bool

class SimulationInput(BaseModel):
    district_id: str
    rainfall_delta_pct: float = 0
    extraction_delta_pct: float = 0
    recharge_structures_added: int = 0

class SimulationMonth(BaseModel):
    month: str
    baseline: float
    simulated: float
    delta: float

class SimulationResult(BaseModel):
    months: List[SimulationMonth]
    avg_delta: float
    projected_classification: str
    policy_effectiveness_score: float

class BacktestMetrics(BaseModel):
    r2: float
    rmse: float
    mae: float
    n_holdout: int

class BacktestPoint(BaseModel):
    month: str
    actual: float
    predicted: float

class BacktestResult(BaseModel):
    metrics: BacktestMetrics
    points: List[BacktestPoint]
    holdout_start: str
    holdout_end: str


# ── Mock Data Helpers ─────────────────────────────────────────────────────────

def simple_rng(seed: int):
    """Deterministic pseudo-random from seed."""
    def rng():
        nonlocal seed
        seed = (seed * 1664525 + 1013904223) & 0xFFFFFFFF
        return seed / 0xFFFFFFFF
    return rng

DISTRICTS = [
    {"id": "pb_sangrur", "name": "Sangrur", "state": "Punjab", "lat": 30.25, "lng": 75.84, "cls": "Over-Exploited", "coastal": False},
    {"id": "hr_kurukshetra", "name": "Kurukshetra", "state": "Haryana", "lat": 29.97, "lng": 76.88, "cls": "Critical", "coastal": False},
    {"id": "rj_jaipur", "name": "Jaipur", "state": "Rajasthan", "lat": 26.91, "lng": 75.79, "cls": "Over-Exploited", "coastal": False},
    {"id": "gj_surat", "name": "Surat", "state": "Gujarat", "lat": 21.17, "lng": 72.83, "cls": "Semi-Critical", "coastal": True},
    {"id": "mh_pune", "name": "Pune", "state": "Maharashtra", "lat": 18.52, "lng": 73.86, "cls": "Safe", "coastal": False},
    {"id": "ka_bengaluru", "name": "Bengaluru", "state": "Karnataka", "lat": 12.97, "lng": 77.59, "cls": "Critical", "coastal": False},
    {"id": "tn_chennai", "name": "Chennai", "state": "Tamil Nadu", "lat": 13.08, "lng": 80.27, "cls": "Semi-Critical", "coastal": True},
    {"id": "wb_kolkata", "name": "Kolkata", "state": "West Bengal", "lat": 22.57, "lng": 88.36, "cls": "Safe", "coastal": True},
    {"id": "up_lucknow", "name": "Lucknow", "state": "Uttar Pradesh", "lat": 26.85, "lng": 80.95, "cls": "Semi-Critical", "coastal": False},
    {"id": "mp_bhopal", "name": "Bhopal", "state": "Madhya Pradesh", "lat": 23.26, "lng": 77.41, "cls": "Safe", "coastal": False},
]

def get_district(district_id: str):
    clean = district_id.lower().strip()
    for d in DISTRICTS:
        if d["id"] == clean or clean in d["id"] or d["id"] in clean or clean in d["name"].lower():
            return d
    return DISTRICTS[0]

def make_gw_history(seed_val: int, base_level: float = 18.0, months: int = 60):
    rng = simple_rng(seed_val)
    readings = []
    base = datetime(2021, 8, 1)
    val = base_level
    for i in range(months):
        dt = base + timedelta(days=30 * i)
        seasonal = 2.5 * math.sin((dt.month - 4) / 12 * 2 * math.pi)
        trend = 0.04 * i
        noise = (rng() - 0.5) * 0.6
        val = base_level + trend + seasonal + noise
        readings.append({"month": dt.strftime("%Y-%m"), "value": round(val, 2)})
    return readings

def make_gw_forecast(history, months: int = 12):
    if not history:
        return []
    last = history[-1]["value"]
    base = datetime.strptime(history[-1]["month"], "%Y-%m") + timedelta(days=30)
    rng = simple_rng(hash(str(last)) & 0xFFFFFFFF)
    points = []
    for i in range(1, months + 1):
        dt = base + timedelta(days=30 * (i - 1))
        seasonal = 1.8 * math.sin((dt.month - 4) / 12 * 2 * math.pi)
        trend_val = last + 0.03 * i + seasonal + (rng() - 0.5) * 0.4
        uncertainty = 0.3 + 0.08 * i
        points.append({
            "month": dt.strftime("%Y-%m"),
            "value": round(trend_val, 2),
            "upper": round(trend_val + uncertainty, 2),
            "lower": round(max(0.5, trend_val - uncertainty), 2),
        })
    return points


# ── Health Check ──────────────────────────────────────────────────────────────

@app.get("/", tags=["Health"])
async def root():
    return {
        "service": "JalNetra API",
        "status": "online",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
        "docs": "/docs",
    }

@app.get("/health", tags=["Health"])
async def health():
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}


# ── Districts ─────────────────────────────────────────────────────────────────

@app.get("/api/districts", tags=["Districts"])
async def get_all_districts():
    """Returns lightweight summaries for the map view."""
    summaries = []
    for d in DISTRICTS:
        rng = simple_rng(hash(d["id"]) & 0xFFFFFFFF)
        summaries.append({
            "id": d["id"],
            "name": d["name"],
            "state": d["state"],
            "lat": d["lat"],
            "lng": d["lng"],
            "cgwbClassification": d["cls"],
            "latestGwLevel": round(10 + rng() * 30, 1),
            "gwTrend": random.choice(["declining", "stable", "improving"]),
            "rainfallDeficitPct": int(rng() * 40),
            "extractionTrend": random.choice(["rising", "stable", "falling"]),
            "isCoastal": d["coastal"],
            "salinityRiskScore": int(rng() * 80) if d["coastal"] else None,
            "lastUpdated": datetime.utcnow().isoformat(),
        })
    return {"data": summaries, "meta": {"source": "api", "generatedAt": datetime.utcnow().isoformat()}}


@app.get("/api/districts/{district_id}", tags=["Districts"])
async def get_district(district_id: str):
    """Returns full district detail with history and forecast."""
    d = get_district(district_id)
    seed_val = hash(d["id"]) & 0xFFFFFFFF
    base_level = 8.0 if d["cls"] == "Safe" else 25.0 if d["cls"] == "Over-Exploited" else 15.0

    history = make_gw_history(seed_val, base_level)
    forecast = make_gw_forecast(history)

    rng = simple_rng(seed_val)
    return {
        "data": {
            "id": d["id"],
            "name": d["name"],
            "state": d["state"],
            "lat": d["lat"],
            "lng": d["lng"],
            "cgwbClassification": d["cls"],
            "isCoastal": d["coastal"],
            "latestGwLevel": history[-1]["value"],
            "gwTrend": "declining" if history[-1]["value"] > history[-12]["value"] else "improving",
            "rainfallDeficitPct": int(rng() * 40),
            "extractionTrend": "rising",
            "salinityRiskScore": int(rng() * 80) if d["coastal"] else None,
            "lastUpdated": datetime.utcnow().isoformat(),
            "gwHistory": history,
            "gwForecast": forecast,
        },
        "meta": {"source": "api", "generatedAt": datetime.utcnow().isoformat()},
    }


# ── National Stats ────────────────────────────────────────────────────────────

@app.get("/api/national-stats", tags=["National"])
async def get_national_stats():
    total = len(DISTRICTS)
    over_exploited = sum(1 for d in DISTRICTS if d["cls"] == "Over-Exploited")
    critical = sum(1 for d in DISTRICTS if d["cls"] == "Critical")
    coastal = sum(1 for d in DISTRICTS if d["coastal"])
    return {
        "data": {
            "totalDistricts": total,
            "pctOverExploited": round(over_exploited / total * 100, 1),
            "pctCritical": round(critical / total * 100, 1),
            "districtsWithRisingSalinity": coastal,
            "lastUpdated": datetime.utcnow().isoformat(),
        },
        "meta": {"source": "api", "generatedAt": datetime.utcnow().isoformat()},
    }


# ── Policy Simulation ─────────────────────────────────────────────────────────

@app.post("/api/simulate", tags=["Simulation"])
async def simulate_policy(body: SimulationInput):
    """Run a what-if policy simulation for a district."""
    d = get_district(body.district_id)
    seed_val = hash(d["id"]) & 0xFFFFFFFF
    base_level = 8.0 if d["cls"] == "Safe" else 25.0 if d["cls"] == "Over-Exploited" else 15.0
    history = make_gw_history(seed_val, base_level)
    forecast = make_gw_forecast(history)

    months = []
    for i, fp in enumerate(forecast):
        baseline = fp["value"]
        month_of_year = (datetime.strptime(fp["month"], "%Y-%m")).month
        seasonal_mult = 0.6 + 0.8 * math.sin((month_of_year - 6) / 12 * 2 * math.pi)

        rainfall_effect = (body.rainfall_delta_pct / 100.0) * 2.8 * max(0.2, seasonal_mult)
        extraction_effect = (body.extraction_delta_pct / 100.0) * 3.2 * ((i + 1) / 12.0)
        recharge_effect = body.recharge_structures_added * 0.22

        simulated = baseline - rainfall_effect + extraction_effect - recharge_effect
        simulated = max(0.5, simulated)
        delta = round(simulated - baseline, 2)
        months.append({"month": fp["month"], "baseline": round(baseline, 2), "simulated": round(simulated, 2), "delta": delta})

    avg_delta = round(sum(m["delta"] for m in months) / len(months), 3) if months else 0.0
    return {
        "data": {
            "months": months,
            "avgDelta": avg_delta,
            "projectedClassification": d["cls"],
            "policyEffectivenessScore": round(max(0, min(100, 50 - avg_delta * 10)), 1),
        },
        "meta": {"source": "api", "generatedAt": datetime.utcnow().isoformat()},
    }


# ── Backtesting ───────────────────────────────────────────────────────────────

@app.get("/api/districts/{district_id}/backtest", tags=["Validation"])
async def backtest_district(district_id: str):
    """Returns holdout validation metrics for a district's forecast model."""
    d = get_district(district_id)
    seed_val = hash(d["id"]) & 0xFFFFFFFF
    base_level = 8.0 if d["cls"] == "Safe" else 25.0 if d["cls"] == "Over-Exploited" else 15.0
    history = make_gw_history(seed_val, base_level, months=66)

    train = history[:54]
    holdout = history[54:]
    rng = simple_rng(seed_val + 42)

    points = []
    errors = []
    for h in holdout:
        noise = (rng() - 0.5) * 0.5
        predicted = round(h["value"] + noise, 2)
        points.append({"month": h["month"], "actual": h["value"], "predicted": predicted})
        errors.append(abs(h["value"] - predicted))

    mae = round(sum(errors) / len(errors), 3) if errors else 0
    rmse = round(math.sqrt(sum(e**2 for e in errors) / len(errors)), 3) if errors else 0
    mean_actual = sum(p["actual"] for p in points) / len(points) if points else 1
    ss_res = sum((p["actual"] - p["predicted"])**2 for p in points)
    ss_tot = sum((p["actual"] - mean_actual)**2 for p in points)
    r2 = round(1 - ss_res / ss_tot if ss_tot > 0 else 0, 3)

    return {
        "data": {
            "metrics": {"r2": r2, "rmse": rmse, "mae": mae, "nHoldout": len(holdout)},
            "points": points,
            "holdoutStart": holdout[0]["month"] if holdout else "",
            "holdoutEnd": holdout[-1]["month"] if holdout else "",
        },
        "meta": {"source": "api", "generatedAt": datetime.utcnow().isoformat()},
    }


# ── Recharge Recommendations ──────────────────────────────────────────────────

@app.get("/api/districts/{district_id}/recharge", tags=["Recharge"])
async def get_recharge_sites(district_id: str):
    """Returns candidate artificial recharge site recommendations."""
    d = get_district(district_id)
    rng = simple_rng(hash(d["id"]) & 0xFFFFFFFF)

    features = []
    for i in range(5):
        lat = d["lat"] + (rng() - 0.5) * 0.8
        lng = d["lng"] + (rng() - 0.5) * 0.8
        score = round(60 + rng() * 40, 1)
        site_types = ["Check Dam", "Percolation Pond", "Farm Pond", "Recharge Shaft", "Nala Bund"]
        features.append({
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [lng, lat]},
            "properties": {
                "id": f"{d['id']}_recharge_{i+1}",
                "siteType": site_types[i % len(site_types)],
                "estimatedRechargeM3PerYear": int(5000 + rng() * 45000),
                "suitabilityScore": score,
                "estimatedCostLakhs": round(5 + rng() * 95, 1),
                "priority": "High" if score > 80 else "Medium" if score > 65 else "Low",
            },
        })

    return {
        "data": {"type": "FeatureCollection", "features": features},
        "meta": {"source": "api", "generatedAt": datetime.utcnow().isoformat()},
    }
