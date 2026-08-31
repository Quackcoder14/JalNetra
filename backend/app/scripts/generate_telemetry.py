"""
AquaSentinel - Synthetic DWLR Telemetry Generator Fallback
Generates realistic 10-year monthly time-series (2015–2025) for India districts/blocks.
Schema: [district_id, block_id, district_name, date, water_level_mbgl, salinity_tds_ppm, status]
"""

import os
import csv
import math
import random
from datetime import datetime

OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "..", "data", "raw", "dwlr_water_levels.csv")

DISTRICTS = [
    {"id": "pb_sangrur", "name": "Sangrur", "state": "Punjab", "status": "Over-Exploited", "base_gw": 28.5, "trend": 0.08, "saline": False, "blocks": ["Dhuri", "Sunam", "Lehra", "Malerkotla"]},
    {"id": "rj_jaipur", "name": "Jaipur", "state": "Rajasthan", "status": "Over-Exploited", "base_gw": 34.0, "trend": 0.06, "saline": False, "blocks": ["Amber", "Sanganer", "Chaksu", "Basssi"]},
    {"id": "tn_chennai", "name": "Chennai", "state": "Tamil Nadu", "status": "Saline", "base_gw": 6.8, "trend": 0.03, "saline": True, "blocks": ["Mylapore", "Velachery", "Adyar", "Tondiarpet"]},
    {"id": "gj_ahmedabad", "name": "Ahmedabad", "state": "Gujarat", "status": "Critical", "base_gw": 22.0, "trend": 0.04, "saline": True, "blocks": ["Daskroi", "Sanand", "Bavla", "Dholka"]},
    {"id": "ka_bengaluru_u", "name": "Bengaluru Urban", "state": "Karnataka", "status": "Over-Exploited", "base_gw": 26.5, "trend": 0.07, "saline": False, "blocks": ["Anekal", "Yelahanka", "KR Puram", "Kengeri"]},
    {"id": "up_agra", "name": "Agra", "state": "Uttar Pradesh", "status": "Critical", "base_gw": 18.2, "trend": 0.05, "saline": False, "blocks": ["Etmadpur", "Fatehabad", "Kheragarh", "Bah"]},
    {"id": "mh_aurangabad", "name": "Chhatrapati Sambhajinagar", "state": "Maharashtra", "status": "Semi-Critical", "base_gw": 14.5, "trend": 0.02, "saline": False, "blocks": ["Paithan", "Gangapur", "Vaijapur", "Kannad"]},
    {"id": "wb_south_24_pgs", "name": "South 24 Parganas", "state": "West Bengal", "status": "Saline", "base_gw": 4.5, "trend": 0.01, "saline": True, "blocks": ["Canning", "Kakdwip", "Gosaba", "Diamond Harbour"]},
    {"id": "ap_anantapur", "name": "Anantapur", "state": "Andhra Pradesh", "status": "Over-Exploited", "base_gw": 24.8, "trend": 0.05, "saline": False, "blocks": ["Dharmavaram", "Guntakal", "Hindupur", "Kadiri"]},
    {"id": "mp_indore", "name": "Indore", "state": "Madhya Pradesh", "status": "Semi-Critical", "base_gw": 16.0, "trend": 0.02, "saline": False, "blocks": ["Sanwer", "Depalpur", "Mhow", "Indore-Rural"]},
]

def generate_telemetry(force=False):
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    if os.path.exists(OUTPUT_PATH) and not force:
        print(f"[INFO] File already exists at {OUTPUT_PATH}. Skipping generation.")
        return OUTPUT_PATH

    print(f"[INFO] Generating 10-year synthetic DWLR time series (2015-2025)...")
    records = []
    random.seed(42)

    # 10 years monthly: Jan 2015 to Dec 2025 (132 months)
    for d in DISTRICTS:
        for b_idx, block in enumerate(d["blocks"]):
            block_id = f"{d['id']}_blk_{b_idx + 1}"
            step = 0
            for year in range(2015, 2026):
                for month in range(1, 13):
                    date_str = f"{year}-{month:02d}-01"
                    
                    # Monsoon seasonality: water level rises (mbgl decreases) post-monsoon (Jul-Oct: months 7-10)
                    # Peak trough in May (month 5), Peak recovery in Oct (month 10)
                    seasonal_phase = (month - 10) / 12.0 * 2.0 * math.pi
                    seasonal_swing = 2.5 * math.sin(seasonal_phase)
                    
                    # Long-term drawdown trend
                    trend_val = d["trend"] * step
                    noise = (random.random() - 0.5) * 0.4
                    
                    mbgl = max(0.5, round(d["base_gw"] + trend_val + seasonal_swing + noise, 2))
                    
                    # Salinity TDS in ppm (higher in coastal / saline districts, peaks pre-monsoon May)
                    if d["saline"]:
                        tds_base = 2200 + (b_idx * 150)
                        tds_season = 350 * math.sin((month - 5) / 12.0 * 2.0 * math.pi)
                        tds = int(tds_base + (step * 3.5) + tds_season + random.randint(-40, 40))
                    else:
                        tds = int(350 + (b_idx * 20) + random.randint(-30, 30))

                    records.append({
                        "district_id": d["id"],
                        "block_id": block_id,
                        "district_name": d["name"],
                        "date": date_str,
                        "water_level_mbgl": mbgl,
                        "salinity_tds_ppm": tds,
                        "status": d["status"]
                    })
                    step += 1

    fieldnames = ["district_id", "block_id", "district_name", "date", "water_level_mbgl", "salinity_tds_ppm", "status"]
    with open(OUTPUT_PATH, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(records)

    print(f"[SUCCESS] Wrote {len(records)} DWLR telemetry records to {OUTPUT_PATH}")
    return OUTPUT_PATH

if __name__ == "__main__":
    generate_telemetry(force=True)
