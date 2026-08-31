"""
AquaSentinel - FastAPI Backend Core Engine
Endpoints:
- POST /api/v1/simulate
- GET  /api/v1/backtest/{district_id}
- GET  /api/v1/recharge-recommendations/{district_id}
"""

import sys
import os

# Ensure backend root is on sys.path regardless of execution directory
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.abspath(os.path.join(current_dir, ".."))
project_dir = os.path.abspath(os.path.join(backend_dir, ".."))

for path in [backend_dir, project_dir]:
    if path not in sys.path:
        sys.path.insert(0, path)

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

try:
    from app.services.ml_engine import HybridForecastEngine
except ImportError:
    try:
        from backend.app.services.ml_engine import HybridForecastEngine
    except ImportError:
        from services.ml_engine import HybridForecastEngine

app = FastAPI(
    title="AquaSentinel API",
    version="1.0.0",
    description="Groundwater Stress Forecasting, Salinity Intrusion Early Warning, and Artificial Recharge Recommendation Platform"
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

engine = HybridForecastEngine()

class SimulateRequest(BaseModel):
    district_id: str
    rainfall_delta_pct: float = Field(0.0, ge=-50.0, le=50.0)
    extraction_delta_pct: float = Field(0.0, ge=-30.0, le=50.0)
    recharge_structures_added: int = Field(0, ge=0, le=50)

@app.get("/")
def root():
    return {"message": "AquaSentinel API Engine is Running", "docs": "/docs"}

@app.get("/api/health")
def health_check():
    return {"status": "online", "system": "AquaSentinel AI & Geospatial Core", "version": "1.0.0"}

@app.post("/api/v1/simulate")
def simulate_policy(req: SimulateRequest):
    """
    Policy Simulator API
    Returns 12-month simulated drawdown curves, baseline vs simulated deltas, and updated CGWB status.
    """
    # Baseline forecast trajectory for demonstration
    base_forecast = [28.2, 28.5, 29.1, 29.8, 30.5, 31.0, 30.2, 29.4, 28.8, 28.3, 28.0, 28.1]
    
    res = engine.simulate_policy(
        base_forecast=base_forecast,
        rainfall_delta_pct=req.rainfall_delta_pct,
        extraction_delta_pct=req.extraction_delta_pct,
        recharge_structures=req.recharge_structures_added
    )
    req_dict = req.model_dump() if hasattr(req, "model_dump") else req.dict()
    return {
        "status": "success",
        "district_id": req.district_id,
        "input": req_dict,
        "result": res
    }

@app.get("/api/v1/backtest/{district_id}")
def backtest_district(district_id: str):
    """
    Live UI Backtesting Engine
    Holds out the last 6 months of historical data and returns actual vs predicted with R2, RMSE, MAE.
    """
    # Sample 60-month historical series
    base = 25.0
    history = [round(base + (i * 0.05) + (2.0 * (1 if i % 12 in [7,8,9,10] else -1)), 2) for i in range(60)]
    
    res = engine.backtest(history, holdout_months=6)
    return {
        "status": "success",
        "district_id": district_id,
        "backtest": res
    }

@app.get("/api/v1/recharge-recommendations/{district_id}")
def get_recharge_recommendations(district_id: str):
    """
    Spatial Recharge Site Recommender
    Returns GeoJSON FeatureCollection of candidate check dam and percolation tank coordinates.
    """
    features = [
        {
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [75.83, 30.24]},
            "properties": {
                "block_id": f"{district_id}_blk_1",
                "block_name": "Dhuri North",
                "structure_type": "Check Dam",
                "slope_pct": 1.8,
                "stream_order": 3,
                "status": "Over-Exploited",
                "priority": "High"
            }
        },
        {
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [75.92, 30.15]},
            "properties": {
                "block_id": f"{district_id}_blk_2",
                "block_name": "Sunam West",
                "structure_type": "Percolation Tank",
                "slope_pct": 2.4,
                "stream_order": 2,
                "status": "Over-Exploited",
                "priority": "High"
            }
        }
    ]
    return {
        "type": "FeatureCollection",
        "district_id": district_id,
        "features": features
    }
