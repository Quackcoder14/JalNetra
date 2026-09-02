"""
AquaSentinel / JalNetra - Database Seed Script
Populates PostgreSQL with baseline districts, 60-month groundwater telemetry, and candidate recharge sites.
Can be executed standalone or imported.
"""
import asyncio
import math
import random
from datetime import datetime, timedelta
from sqlalchemy import select, func
from database import engine, AsyncSessionLocal, Base
from models import District, GroundwaterReading, RechargeSite

DISTRICT_SEEDS = [
    {"id": "pb_sangrur",     "name": "Sangrur",     "state": "Punjab",        "lat": 30.25, "lng": 75.84, "cls": "Over-Exploited", "coastal": False, "base_level": 25.0},
    {"id": "hr_kurukshetra", "name": "Kurukshetra", "state": "Haryana",       "lat": 29.97, "lng": 76.88, "cls": "Critical",       "coastal": False, "base_level": 18.0},
    {"id": "rj_jaipur",      "name": "Jaipur",      "state": "Rajasthan",     "lat": 26.91, "lng": 75.79, "cls": "Over-Exploited", "coastal": False, "base_level": 28.0},
    {"id": "gj_surat",       "name": "Surat",       "state": "Gujarat",       "lat": 21.17, "lng": 72.83, "cls": "Semi-Critical",  "coastal": True,  "base_level": 14.0},
    {"id": "mh_pune",        "name": "Pune",        "state": "Maharashtra",   "lat": 18.52, "lng": 73.86, "cls": "Safe",           "coastal": False, "base_level": 8.0},
    {"id": "ka_bengaluru",   "name": "Bengaluru",   "state": "Karnataka",     "lat": 12.97, "lng": 77.59, "cls": "Critical",       "coastal": False, "base_level": 20.0},
    {"id": "tn_chennai",     "name": "Chennai",     "state": "Tamil Nadu",    "lat": 13.08, "lng": 80.27, "cls": "Semi-Critical",  "coastal": True,  "base_level": 12.0},
    {"id": "wb_kolkata",     "name": "Kolkata",     "state": "West Bengal",   "lat": 22.57, "lng": 88.36, "cls": "Safe",           "coastal": True,  "base_level": 7.5},
    {"id": "up_lucknow",     "name": "Lucknow",     "state": "Uttar Pradesh", "lat": 26.85, "lng": 80.95, "cls": "Semi-Critical",  "coastal": False, "base_level": 15.0},
    {"id": "mp_bhopal",      "name": "Bhopal",      "state": "Madhya Pradesh","lat": 23.26, "lng": 77.41, "cls": "Safe",           "coastal": False, "base_level": 9.0},
]

def _simple_rng(seed: int):
    def rng():
        nonlocal seed
        seed = (seed * 1664525 + 1013904223) & 0xFFFFFFFF
        return seed / 0xFFFFFFFF
    return rng

_CLIMATE_YEAR_ANOMALIES = [1.14, 1.06, 1.20, 0.84, 1.10, 1.04]

def _get_hydro_seasonal_shift(month_idx: int, is_tamil_nadu: bool) -> float:
    if is_tamil_nadu:
        recharge = math.exp(-((month_idx - 10.5) ** 2) / 2.8) * 1.55
        summer_drawdown = math.exp(-((month_idx - 7.0) ** 2) / 4.0) * 1.35
        return -recharge + summer_drawdown
    else:
        recharge = math.exp(-((month_idx - 8.2) ** 2) / 2.7) * 1.55
        summer_drawdown = math.exp(-((month_idx - 4.5) ** 2) / 3.6) * 1.35
        return -recharge + summer_drawdown

async def init_db():
    """Creates all tables if they do not exist."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

async def seed_database_if_empty():
    """Seeds database with districts, telemetry, and recharge structures if districts table is empty."""
    await init_db()
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(func.count(District.id)))
        count = result.scalar() or 0
        if count > 0:
            return False  # Already seeded

        for d_info in DISTRICT_SEEDS:
            seed_val = hash(d_info["id"]) & 0xFFFFFFFF
            rng = _simple_rng(seed_val)

            district = District(
                id=d_info["id"],
                name=d_info["name"],
                state=d_info["state"],
                lat=d_info["lat"],
                lng=d_info["lng"],
                cgwb_classification=d_info["cls"],
                is_coastal=d_info["coastal"],
                extraction_trend="rising" if d_info["cls"] in ["Critical", "Over-Exploited"] else "stable",
                gw_trend="declining" if d_info["cls"] in ["Critical", "Over-Exploited"] else "stable",
                base_level=d_info["base_level"],
            )
            session.add(district)

            # Generate 60 months of historical telemetry
            base_date = datetime(2020, 9, 1)
            is_tn = "tamil nadu" in d_info["state"].lower() or "chennai" in d_info["name"].lower()
            amp = 2.4
            trend_rate = 0.08
            prev_noise = 0.0

            for i in range(60):
                dt = base_date + timedelta(days=30 * i)
                month_idx = dt.month - 1
                year_idx = min(len(_CLIMATE_YEAR_ANOMALIES) - 1, i // 12)
                climate_factor = _CLIMATE_YEAR_ANOMALIES[year_idx]
                seasonal_delta = _get_hydro_seasonal_shift(month_idx, is_tn) * amp * climate_factor
                pumping_shock = (0.2 + rng() * 0.25) if month_idx in (0, 1, 4) else 0.0

                raw_noise = (rng() - 0.5) * 0.32
                smoothed_noise = 0.65 * prev_noise + 0.35 * raw_noise
                prev_noise = smoothed_noise

                trend_shift = trend_rate * (i / 12.0)
                val = max(0.6, round(d_info["base_level"] + trend_shift + seasonal_delta + pumping_shock + smoothed_noise, 2))

                salinity_score = int(rng() * 80) if d_info["coastal"] else None
                rainfall_deficit = int(rng() * 40)

                reading = GroundwaterReading(
                    district_id=d_info["id"],
                    month=dt.strftime("%Y-%m"),
                    value=val,
                    rainfall_deficit_pct=rainfall_deficit,
                    salinity_risk_score=salinity_score,
                )
                session.add(reading)

            # Generate candidate recharge sites
            site_types = ["Check Dam", "Percolation Pond", "Farm Pond", "Recharge Shaft", "Nala Bund"]
            for i in range(5):
                site_lat = d_info["lat"] + (rng() - 0.5) * 0.8
                site_lng = d_info["lng"] + (rng() - 0.5) * 0.8
                score = round(60 + rng() * 40, 1)
                site = RechargeSite(
                    id=f"{d_info['id']}_recharge_{i+1}",
                    district_id=d_info["id"],
                    site_type=site_types[i % len(site_types)],
                    lat=round(site_lat, 4),
                    lng=round(site_lng, 4),
                    suitability_score=score,
                    estimated_recharge_m3=int(5000 + rng() * 45000),
                    estimated_cost_lakhs=round(5 + rng() * 95, 1),
                    priority="High" if score > 80 else "Medium" if score > 65 else "Low",
                )
                session.add(site)

        await session.commit()
        return True

if __name__ == "__main__":
    print("Connecting to PostgreSQL and running migrations/seeding...")
    res = asyncio.run(seed_database_if_empty())
    print("Database seeded successfully!" if res else "Database was already initialized.")

