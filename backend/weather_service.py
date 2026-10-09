import httpx
from datetime import datetime, timezone
from typing import Dict, Any, List

OPEN_METEO_BASE_URL = "https://api.open-meteo.com/v1/forecast"

def generate_fallback_weather(lat: float, lon: float) -> Dict[str, Any]:
    """Generates realistic fallback meteorological data if Open-Meteo is unreachable."""
    now_iso = datetime.now(timezone.utc).isoformat()
    hourly_data = []
    current_hour = datetime.now().hour

    for i in range(24):
        h = (current_hour + i) % 24
        # Simulated tropical/urban rain curve with peak around afternoon/evening
        precip = round(max(0.0, 14.0 * (1.0 - abs(h - 15) / 10.0) + (i % 3) * 1.5), 1)
        prob = min(95, max(10, int(precip * 6 + 15)))
        temp = round(28.0 - (abs(h - 14) * 0.4), 1)
        hourly_data.append({
            "time": f"T+{i:02d}h",
            "precipitation": precip,
            "precipitation_probability": prob,
            "temperature_2m": temp
        })

    accumulated = round(sum(p["precipitation"] for p in hourly_data[:24]), 1)

    return {
        "latitude": round(lat, 4),
        "longitude": round(lon, 4),
        "elevation": 12.0,
        "current": {
            "temperature_2m": 29.4,
            "relative_humidity_2m": 84.0,
            "precipitation": 8.5,
            "rain": 8.5,
            "weather_code": 63,  # moderate rain
            "wind_speed_10m": 18.2,
            "apparent_temperature": 34.1
        },
        "hourly": hourly_data,
        "accumulated_24h_mm": accumulated,
        "is_fallback": True,
        "source": "Simulated Weather Model (Fallback Mode)",
        "timestamp": now_iso
    }

async def fetch_weather_forecast(lat: float, lon: float) -> Dict[str, Any]:
    """Retrieves forecast from Open-Meteo API or gracefully degrades to fallback."""
    params = {
        "latitude": lat,
        "longitude": lon,
        "current": "temperature_2m,relative_humidity_2m,precipitation,rain,weather_code,wind_speed_10m,apparent_temperature",
        "hourly": "precipitation,precipitation_probability,temperature_2m",
        "forecast_days": 2,
        "timezone": "auto"
    }

    try:
        async with httpx.AsyncClient(timeout=4.0) as client:
            resp = await client.get(OPEN_METEO_BASE_URL, params=params)
            if resp.status_code == 200:
                data = resp.json()
                current_data = data.get("current", {})
                hourly_raw = data.get("hourly", {})
                times = hourly_raw.get("time", [])[:24]
                precips = hourly_raw.get("precipitation", [])[:24]
                probs = hourly_raw.get("precipitation_probability", [])[:24]
                temps = hourly_raw.get("temperature_2m", [])[:24]

                hourly_formatted: List[Dict[str, Any]] = []
                for idx, t in enumerate(times):
                    p_val = precips[idx] if idx < len(precips) else 0.0
                    prob_val = probs[idx] if idx < len(probs) else 0.0
                    temp_val = temps[idx] if idx < len(temps) else 25.0
                    # format time e.g. 14:00
                    time_label = t.split("T")[-1][:5] if "T" in t else f"+{idx}h"
                    hourly_formatted.append({
                        "time": time_label,
                        "precipitation": float(p_val) if p_val is not None else 0.0,
                        "precipitation_probability": float(prob_val) if prob_val is not None else 0.0,
                        "temperature_2m": float(temp_val) if temp_val is not None else 25.0
                    })

                accumulated = round(sum(h["precipitation"] for h in hourly_formatted), 1)

                return {
                    "latitude": data.get("latitude", lat),
                    "longitude": data.get("longitude", lon),
                    "elevation": data.get("elevation", 0.0),
                    "current": current_data,
                    "hourly": hourly_formatted,
                    "accumulated_24h_mm": accumulated,
                    "is_fallback": False,
                    "source": "Open-Meteo Real-time Forecast API",
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }
            else:
                return generate_fallback_weather(lat, lon)
    except Exception as e:
        print(f"[WeatherService] Open-Meteo API unreachable ({e}). Using deterministic fallback.")
        return generate_fallback_weather(lat, lon)
