import pytest
from fastapi.testclient import TestClient
from main import app
from risk_engine import calculate_flood_risk, normalize_rainfall_intensity

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "services" in data
    assert data["services"]["database"] == "sqlite_connected"

def test_locations_endpoint():
    response = client.get("/api/locations")
    assert response.status_code == 200
    locations = response.json()
    assert len(locations) >= 10
    assert locations[0]["id"] == "LOC-001"
    assert "elevation_m" in locations[0]
    assert "drainage_capacity_mmh" in locations[0]

def test_dashboard_endpoint():
    response = client.get("/api/dashboard")
    assert response.status_code == 200
    data = response.json()
    assert data["monitored_locations_count"] >= 10
    assert "risk_distribution" in data
    assert len(data["risk_distribution"]) == 3
    assert "rainfall_trend" in data
    assert "recent_alerts" in data

def test_predict_endpoint_high_risk():
    payload = {
        "rainfall_last_hour": 55.0,
        "rainfall_accumulated_24h": 130.0,
        "forecast_rainfall_next_6h": 45.0,
        "elevation_m": 2.0,
        "drainage_capacity_mmh": 18.0,
        "current_water_level_m": 2.6,
        "location_id": "LOC-002",
        "location_name": "Central Rail Underpass"
    }
    response = client.post("/api/predict", json=payload)
    assert response.status_code == 200
    res = response.json()
    assert res["risk_score"] >= 70.0
    assert res["risk_level"] == "HIGH"
    assert len(res["contributing_factors"]) == 6
    assert len(res["recommended_actions"]) >= 3
    assert res["data_mode"] in ["ml_enhanced", "deterministic_heuristic"]

def test_predict_endpoint_low_risk():
    payload = {
        "rainfall_last_hour": 2.0,
        "rainfall_accumulated_24h": 8.0,
        "forecast_rainfall_next_6h": 3.0,
        "elevation_m": 25.0,
        "drainage_capacity_mmh": 65.0,
        "current_water_level_m": 0.5,
        "location_id": "LOC-010"
    }
    response = client.post("/api/predict", json=payload)
    assert response.status_code == 200
    res = response.json()
    assert res["risk_score"] < 40.0
    assert res["risk_level"] == "LOW"

def test_alerts_workflow():
    # 1. Fetch alerts
    response = client.get("/api/alerts")
    assert response.status_code == 200
    alerts = response.json()
    assert len(alerts) > 0

    # 2. Create simulated alert
    new_alert = {
        "location_id": "LOC-003",
        "location_name": "Velachery Lake Catchment",
        "risk_level": "HIGH",
        "risk_score": 78.5,
        "rainfall_conditions": "Heavy squall line approaching",
        "water_level_m": 2.9,
        "recommended_action": "Verify retention pond sluice gate seals",
        "is_simulated": True
    }
    post_res = client.post("/api/alerts", json=new_alert)
    assert post_res.status_code == 200
    created = post_res.json()
    assert created["status"] == "ACTIVE"
    created_id = created["id"]

    # 3. Acknowledge alert
    patch_res = client.patch(f"/api/alerts/{created_id}")
    assert patch_res.status_code == 200
    acknowledged = patch_res.json()
    assert acknowledged["status"] == "ACKNOWLEDGED"
    assert acknowledged["acknowledged_at"] is not None

def test_weather_endpoint():
    response = client.get("/api/weather?lat=13.0827&lon=80.2707")
    assert response.status_code == 200
    weather = response.json()
    assert "current" in weather
    assert "hourly" in weather
    assert len(weather["hourly"]) > 0
    assert "source" in weather

def test_glof_basins_endpoint():
    response = client.get("/api/glof/basins")
    assert response.status_code == 200
    basins = response.json()
    assert len(basins) >= 5
    thame = next(b for b in basins if b["id"] == "NEP-GLOF-001")
    assert "Thame" in thame["name"]
    assert thame["lake_volume_million_m3"] > 0
    assert "rate_of_rise_m_per_hour" in thame

def test_glof_assess_endpoint_zero_rainfall():
    # Simulating zero rainfall scenario (sunny/dry day) but rapid upstream moraine surge
    payload = {
        "lake_volume_million_m3": 4.5,
        "rate_of_rise_m_per_hour": 1.2,
        "moraine_stability_index": 25.0,
        "temperature_anomaly_c": 3.5,
        "acoustic_vibration_level": 8.0,
        "insar_creep_rate_mm_yr": 35.0,
        "distance_to_settlement_km": 15.0,
        "rainfall_mm": 0.0
    }
    response = client.post("/api/glof/assess", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["risk_score"] >= 65.0
    assert data["risk_level"] in ["CRITICAL", "HIGH"]
    assert data["evacuation_lead_time_minutes"] > 0
    assert data["surge_crest_height_m"] > 0
    assert "Zero Rainfall" in data["rainfall_condition"]
    assert len(data["action_directives"]) > 0

def test_glof_simulate_breach_endpoint():
    payload = {
        "lake_volume_million_m3": 5.0,
        "breach_height_m": 25.0,
        "breach_width_m": 40.0,
        "distance_km": 18.0
    }
    response = client.post("/api/glof/simulate-breach", json=payload)
    assert response.status_code == 200
    sim = response.json()
    assert sim["breach_peak_discharge_m3s"] > 100.0
    assert sim["arrival_time_minutes"] > 0
    assert sim["peak_crest_depth_m"] > 0
    assert len(sim["hydrograph"]) > 5

def test_glof_protocols_endpoint():
    response = client.get("/api/glof/protocols")
    assert response.status_code == 200
    protocols = response.json()
    assert len(protocols) >= 3
    assert any("Geophones" in str(p) for p in protocols)

def test_glof_broadcast_alert():
    response = client.post("/api/glof/broadcast-alert?basin_id=NEP-GLOF-001")
    assert response.status_code == 200
    alert = response.json()
    assert alert["location_id"] == "NEP-GLOF-001"
    assert "Thame" in alert["location_name"]
    assert alert["status"] == "ACTIVE"

