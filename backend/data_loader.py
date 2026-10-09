import os
import csv
from typing import List, Dict, Any, Optional

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
LOCATIONS_FILE = os.path.join(DATA_DIR, "sample_locations.csv")
HISTORY_FILE = os.path.join(DATA_DIR, "sample_flood_history.csv")

DEFAULT_LOCATIONS: List[Dict[str, Any]] = [
    {
        "id": "LOC-001",
        "name": "Adyar River Basin Lowland",
        "city": "Metropolitan District",
        "latitude": 13.0118,
        "longitude": 80.2372,
        "elevation_m": 4.5,
        "drainage_capacity_mmh": 35.0,
        "critical_water_level_m": 2.8,
        "historical_flood_count": 11,
        "is_simulated": True
    },
    {
        "id": "LOC-002",
        "name": "Central Rail Underpass",
        "city": "Metropolitan District",
        "latitude": 13.0839,
        "longitude": 80.2755,
        "elevation_m": 2.1,
        "drainage_capacity_mmh": 20.0,
        "critical_water_level_m": 1.5,
        "historical_flood_count": 14,
        "is_simulated": True
    },
    {
        "id": "LOC-003",
        "name": "Velachery Lake Catchment",
        "city": "Metropolitan District",
        "latitude": 12.9815,
        "longitude": 80.2180,
        "elevation_m": 5.8,
        "drainage_capacity_mmh": 40.0,
        "critical_water_level_m": 3.2,
        "historical_flood_count": 9,
        "is_simulated": True
    },
    {
        "id": "LOC-004",
        "name": "Marina Coastal Foreshore",
        "city": "Metropolitan District",
        "latitude": 13.0475,
        "longitude": 80.2824,
        "elevation_m": 3.2,
        "drainage_capacity_mmh": 45.0,
        "critical_water_level_m": 2.5,
        "historical_flood_count": 7,
        "is_simulated": True
    },
    {
        "id": "LOC-005",
        "name": "North Industrial Culvert",
        "city": "Metropolitan District",
        "latitude": 13.1420,
        "longitude": 80.2110,
        "elevation_m": 7.4,
        "drainage_capacity_mmh": 50.0,
        "critical_water_level_m": 3.0,
        "historical_flood_count": 5,
        "is_simulated": True
    },
    {
        "id": "LOC-006",
        "name": "Old Town Commercial Basin",
        "city": "Metropolitan District",
        "latitude": 13.0612,
        "longitude": 80.2520,
        "elevation_m": 3.8,
        "drainage_capacity_mmh": 28.0,
        "critical_water_level_m": 2.2,
        "historical_flood_count": 12,
        "is_simulated": True
    },
    {
        "id": "LOC-007",
        "name": "Tech Corridor Canal Sluice",
        "city": "Metropolitan District",
        "latitude": 12.9249,
        "longitude": 80.2280,
        "elevation_m": 6.2,
        "drainage_capacity_mmh": 38.0,
        "critical_water_level_m": 2.9,
        "historical_flood_count": 6,
        "is_simulated": True
    },
    {
        "id": "LOC-008",
        "name": "Western Bypass Embankment",
        "city": "Metropolitan District",
        "latitude": 13.0450,
        "longitude": 80.1600,
        "elevation_m": 11.5,
        "drainage_capacity_mmh": 55.0,
        "critical_water_level_m": 3.5,
        "historical_flood_count": 3,
        "is_simulated": True
    },
    {
        "id": "LOC-009",
        "name": "Harbor Dock Gate Lowland",
        "city": "Metropolitan District",
        "latitude": 13.0980,
        "longitude": 80.2980,
        "elevation_m": 2.5,
        "drainage_capacity_mmh": 30.0,
        "critical_water_level_m": 1.8,
        "historical_flood_count": 10,
        "is_simulated": True
    },
    {
        "id": "LOC-010",
        "name": "South Valley Foothills",
        "city": "Metropolitan District",
        "latitude": 12.8900,
        "longitude": 80.1750,
        "elevation_m": 18.0,
        "drainage_capacity_mmh": 65.0,
        "critical_water_level_m": 4.2,
        "historical_flood_count": 2,
        "is_simulated": True
    }
]

def load_locations() -> List[Dict[str, Any]]:
    if not os.path.exists(LOCATIONS_FILE):
        return DEFAULT_LOCATIONS

    try:
        locations = []
        with open(LOCATIONS_FILE, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                locations.append({
                    "id": row["id"],
                    "name": row["name"],
                    "city": row.get("city", "Metropolitan District"),
                    "latitude": float(row["latitude"]),
                    "longitude": float(row["longitude"]),
                    "elevation_m": float(row["elevation_m"]),
                    "drainage_capacity_mmh": float(row["drainage_capacity_mmh"]),
                    "critical_water_level_m": float(row["critical_water_level_m"]),
                    "historical_flood_count": int(row.get("historical_flood_count", 0)),
                    "is_simulated": row.get("is_simulated", "true").lower() == "true"
                })
        return locations if locations else DEFAULT_LOCATIONS
    except Exception as e:
        print(f"[DataLoader] Warning reading {LOCATIONS_FILE}: {e}. Using fallback defaults.")
        return DEFAULT_LOCATIONS

def get_location_by_id(loc_id: str) -> Optional[Dict[str, Any]]:
    locations = load_locations()
    for loc in locations:
        if loc["id"].lower() == loc_id.lower():
            return loc
    return None

def load_historical_data() -> List[Dict[str, Any]]:
    if not os.path.exists(HISTORY_FILE):
        return []
    records = []
    try:
        with open(HISTORY_FILE, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                records.append({
                    "timestamp": row["timestamp"],
                    "location_id": row["location_id"],
                    "rainfall_last_hour": float(row["rainfall_last_hour"]),
                    "rainfall_accumulated_24h": float(row["rainfall_accumulated_24h"]),
                    "forecast_rainfall_next_6h": float(row["forecast_rainfall_next_6h"]),
                    "elevation_m": float(row["elevation_m"]),
                    "drainage_capacity_mmh": float(row["drainage_capacity_mmh"]),
                    "current_water_level_m": float(row["current_water_level_m"]),
                    "flood_occurred": int(row["flood_occurred"]),
                    "risk_score": float(row["risk_score"]),
                    "severity": row["severity"]
                })
        return records
    except Exception as e:
        print(f"[DataLoader] Error reading history: {e}")
        return []
