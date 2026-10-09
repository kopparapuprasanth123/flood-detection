from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class LocationModel(BaseModel):
    id: str
    name: str
    city: str
    latitude: float
    longitude: float
    elevation_m: float
    drainage_capacity_mmh: float
    critical_water_level_m: float
    historical_flood_count: int
    is_simulated: bool = True

class WeatherCurrent(BaseModel):
    temperature_2m: Optional[float] = None
    relative_humidity_2m: Optional[float] = None
    precipitation: Optional[float] = 0.0
    rain: Optional[float] = 0.0
    weather_code: Optional[int] = 0
    wind_speed_10m: Optional[float] = None
    apparent_temperature: Optional[float] = None

class WeatherHourlyPoint(BaseModel):
    time: str
    precipitation: float
    precipitation_probability: Optional[float] = 0.0
    temperature_2m: Optional[float] = None

class WeatherResponse(BaseModel):
    latitude: float
    longitude: float
    elevation: Optional[float] = None
    current: Dict[str, Any]
    hourly: List[Dict[str, Any]]
    accumulated_24h_mm: float
    is_fallback: bool = False
    source: str
    timestamp: str

class RiskFactorBreakdown(BaseModel):
    factor_name: str
    raw_value: float
    unit: str
    normalized_subscore: float  # 0 to 100
    weight_percentage: float
    weighted_contribution: float
    description: str

class PredictRequest(BaseModel):
    rainfall_last_hour: float = Field(..., ge=0.0, le=500.0, description="Rainfall in the last hour (mm)")
    rainfall_accumulated_24h: float = Field(..., ge=0.0, le=1500.0, description="24-hour accumulated rainfall (mm)")
    forecast_rainfall_next_6h: float = Field(..., ge=0.0, le=800.0, description="Next 6-hour forecast rainfall (mm)")
    elevation_m: float = Field(..., ge=-20.0, le=5000.0, description="Terrain elevation in meters")
    drainage_capacity_mmh: float = Field(..., ge=1.0, le=300.0, description="Drainage capacity (mm/hr)")
    current_water_level_m: float = Field(..., ge=0.0, le=25.0, description="Current canal/waterbody level (m)")
    location_id: Optional[str] = None
    location_name: Optional[str] = None

class MLPredictionDetail(BaseModel):
    model_name: str
    flood_probability_percent: float
    predicted_class: int
    model_status: str

class PredictResponse(BaseModel):
    risk_score: float  # 0 to 100
    risk_level: str    # LOW, MEDIUM, HIGH
    contributing_factors: List[RiskFactorBreakdown]
    recommended_actions: List[str]
    timestamp: str
    data_mode: str     # deterministic_heuristic or ml_ensemble
    location_id: Optional[str] = None
    location_name: Optional[str] = None
    ml_prediction: Optional[MLPredictionDetail] = None
    disclaimer: str = "Heuristic risk indicator for decision support. Not a calibrated real-world flood evacuation order."

class RiskAssessmentModel(BaseModel):
    location_id: str
    location_name: str
    latitude: float
    longitude: float
    elevation_m: float
    rainfall_current_mm: float
    water_level_m: float
    critical_water_level_m: float
    risk_score: float
    risk_level: str
    contributing_factors: List[RiskFactorBreakdown]
    recommended_action: str
    timestamp: str
    is_simulated: bool = True

class AlertModel(BaseModel):
    id: str
    location_id: str
    location_name: str
    risk_level: str
    risk_score: float
    rainfall_conditions: str
    water_level_m: float
    status: str  # ACTIVE or ACKNOWLEDGED
    recommended_action: str
    timestamp: str
    acknowledged_at: Optional[str] = None
    is_simulated: bool = True

class AlertCreateRequest(BaseModel):
    location_id: str
    location_name: str
    risk_level: str
    risk_score: float
    rainfall_conditions: str
    water_level_m: float
    recommended_action: str
    is_simulated: bool = True

class DashboardStats(BaseModel):
    monitored_locations_count: int
    high_risk_count: int
    medium_risk_count: int
    low_risk_count: int
    avg_rainfall_mm: float
    active_alerts_count: int
    last_updated: str
    risk_distribution: List[Dict[str, Any]]
    rainfall_trend: List[Dict[str, Any]]
    recent_alerts: List[AlertModel]
    location_assessments: List[RiskAssessmentModel]

class HealthResponse(BaseModel):
    status: str
    version: str
    timestamp: str
    services: Dict[str, str]

class GlofBasinModel(BaseModel):
    id: str
    name: str
    region: str
    hazard_type: str
    latitude: float
    longitude: float
    elevation_m: float
    lake_volume_million_m3: float
    moraine_stability_index: float
    rate_of_rise_m_per_hour: float
    temperature_anomaly_c: float
    acoustic_vibration_level: float
    insar_creep_rate_mm_yr: float
    downstream_settlement: str
    distance_to_settlement_km: float
    population_at_risk: int
    status: str
    case_study_notes: str
    early_warning_sirens_installed: bool
    lake_freeboard_m: float

class GlofAssessRequest(BaseModel):
    basin_id: Optional[str] = None
    lake_volume_million_m3: float = Field(..., ge=0.01, le=500.0)
    rate_of_rise_m_per_hour: float = Field(..., ge=0.0, le=10.0)
    moraine_stability_index: float = Field(..., ge=0.0, le=100.0)
    temperature_anomaly_c: float = Field(..., ge=-10.0, le=15.0)
    acoustic_vibration_level: float = Field(..., ge=0.0, le=10.0)
    insar_creep_rate_mm_yr: float = Field(..., ge=0.0, le=200.0)
    distance_to_settlement_km: float = Field(..., ge=0.5, le=200.0)
    rainfall_mm: float = 0.0

class GlofAssessResponse(BaseModel):
    risk_score: float
    risk_level: str
    rainfall_condition: str
    evacuation_lead_time_minutes: float
    peak_discharge_m3s: float
    surge_crest_height_m: float
    wave_velocity_kmh: float
    contributing_factors: List[Dict[str, Any]]
    action_directives: List[str]
    timestamp: str

class GlofSimulationRequest(BaseModel):
    lake_volume_million_m3: float = Field(..., ge=0.05, le=500.0)
    breach_height_m: float = Field(..., ge=2.0, le=100.0)
    breach_width_m: float = Field(..., ge=2.0, le=250.0)
    distance_km: float = Field(..., ge=0.5, le=150.0)
    channel_slope: float = Field(default=0.04, ge=0.005, le=0.2)
    mannings_n: float = Field(default=0.055, ge=0.02, le=0.1)

class GlofSimulationResponse(BaseModel):
    lake_volume_million_m3: float
    breach_peak_discharge_m3s: float
    downstream_peak_discharge_m3s: float
    wave_velocity_ms: float
    wave_velocity_kmh: float
    arrival_time_minutes: float
    peak_crest_depth_m: float
    downstream_distance_km: float
    hydrograph: List[Dict[str, Any]]
    severity: str
    evacuation_urgency: str

