from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any

from models import (
    HealthResponse,
    LocationModel,
    DashboardStats,
    WeatherResponse,
    PredictRequest,
    PredictResponse,
    RiskAssessmentModel,
    AlertModel,
    AlertCreateRequest,
    GlofBasinModel,
    GlofAssessRequest,
    GlofAssessResponse,
    GlofSimulationRequest,
    GlofSimulationResponse
)
from data_loader import load_locations, get_location_by_id
from weather_service import fetch_weather_forecast
from risk_engine import calculate_flood_risk, ml_engine
import alert_service
from glof_service import (
    MONITORED_GLOF_BASINS,
    calculate_glof_risk,
    simulate_dam_break_hydrograph,
    GLOF_SOLUTIONS_GUIDE
)

app = FastAPI(
    title="FloodGuard AI API",
    description="Intelligent Urban Flood Prediction & Decision-Support System",
    version="1.0.0"
)

# Enable CORS for local React development server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Deterministic simulated sensor baseline readings per location for dashboard
LOCATION_READINGS = {
    "LOC-001": {"rainfall_1h": 36.2, "accumulated_24h": 94.0, "forecast_6h": 32.0, "water_level": 2.70},
    "LOC-002": {"rainfall_1h": 46.5, "accumulated_24h": 118.0, "forecast_6h": 40.0, "water_level": 1.90},
    "LOC-003": {"rainfall_1h": 22.0, "accumulated_24h": 58.0, "forecast_6h": 18.0, "water_level": 2.30},
    "LOC-004": {"rainfall_1h": 14.5, "accumulated_24h": 38.0, "forecast_6h": 12.0, "water_level": 1.45},
    "LOC-005": {"rainfall_1h": 10.0, "accumulated_24h": 25.0, "forecast_6h": 8.0, "water_level": 1.10},
    "LOC-006": {"rainfall_1h": 38.0, "accumulated_24h": 98.0, "forecast_6h": 34.0, "water_level": 2.15},
    "LOC-007": {"rainfall_1h": 19.5, "accumulated_24h": 46.0, "forecast_6h": 15.0, "water_level": 1.60},
    "LOC-008": {"rainfall_1h": 6.0, "accumulated_24h": 14.0, "forecast_6h": 4.0, "water_level": 0.90},
    "LOC-009": {"rainfall_1h": 29.0, "accumulated_24h": 72.0, "forecast_6h": 22.0, "water_level": 1.55},
    "LOC-010": {"rainfall_1h": 12.0, "accumulated_24h": 28.0, "forecast_6h": 10.0, "water_level": 1.20},
}

def get_location_assessment(loc: Dict[str, Any]) -> RiskAssessmentModel:
    reading = LOCATION_READINGS.get(loc["id"], {
        "rainfall_1h": 15.0, "accumulated_24h": 40.0, "forecast_6h": 12.0, "water_level": 1.5
    })
    risk_data = calculate_flood_risk(
        rainfall_last_hour=reading["rainfall_1h"],
        rainfall_accumulated_24h=reading["accumulated_24h"],
        forecast_rainfall_next_6h=reading["forecast_6h"],
        elevation_m=loc["elevation_m"],
        drainage_capacity_mmh=loc["drainage_capacity_mmh"],
        current_water_level_m=reading["water_level"],
        critical_water_level_m=loc["critical_water_level_m"],
        location_id=loc["id"],
        location_name=loc["name"]
    )
    return RiskAssessmentModel(
        location_id=loc["id"],
        location_name=loc["name"],
        latitude=loc["latitude"],
        longitude=loc["longitude"],
        elevation_m=loc["elevation_m"],
        rainfall_current_mm=reading["rainfall_1h"],
        water_level_m=reading["water_level"],
        critical_water_level_m=loc["critical_water_level_m"],
        risk_score=risk_data["risk_score"],
        risk_level=risk_data["risk_level"],
        contributing_factors=risk_data["contributing_factors"],
        recommended_action=risk_data["recommended_actions"][0],
        timestamp=risk_data["timestamp"],
        is_simulated=loc.get("is_simulated", True)
    )

