import numpy as np
from datetime import datetime, timezone
from typing import Dict, Any, List, Tuple, Optional
from data_loader import load_historical_data

# Configurable Weights (Must sum to 1.0)
WEIGHTS = {
    "rainfall_intensity": 0.20,
    "rainfall_accumulated": 0.20,
    "forecast_rainfall": 0.15,
    "terrain_elevation": 0.15,
    "drainage_vulnerability": 0.15,
    "water_level": 0.15
}

# Configurable Risk Thresholds
LOW_THRESHOLD = 40.0
HIGH_THRESHOLD = 70.0

def normalize_rainfall_intensity(mm: float) -> float:
    # 0 mm = 0, >= 65 mm/hr torrential cloudburst = 100
    return float(np.clip((mm / 65.0) * 100.0, 0.0, 100.0))

def normalize_accumulated_rainfall(mm: float) -> float:
    # 0 mm = 0, >= 140 mm in 24h = 100
    return float(np.clip((mm / 140.0) * 100.0, 0.0, 100.0))

def normalize_forecast_rainfall(mm: float) -> float:
    # 0 mm = 0, >= 50 mm in 6h = 100
    return float(np.clip((mm / 50.0) * 100.0, 0.0, 100.0))

def normalize_terrain_elevation(elev_m: float) -> float:
    # Inverted: sea level / <= 1.5m = 100 risk, >= 20m = 0 risk
    if elev_m <= 1.5:
        return 100.0
    if elev_m >= 20.0:
        return 0.0
    return float((20.0 - elev_m) / (20.0 - 1.5) * 100.0)

def normalize_drainage_vulnerability(capacity_mmh: float) -> float:
    # Inverted: <= 15 mm/h clogged/choked = 100, >= 60 mm/h free flowing = 0
    if capacity_mmh <= 15.0:
        return 100.0
    if capacity_mmh >= 60.0:
        return 0.0
    return float((60.0 - capacity_mmh) / (60.0 - 15.0) * 100.0)

def normalize_water_level(current_m: float, critical_m: float = 2.5) -> float:
    # Current vs critical ratio: ratio >= 1.0 (overflow) = 100, ratio <= 0.2 (dry bed) = 0
    ratio = current_m / max(critical_m, 0.5)
    return float(np.clip(ratio * 100.0, 0.0, 100.0))

def determine_risk_level(score: float) -> str:
    if score < LOW_THRESHOLD:
        return "LOW"
    elif score < HIGH_THRESHOLD:
        return "MEDIUM"
    return "HIGH"

def generate_recommendations(risk_level: str, factors: List[Dict[str, Any]]) -> List[str]:
    recs = []
    if risk_level == "LOW":
        recs.append("Maintain baseline hydrological monitoring and routine sensor telemetry.")
        recs.append("Inspect stormwater grates for clear passage during scheduled sweeps.")
        recs.append("Track incoming satellite and radar precipitation forecasts.")
    elif risk_level == "MEDIUM":
        recs.append("Mobilize regional municipal drainage response units to high-priority catchments.")
        recs.append("Inspect culverts and storm drains for siltation or plastic obstruction.")
        recs.append("Stage mobile diesel dewatering pumps at known topographic depressions.")
        recs.append("Issue yellow advisory for ground-level storage and basement car parks.")
    else:  # HIGH
        recs.append("Urgently verify telemetry gauge readings and notify regional emergency dispatch.")
        recs.append("Deploy active dewatering pumping teams at maximum throughput capacity.")
        recs.append("Erect hazard barriers and water-depth warnings at inundated rail/road underpasses.")
        recs.append("Notify municipal disaster management cell to coordinate localized traffic diversions.")
        recs.append("Issue flash public warnings for low-lying ground floor dwellings.")

    # Contextual recommendation based on highest single factor
    highest_factor = max(factors, key=lambda f: f["normalized_subscore"])
    if highest_factor["factor_name"] == "Drainage Vulnerability" and highest_factor["normalized_subscore"] > 60:
        recs.append("Priority alert: Drainage capacity is severely constrained; immediate desilting required.")
    elif highest_factor["factor_name"] == "Water Level" and highest_factor["normalized_subscore"] > 75:
        recs.append("Critical alert: Watercourse is near or exceeding bankfull stage capacity.")

    return recs

# Machine Learning Prototype Model
class FloodMLModel:
    def __init__(self):
        self.model = None
        self.is_trained = False
        self._initialize_model()

    def _initialize_model(self):
        try:
            from sklearn.ensemble import RandomForestClassifier
            data = load_historical_data()
            if not data or len(data) < 10:
                print("[RiskEngine ML] Insufficient historical samples; ML model in standby.")
                return

            X = []
            y = []
            for row in data:
                X.append([
                    row["rainfall_last_hour"],
                    row["rainfall_accumulated_24h"],
                    row["forecast_rainfall_next_6h"],
                    row["elevation_m"],
                    row["drainage_capacity_mmh"],
                    row["current_water_level_m"]
                ])
                y.append(row["flood_occurred"])

            clf = RandomForestClassifier(n_estimators=40, max_depth=5, random_state=42)
            clf.fit(X, y)
            self.model = clf
            self.is_trained = True
            print(f"[RiskEngine ML] Random Forest model trained on {len(data)} historical observations.")
        except Exception as e:
            print(f"[RiskEngine ML] Error during ML model training: {e}")
            self.is_trained = False

    def predict_probability(self, features: List[float]) -> Optional[Dict[str, Any]]:
        if not self.is_trained or self.model is None:
            return None
        try:
            probs = self.model.predict_proba([features])[0]
            pred_class = int(self.model.predict([features])[0])
            flood_prob = float(probs[1]) if len(probs) > 1 else float(probs[0])
            return {
                "model_name": "Random Forest Classifier (v1.0-Hackathon)",
                "flood_probability_percent": round(flood_prob * 100.0, 1),
                "predicted_class": pred_class,
                "model_status": "Trained on sample historical urban dataset"
            }
        except Exception as e:
            print(f"[RiskEngine ML] Inference exception: {e}")
            return None