@app.get("/api/health", response_model=HealthResponse)
def health_check():
    return HealthResponse(
        status="healthy",
        version="1.0.0",
        timestamp=datetime.now(timezone.utc).isoformat(),
        services={
            "database": "sqlite_connected",
            "risk_engine": "operational",
            "glof_engine": "operational",
            "ml_model": "active" if ml_engine.is_trained else "heuristic_fallback",
            "weather_provider": "open_meteo_live_with_fallback"
        }
    )

@app.get("/api/locations", response_model=List[LocationModel])
def get_locations():
    return load_locations()

@app.get("/api/risk", response_model=List[RiskAssessmentModel])
def get_all_risk_assessments():
    locations = load_locations()
    return [get_location_assessment(loc) for loc in locations]

@app.get("/api/dashboard", response_model=DashboardStats)
def get_dashboard_summary():
    locations = load_locations()
    assessments = [get_location_assessment(loc) for loc in locations]

    high_count = sum(1 for a in assessments if a.risk_level == "HIGH")
    med_count = sum(1 for a in assessments if a.risk_level == "MEDIUM")
    low_count = sum(1 for a in assessments if a.risk_level == "LOW")

    total_rf = sum(a.rainfall_current_mm for a in assessments)
    avg_rf = round(total_rf / max(len(assessments), 1), 1)

    all_alerts = alert_service.get_alerts()
    active_alerts = [a for a in all_alerts if a["status"] == "ACTIVE"]

    risk_dist = [
        {"name": "High Risk", "count": high_count, "color": "#EF4444"},
        {"name": "Medium Risk", "count": med_count, "color": "#F59E0B"},
        {"name": "Low Risk", "count": low_count, "color": "#10B981"}
    ]

    # Hourly precipitation trend
    rainfall_trend = [
        {"time": "00:00", "rainfall_mm": 4.2, "threshold_mm": 25.0},
        {"time": "03:00", "rainfall_mm": 8.5, "threshold_mm": 25.0},
        {"time": "06:00", "rainfall_mm": 18.0, "threshold_mm": 25.0},
        {"time": "09:00", "rainfall_mm": 32.4, "threshold_mm": 25.0},
        {"time": "12:00", "rainfall_mm": 24.1, "threshold_mm": 25.0},
        {"time": "15:00", "rainfall_mm": 28.6, "threshold_mm": 25.0},
        {"time": "18:00", "rainfall_mm": 35.8, "threshold_mm": 25.0},
        {"time": "21:00", "rainfall_mm": 19.3, "threshold_mm": 25.0}
    ]

    return DashboardStats(
        monitored_locations_count=len(locations),
        high_risk_count=high_count,
        medium_risk_count=med_count,
        low_risk_count=low_count,
        avg_rainfall_mm=avg_rf,
        active_alerts_count=len(active_alerts),
        last_updated=datetime.now(timezone.utc).isoformat(),
        risk_distribution=risk_dist,
        rainfall_trend=rainfall_trend,
        recent_alerts=all_alerts[:6],
        location_assessments=assessments
    )

@app.get("/api/weather", response_model=WeatherResponse)
async def get_weather(lat: float = Query(..., ge=-90.0, le=90.0), lon: float = Query(..., ge=-180.0, le=180.0)):
    return await fetch_weather_forecast(lat, lon)

@app.post("/api/predict", response_model=PredictResponse)
def predict_flood_risk(req: PredictRequest):
    # If location is provided, adjust critical threshold if available
    crit_level = 2.5
    if req.location_id:
        loc = get_location_by_id(req.location_id)
        if loc:
            crit_level = loc.get("critical_water_level_m", 2.5)

    res = calculate_flood_risk(
        rainfall_last_hour=req.rainfall_last_hour,
        rainfall_accumulated_24h=req.rainfall_accumulated_24h,
        forecast_rainfall_next_6h=req.forecast_rainfall_next_6h,
        elevation_m=req.elevation_m,
        drainage_capacity_mmh=req.drainage_capacity_mmh,
        current_water_level_m=req.current_water_level_m,
        critical_water_level_m=crit_level,
        location_id=req.location_id,
        location_name=req.location_name
    )
    return PredictResponse(**res)

@app.get("/api/alerts", response_model=List[AlertModel])
def get_alerts(status: Optional[str] = None, location_id: Optional[str] = None):
    return alert_service.get_alerts(status_filter=status, location_filter=location_id)

@app.post("/api/alerts", response_model=AlertModel)
def create_alert(req: AlertCreateRequest):
    return alert_service.create_alert(
        location_id=req.location_id,
        location_name=req.location_name,
        risk_level=req.risk_level,
        risk_score=req.risk_score,
        rainfall_conditions=req.rainfall_conditions,
        water_level_m=req.water_level_m,
        recommended_action=req.recommended_action,
        is_simulated=req.is_simulated
    )

@app.patch("/api/alerts/{alert_id}", response_model=AlertModel)
def acknowledge_alert(alert_id: str):
    res = alert_service.acknowledge_alert(alert_id)
    if not res:
        raise HTTPException(status_code=404, detail=f"Alert with id '{alert_id}' not found")
    return res

# ==========================================
# GLOF & Non-Rainfall Outburst Flood Endpoints
# ==========================================

@app.get("/api/glof/basins", response_model=List[GlofBasinModel])
def get_glof_basins():
    """Returns real-time status of monitored glacial lakes and landslide dams in Nepal & Himalayas."""
    return MONITORED_GLOF_BASINS

@app.post("/api/glof/assess", response_model=GlofAssessResponse)
def assess_glof_hazard(req: GlofAssessRequest):
    """Calculates outburst flood risk tailored to non-rainfall physics (dh/dt, moraine stability, volume)."""
    res = calculate_glof_risk(
        lake_volume_million_m3=req.lake_volume_million_m3,
        rate_of_rise_m_per_hour=req.rate_of_rise_m_per_hour,
        moraine_stability_index=req.moraine_stability_index,
        temperature_anomaly_c=req.temperature_anomaly_c,
        acoustic_vibration_level=req.acoustic_vibration_level,
        insar_creep_rate_mm_yr=req.insar_creep_rate_mm_yr,
        distance_to_settlement_km=req.distance_to_settlement_km,
        rainfall_mm=req.rainfall_mm
    )
    return GlofAssessResponse(**res)

@app.post("/api/glof/simulate-breach", response_model=GlofSimulationResponse)
def simulate_glof_breach(req: GlofSimulationRequest):
    """Simulates dam break outflow hydrograph and downstream surge wave arrival time."""
    res = simulate_dam_break_hydrograph(
        lake_volume_million_m3=req.lake_volume_million_m3,
        breach_height_m=req.breach_height_m,
        breach_width_m=req.breach_width_m,
        distance_km=req.distance_km,
        channel_slope=req.channel_slope,
        mannings_n=req.mannings_n
    )
    return GlofSimulationResponse(**res)

@app.get("/api/glof/protocols", response_model=List[Dict[str, Any]])
def get_glof_protocols():
    """Returns technical engineering and community mitigation protocols for non-rainfall flood hazards."""
    return GLOF_SOLUTIONS_GUIDE

@app.post("/api/glof/broadcast-alert", response_model=AlertModel)
def broadcast_glof_alert(basin_id: str = Query(...)):
    """Triggers an official GLOF early warning bulletin into the central system Alert Vault."""
    matched = next((b for b in MONITORED_GLOF_BASINS if b["id"] == basin_id), None)
    if not matched:
        raise HTTPException(status_code=404, detail=f"Basin '{basin_id}' not found")
    
    assessment = calculate_glof_risk(
        lake_volume_million_m3=matched["lake_volume_million_m3"],
        rate_of_rise_m_per_hour=matched["rate_of_rise_m_per_hour"],
        moraine_stability_index=matched["moraine_stability_index"],
        temperature_anomaly_c=matched["temperature_anomaly_c"],
        acoustic_vibration_level=matched["acoustic_vibration_level"],
        insar_creep_rate_mm_yr=matched["insar_creep_rate_mm_yr"],
        distance_to_settlement_km=matched["distance_to_settlement_km"],
        rainfall_mm=0.0
    )

    alert_item = alert_service.create_alert(
        location_id=matched["id"],
        location_name=f"{matched['name']} [{matched['region']}]",
        risk_level=assessment["risk_level"] if assessment["risk_level"] != "CRITICAL" else "HIGH",
        risk_score=assessment["risk_score"],
        rainfall_conditions="0.0 mm (Glacial/Landslide Dam Outburst — Zero Local Rainfall)",
        water_level_m=matched["rate_of_rise_m_per_hour"],
        recommended_action=assessment["action_directives"][0],
        is_simulated=True
    )
    return alert_item

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