ml_engine = FloodMLModel()

def calculate_flood_risk(
    rainfall_last_hour: float,
    rainfall_accumulated_24h: float,
    forecast_rainfall_next_6h: float,
    elevation_m: float,
    drainage_capacity_mmh: float,
    current_water_level_m: float,
    critical_water_level_m: float = 2.5,
    location_id: Optional[str] = None,
    location_name: Optional[str] = None
) -> Dict[str, Any]:
    """
    Computes explainable deterministic weighted flood risk and optional ML ensemble inference.
    """
    # 1. Normalization
    sub_intensity = normalize_rainfall_intensity(rainfall_last_hour)
    sub_accumulated = normalize_accumulated_rainfall(rainfall_accumulated_24h)
    sub_forecast = normalize_forecast_rainfall(forecast_rainfall_next_6h)
    sub_elevation = normalize_terrain_elevation(elevation_m)
    sub_drainage = normalize_drainage_vulnerability(drainage_capacity_mmh)
    sub_water_level = normalize_water_level(current_water_level_m, critical_water_level_m)

    factors = [
        {
            "factor_name": "Rainfall Intensity (1h)",
            "raw_value": round(rainfall_last_hour, 1),
            "unit": "mm/h",
            "normalized_subscore": round(sub_intensity, 1),
            "weight_percentage": round(WEIGHTS["rainfall_intensity"] * 100, 1),
            "weighted_contribution": round(sub_intensity * WEIGHTS["rainfall_intensity"], 1),
            "description": "Short-duration cloudburst and precipitation rate impact"
        },
        {
            "factor_name": "Accumulated Rainfall (24h)",
            "raw_value": round(rainfall_accumulated_24h, 1),
            "unit": "mm",
            "normalized_subscore": round(sub_accumulated, 1),
            "weight_percentage": round(WEIGHTS["rainfall_accumulated"] * 100, 1),
            "weighted_contribution": round(sub_accumulated * WEIGHTS["rainfall_accumulated"], 1),
            "description": "Soil saturation and hydrological storage accumulation"
        },
        {
            "factor_name": "Forecast Rainfall (6h)",
            "raw_value": round(forecast_rainfall_next_6h, 1),
            "unit": "mm",
            "normalized_subscore": round(sub_forecast, 1),
            "weight_percentage": round(WEIGHTS["forecast_rainfall"] * 100, 1),
            "weighted_contribution": round(sub_forecast * WEIGHTS["forecast_rainfall"], 1),
            "description": "Projected upcoming atmospheric precipitation load"
        },
        {
            "factor_name": "Terrain Elevation Vulnerability",
            "raw_value": round(elevation_m, 1),
            "unit": "m",
            "normalized_subscore": round(sub_elevation, 1),
            "weight_percentage": round(WEIGHTS["terrain_elevation"] * 100, 1),
            "weighted_contribution": round(sub_elevation * WEIGHTS["terrain_elevation"], 1),
            "description": "Topographical lowland pooling and depression index"
        },
        {
            "factor_name": "Drainage Vulnerability",
            "raw_value": round(drainage_capacity_mmh, 1),
            "unit": "mm/h",
            "normalized_subscore": round(sub_drainage, 1),
            "weight_percentage": round(WEIGHTS["drainage_vulnerability"] * 100, 1),
            "weighted_contribution": round(sub_drainage * WEIGHTS["drainage_vulnerability"], 1),
            "description": "Conduit discharge capacity and siltation choke susceptibility"
        },
        {
            "factor_name": "Water Level",
            "raw_value": round(current_water_level_m, 2),
            "unit": "m",
            "normalized_subscore": round(sub_water_level, 1),
            "weight_percentage": round(WEIGHTS["water_level"] * 100, 1),
            "weighted_contribution": round(sub_water_level * WEIGHTS["water_level"], 1),
            "description": "Channel freeboard depletion relative to critical threshold"
        }
    ]

    total_risk_score = round(sum(f["weighted_contribution"] for f in factors), 1)
    total_risk_score = min(100.0, max(0.0, total_risk_score))
    risk_level = determine_risk_level(total_risk_score)
    recommendations = generate_recommendations(risk_level, factors)

    # ML Model Prediction
    ml_res = ml_engine.predict_probability([
        rainfall_last_hour,
        rainfall_accumulated_24h,
        forecast_rainfall_next_6h,
        elevation_m,
        drainage_capacity_mmh,
        current_water_level_m
    ])

    return {
        "risk_score": total_risk_score,
        "risk_level": risk_level,
        "contributing_factors": factors,
        "recommended_actions": recommendations,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "data_mode": "ml_enhanced" if ml_res else "deterministic_heuristic",
        "location_id": location_id,
        "location_name": location_name,
        "ml_prediction": ml_res,
        "disclaimer": "Heuristic risk score for tactical monitoring. Does not constitute an official evacuation declaration."
    }
