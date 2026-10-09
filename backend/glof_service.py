"""
GLOF & Non-Rainfall Outburst Flood Prediction Engine
Specialized for Glacial Lake Outburst Floods (GLOF), Landslide Dam Outburst Floods (LDOF),
and Transboundary Surge Events in Nepal and Himalayan Basins.
"""

from typing import List, Dict, Any, Optional
import math
from datetime import datetime, timezone

# Monitored high-hazard basins in Nepal and the Himalayas
MONITORED_GLOF_BASINS: List[Dict[str, Any]] = [
    {
        "id": "NEP-GLOF-001",
        "name": "Thame / Bhote Koshi Basin",
        "region": "Solukhumbu (Everest Region), Nepal",
        "hazard_type": "Glacial Lake Outburst (GLOF) & Moraine Breach",
        "latitude": 27.8333,
        "longitude": 86.6500,
        "elevation_m": 3820.0,
        "lake_volume_million_m3": 2.4,
        "moraine_stability_index": 28.0,  # 0 to 100 (lower = critical instability)
        "rate_of_rise_m_per_hour": 1.25,  # dh/dt upstream gauge
        "temperature_anomaly_c": 3.8,     # degrees C above seasonal cryosphere norm
        "acoustic_vibration_level": 8.4,   # 0 to 10 riverbed geophone scale
        "insar_creep_rate_mm_yr": 42.0,    # mm/yr satellite radar deformation
        "downstream_settlement": "Thame Village & Namche Bazaar",
        "distance_to_settlement_km": 14.5,
        "population_at_risk": 2400,
        "status": "CRITICAL_SURGE",
        "case_study_notes": "Site of the catastrophic August 16, 2024 outburst where two moraine-dammed proglacial lakes breached without rainfall, destroying infrastructure downstream.",
        "early_warning_sirens_installed": True,
        "lake_freeboard_m": 0.8
    },
    {
        "id": "NEP-GLOF-002",
        "name": "Tsho Rolpa Glacial Lake",
        "region": "Rolwaling Valley, Dolakha District, Nepal",
        "hazard_type": "Moraine-Dammed Glacial Lake",
        "latitude": 27.8711,
        "longitude": 86.4783,
        "elevation_m": 4580.0,
        "lake_volume_million_m3": 85.9,
        "moraine_stability_index": 42.0,
        "rate_of_rise_m_per_hour": 0.35,
        "temperature_anomaly_c": 2.1,
        "acoustic_vibration_level": 3.2,
        "insar_creep_rate_mm_yr": 18.5,
        "downstream_settlement": "Na, Beding & Bhote Koshi Valley",
        "distance_to_settlement_km": 32.0,
        "population_at_risk": 11500,
        "status": "ELEVATED_WATCH",
        "case_study_notes": "Nepal's largest dangerous glacial lake. Partially drained by 3.5m in 2000 via a cutting channel, but retains ~86M m³ of water retained by fragile moraine.",
        "early_warning_sirens_installed": True,
        "lake_freeboard_m": 2.4
    },
    {
        "id": "NEP-GLOF-003",
        "name": "Imja Tsho (Imja Glacial Lake)",
        "region": "Khumbu, Sagarmatha National Park, Nepal",
        "hazard_type": "Expanding Proglacial Lake",
        "latitude": 27.9000,
        "longitude": 86.9200,
        "elevation_m": 5010.0,
        "lake_volume_million_m3": 75.0,
        "moraine_stability_index": 54.0,
        "rate_of_rise_m_per_hour": 0.20,
        "temperature_anomaly_c": 1.9,
        "acoustic_vibration_level": 2.5,
        "insar_creep_rate_mm_yr": 12.0,
        "downstream_settlement": "Dingboche, Pangboche & Dudh Koshi Valley",
        "distance_to_settlement_km": 28.0,
        "population_at_risk": 9800,
        "status": "MONITORED_STABLE",
        "case_study_notes": "Lowered by 3.4m in 2016 through Nepal Army engineering works. Continues to be continuously monitored via automatic weather and lake stations.",
        "early_warning_sirens_installed": True,
        "lake_freeboard_m": 3.1
    },
    {
        "id": "NEP-GLOF-004",
        "name": "Melamchi Landslide Dam Basin",
        "region": "Sindhupalchok, Bagmati Province, Nepal",
        "hazard_type": "Landslide Dam Outburst Flood (LDOF) & Debris Flow",
        "latitude": 27.9400,
        "longitude": 85.5800,
        "elevation_m": 2450.0,
        "lake_volume_million_m3": 4.5,
        "moraine_stability_index": 31.0,
        "rate_of_rise_m_per_hour": 1.10,
        "temperature_anomaly_c": 1.4,
        "acoustic_vibration_level": 7.8,
        "insar_creep_rate_mm_yr": 55.0,
        "downstream_settlement": "Helambu & Melamchi Bazar",
        "distance_to_settlement_km": 19.0,
        "population_at_risk": 6200,
        "status": "CRITICAL_SURGE",
        "case_study_notes": "Site of June 2021 disaster where an upstream high-altitude rockfall dammed the river canyon, triggering a devastating debris surge wave downstream under blue skies.",
        "early_warning_sirens_installed": True,
        "lake_freeboard_m": 1.0
    },
    {
        "id": "NEP-GLOF-005",
        "name": "Sunkoshi River Gorge Blockage",
        "region": "Jure, Sindhupalchok, Nepal",
        "hazard_type": "Landslide Damming & Transboundary Inflow",
        "latitude": 27.7600,
        "longitude": 85.8700,
        "elevation_m": 1150.0,
        "lake_volume_million_m3": 6.8,
        "moraine_stability_index": 48.0,
        "rate_of_rise_m_per_hour": 0.45,
        "temperature_anomaly_c": 0.8,
        "acoustic_vibration_level": 4.1,
        "insar_creep_rate_mm_yr": 22.0,
        "downstream_settlement": "Barhabise & Khadichaur Settlements",
        "distance_to_settlement_km": 12.0,
        "population_at_risk": 4500,
        "status": "ELEVATED_WATCH",
        "case_study_notes": "Recurrent landslide damming zone on the Araniko Highway. Upstream headwaters extend across the border into Tibet, making transboundary telemetry vital.",
        "early_warning_sirens_installed": True,
        "lake_freeboard_m": 1.8
    },
    {
        "id": "NEP-GLOF-006",
        "name": "Seti River Sub-surface Outburst",
        "region": "Annapurna Range / Kaski, Pokhara, Nepal",
        "hazard_type": "Ice-Rock Avalanche Dam Break",
        "latitude": 28.4000,
        "longitude": 83.9500,
        "elevation_m": 2900.0,
        "lake_volume_million_m3": 3.2,
        "moraine_stability_index": 52.0,
        "rate_of_rise_m_per_hour": 0.30,
        "temperature_anomaly_c": 2.6,
        "acoustic_vibration_level": 3.6,
        "insar_creep_rate_mm_yr": 16.0,
        "downstream_settlement": "Kharapani & Northern Pokhara Valley",
        "distance_to_settlement_km": 25.0,
        "population_at_risk": 8200,
        "status": "MONITORED_STABLE",
        "case_study_notes": "Modeled after the 2012 Seti surge caused by rockfall blocking a sub-surface ice canyon. Zero rainfall accompanied the catastrophic flood.",
        "early_warning_sirens_installed": False,
        "lake_freeboard_m": 2.2
    }
]

def calculate_glof_risk(
    lake_volume_million_m3: float,
    rate_of_rise_m_per_hour: float,
    moraine_stability_index: float,
    temperature_anomaly_c: float,
    acoustic_vibration_level: float,
    insar_creep_rate_mm_yr: float,
    distance_to_settlement_km: float,
    rainfall_mm: float = 0.0
) -> Dict[str, Any]:
    """
    Computes GLOF / Outburst flood risk explicitly designed for non-rainfall flash flood dynamics.
    Even with rainfall_mm = 0.0, non-rainfall factors determine the true physical hazard.
    """
    # 1. Rate of water level rise subscore (dh/dt is primary non-rain alert indicator)
    # > 1.0 m/h is extreme surge
    if rate_of_rise_m_per_hour <= 0.05:
        score_rise = 5.0
    elif rate_of_rise_m_per_hour <= 0.3:
        score_rise = 10.0 + (rate_of_rise_m_per_hour - 0.05) / 0.25 * 30.0
    elif rate_of_rise_m_per_hour <= 0.8:
        score_rise = 40.0 + (rate_of_rise_m_per_hour - 0.3) / 0.5 * 35.0
    else:
        score_rise = min(100.0, 75.0 + (rate_of_rise_m_per_hour - 0.8) / 0.7 * 25.0)

    # 2. Moraine/Dam instability subscore (lower stability = higher risk)
    # moraine_stability_index is 0 to 100 (where 0 is impending breach)
    score_moraine = max(0.0, min(100.0, 100.0 - moraine_stability_index))

    # 3. Impounded Lake Volume subscore
    # > 10 million m3 can cause regional devastation; even 1-2 million m3 destroys valleys
    if lake_volume_million_m3 <= 0.5:
        score_volume = 15.0
    elif lake_volume_million_m3 <= 5.0:
        score_volume = 15.0 + (lake_volume_million_m3 - 0.5) / 4.5 * 45.0
    elif lake_volume_million_m3 <= 30.0:
        score_volume = 60.0 + (lake_volume_million_m3 - 5.0) / 25.0 * 25.0
    else:
        score_volume = min(100.0, 85.0 + (lake_volume_million_m3 - 30.0) / 50.0 * 15.0)

    # 4. Temperature anomaly / cryosphere melt rate (+ degrees C above normal)
    # Higher thermal spike accelerates ice core thaw and glacier meltwater
    if temperature_anomaly_c <= 0.0:
        score_temp = 10.0
    elif temperature_anomaly_c <= 2.0:
        score_temp = 10.0 + (temperature_anomaly_c / 2.0) * 35.0
    elif temperature_anomaly_c <= 4.0:
        score_temp = 45.0 + ((temperature_anomaly_c - 2.0) / 2.0) * 35.0
    else:
        score_temp = min(100.0, 80.0 + (temperature_anomaly_c - 4.0) * 10.0)

    # 5. Acoustic / seismic riverbed vibration (0 to 10 scale)
    # > 6.0 indicates heavy bedload boulder transport and upstream debris flow underway
    score_acoustic = min(100.0, max(0.0, acoustic_vibration_level * 10.0))

    # 6. InSAR Satellite deformation creep rate (mm/yr)
    # > 30 mm/yr signifies rapid displacement of moraine embankment
    if insar_creep_rate_mm_yr <= 5.0:
        score_insar = 10.0
    elif insar_creep_rate_mm_yr <= 20.0:
        score_insar = 10.0 + (insar_creep_rate_mm_yr - 5.0) / 15.0 * 35.0
    elif insar_creep_rate_mm_yr <= 40.0:
        score_insar = 45.0 + (insar_creep_rate_mm_yr - 20.0) / 20.0 * 35.0
    else:
        score_insar = min(100.0, 80.0 + (insar_creep_rate_mm_yr - 40.0) * 1.0)

    # Weights for non-rainfall GLOF assessment
    weights = {
        "rate_of_rise": 0.28,      # Critical real-time sensor for sudden surge
        "moraine_stability": 0.22, # Geotechnical integrity of the dam
        "lake_volume": 0.18,       # Water mass available to discharge
        "acoustic_vibration": 0.14, # Real-time geophone debris flow signal
        "insar_creep": 0.10,       # Satellite structural deformation
        "temperature_anomaly": 0.08# Cryospheric melt driver
    }

    final_score = (
        weights["rate_of_rise"] * score_rise +
        weights["moraine_stability"] * score_moraine +
        weights["lake_volume"] * score_volume +
        weights["acoustic_vibration"] * score_acoustic +
        weights["insar_creep"] * score_insar +
        weights["temperature_anomaly"] * score_temp
    )
    final_score = round(max(0.0, min(100.0, final_score)), 1)

    if final_score >= 70.0:
        risk_level = "CRITICAL"
    elif final_score >= 50.0:
        risk_level = "HIGH"
    elif final_score >= 30.0:
        risk_level = "MEDIUM"
    else:
        risk_level = "LOW"

    # Hydrodynamic breach approximation (Froehlich breach model for peak discharge)
    # Peak discharge Qp ≈ 0.607 * Vw^0.295 * hw^1.24 (approximate empirical envelope)
    # Using volume in m3 and estimated hydrostatic head hw ≈ 25m
    vol_m3 = max(0.1, lake_volume_million_m3) * 1_000_000.0
    hw = 20.0 + min(30.0, lake_volume_million_m3 * 1.5)
    qp_breach = round(0.607 * (vol_m3 ** 0.295) * (hw ** 1.24), 1)

    # Wave routing downstream
    # Velocity in steep Himalayan gorge ~ 5.5 to 9.0 m/s (20 - 32 km/h)
    velocity_ms = 6.8
    velocity_kmh = velocity_ms * 3.6
    dist_km = max(1.0, distance_to_settlement_km)
    travel_time_hours = dist_km / velocity_kmh
    lead_time_minutes = round(travel_time_hours * 60.0, 1)

    # Surge wave crest height at downstream settlement
    # Attenuation with distance: H ≈ H0 * (d0 / d)^0.35
    initial_crest_m = min(18.0, 4.0 + (qp_breach / 450.0))
    crest_height_m = round(max(1.2, initial_crest_m * ((5.0 / max(5.0, dist_km)) ** 0.35)), 2)

    # Action Directives
    directives = []
    if risk_level == "CRITICAL":
        directives.append("IMMEDIATE EVACUATION ORDER: Sound riverside sirens across downstream valleys.")
        directives.append(f"Move all personnel above +30m vertical contour line. Wave arrival in ~{lead_time_minutes} minutes.")
        directives.append("Shut down valley suspension bridges, hydropower intake canals, and low-lying highway corridors.")
        directives.append("Dispatch satellite high-priority emergency bulletin to disaster management command.")
    elif risk_level == "HIGH":
        directives.append("ALERT CIVIC DEFENSE: Mobilize rapid response teams and clear riverside riverbeds.")
        directives.append("Activate automated ultrasonic upstream gauge polling at 30-second intervals.")
        directives.append("Notify downstream hydropower installations to open bottom sluice gates to prevent dam surcharge.")
    elif risk_level == "MEDIUM":
        directives.append("ADVISORY: Monitor InSAR deformation creep and acoustic geophone signals closely.")
        directives.append("Inspect moraine siphons and spillway channel freeboard for blockages.")
    else:
        directives.append("NORMAL REGIME: Cryospheric sensors reporting baseline stability.")
        directives.append("Continue routine satellite optical & SAR monitoring cycle.")

    factors = [
        {
            "name": "Upstream Surge Rate (dh/dt)",
            "value": rate_of_rise_m_per_hour,
            "unit": "m/hr",
            "score": round(score_rise, 1),
            "weight": 28,
            "status": "DANGER" if score_rise >= 70 else ("WARNING" if score_rise >= 40 else "NORMAL"),
            "desc": "Detects sudden water volume surge upstream without local rain"
        },
        {
            "name": "Moraine Dam Instability",
            "value": round(100.0 - moraine_stability_index, 1),
            "unit": "index (0-100)",
            "score": round(score_moraine, 1),
            "weight": 22,
            "status": "DANGER" if score_moraine >= 70 else ("WARNING" if score_moraine >= 40 else "NORMAL"),
            "desc": "Integrity of moraine/debris retaining impounded lake"
        },
        {
            "name": "Impounded Lake Volume",
            "value": lake_volume_million_m3,
            "unit": "Million m³",
            "score": round(score_volume, 1),
            "weight": 18,
            "status": "DANGER" if score_volume >= 70 else ("WARNING" if score_volume >= 40 else "NORMAL"),
            "desc": "Total potential hydrostatic energy and flood mass"
        },
        {
            "name": "Riverbed Acoustic Vibration",
            "value": acoustic_vibration_level,
            "unit": "Geophone Index (0-10)",
            "score": round(score_acoustic, 1),
            "weight": 14,
            "status": "DANGER" if score_acoustic >= 70 else ("WARNING" if score_acoustic >= 40 else "NORMAL"),
            "desc": "High-frequency ground tremors indicating upstream debris avalanche"
        },
        {
            "name": "Satellite InSAR Moraine Creep",
            "value": insar_creep_rate_mm_yr,
            "unit": "mm/year",
            "score": round(score_insar, 1),
            "weight": 10,
            "status": "DANGER" if score_insar >= 70 else ("WARNING" if score_insar >= 40 else "NORMAL"),
            "desc": "Radar-measured millimeter deformation of the moraine face"
        },
        {
            "name": "Cryosphere Thermal Anomaly",
            "value": temperature_anomaly_c,
            "unit": "°C above norm",
            "score": round(score_temp, 1),
            "weight": 8,
            "status": "DANGER" if score_temp >= 70 else ("WARNING" if score_temp >= 40 else "NORMAL"),
            "desc": "Excessive heat melting ice core and glaciers during dry weather"
        }
    ]

    return {
        "risk_score": final_score,
        "risk_level": risk_level,
        "rainfall_condition": f"{rainfall_mm} mm (Zero Rainfall Flood Event)",
        "evacuation_lead_time_minutes": lead_time_minutes,
        "peak_discharge_m3s": qp_breach,
        "surge_crest_height_m": crest_height_m,
        "wave_velocity_kmh": round(velocity_kmh, 1),
        "contributing_factors": factors,
        "action_directives": directives,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

def simulate_dam_break_hydrograph(
    lake_volume_million_m3: float,
    breach_height_m: float,
    breach_width_m: float,
    distance_km: float,
    channel_slope: float = 0.04,
    mannings_n: float = 0.055
) -> Dict[str, Any]:
    """
    Simulates breach outflow hydrograph and downstream flood wave propagation.
    Based on simplified Froehlich / USACE dam break formulations for steep alpine valleys.
    """
    vol_m3 = max(0.1, lake_volume_million_m3) * 1_000_000.0
    hw = max(5.0, breach_height_m)
    bw = max(5.0, breach_width_m)

    # Peak outflow discharge Qp (Froehlich 1995: Qp = 0.607 * Vw^0.295 * hw^1.24)
    peak_qp = 0.607 * (vol_m3 ** 0.295) * (hw ** 1.24)
    # Width adjustment factor
    width_factor = min(2.0, max(0.6, bw / 30.0))
    peak_discharge_breach = round(peak_qp * width_factor, 1)

    # Wave velocity via kinematic wave in steep mountain channel:
    # v ≈ (1 / n) * R^(2/3) * S^(1/2), typically 6.0 to 10.5 m/s in Himalayas
    slope = max(0.01, min(0.15, channel_slope))
    v_ms = max(4.5, min(11.5, 6.2 * math.sqrt(slope / 0.04) * (0.055 / mannings_n)))
    v_kmh = round(v_ms * 3.6, 1)

    dist = max(1.0, distance_km)
    travel_time_min = round((dist / v_kmh) * 60.0, 1)

    # Discharge attenuation downstream: Q(x) = Q0 * exp(-k * x)
    attenuation_factor = math.exp(-0.012 * dist)
    downstream_peak_q = round(peak_discharge_breach * attenuation_factor, 1)

    # Peak water stage (crest height) downstream: y ≈ (Q / (B * v))
    estimated_valley_width = 45.0 + dist * 1.5
    crest_depth_m = round(max(1.0, downstream_peak_q / (estimated_valley_width * v_ms)), 2)

    # Generate breach hydrograph at settlement (time in minutes vs discharge in m³/s)
    hydrograph = []
    # Total event duration around 120-180 minutes
    start_arrival = max(0.0, travel_time_min)
    peak_time = start_arrival + max(8.0, 15.0 * (hw / 25.0))
    recession_time = peak_time + max(40.0, travel_time_min * 1.8)

    time_steps = [
        0,
        round(start_arrival * 0.5, 1),
        round(start_arrival, 1),
        round(start_arrival + (peak_time - start_arrival) * 0.5, 1),
        round(peak_time, 1),
        round(peak_time + 15, 1),
        round(peak_time + 35, 1),
        round(recession_time, 1),
        round(recession_time + 40, 1)
    ]
    # Deduplicate and sort
    time_steps = sorted(list(set(time_steps)))

    base_flow = round(25.0 + lake_volume_million_m3 * 2.0, 1)
    for t in time_steps:
        if t < start_arrival:
            q = base_flow
        elif t <= peak_time:
            ratio = (t - start_arrival) / max(0.1, (peak_time - start_arrival))
            q = base_flow + (downstream_peak_q - base_flow) * (ratio ** 1.8)
        elif t <= recession_time:
            ratio = (t - peak_time) / max(0.1, (recession_time - peak_time))
            q = base_flow + (downstream_peak_q - base_flow) * math.exp(-2.2 * ratio)
        else:
            q = base_flow + 15.0

        hydrograph.append({
            "time_minutes": t,
            "discharge_m3s": round(q, 1),
            "estimated_depth_m": round(max(0.5, q / (estimated_valley_width * v_ms)), 2)
        })

    return {
        "lake_volume_million_m3": lake_volume_million_m3,
        "breach_peak_discharge_m3s": peak_discharge_breach,
        "downstream_peak_discharge_m3s": downstream_peak_q,
        "wave_velocity_ms": round(v_ms, 2),
        "wave_velocity_kmh": v_kmh,
        "arrival_time_minutes": travel_time_min,
        "peak_crest_depth_m": crest_depth_m,
        "downstream_distance_km": dist,
        "hydrograph": hydrograph,
        "severity": "CATASTROPHIC" if crest_depth_m >= 6.0 else ("SEVERE" if crest_depth_m >= 3.0 else "MODERATE"),
        "evacuation_urgency": "RED_ALERT_EVACUATE_NOW" if travel_time_min <= 45.0 else "YELLOW_ALERT_PREPARE"
    }

GLOF_SOLUTIONS_GUIDE = [
    {
        "category": "Early Warning Telemetry (Non-Rainfall)",
        "icon": "Radio",
        "solutions": [
            {
                "title": "Acoustic Riverbed Geophones",
                "problem_solved": "Traditional rain gauges show 0 mm when a glacial outburst occurs 20 km upstream.",
                "engineering_details": "Sensors anchored into bedrock detect high-frequency acoustic rumble (10–50 Hz) produced by boulder bedload transport and debris flow waves 20–40 minutes before surface flood arrival."
            },
            {
                "title": "Upstream Ultrasonic & Radar dh/dt Gauges",
                "problem_solved": "Water surges without warning in narrow mountain gorges.",
                "engineering_details": "Non-contact radar gauges measure the rate of rise (dh/dt). If rate exceeds 0.8 m/hour under dry weather conditions, early warning alerts are autonomously broadcast to downstream villages."
            },
            {
                "title": "Satellite InSAR Moraine Deformation Tracking",
                "problem_solved": "Sudden moraine collapse from permafrost degradation and sub-surface hydrostatic pressure.",
                "engineering_details": "Interferometric Synthetic Aperture Radar (Sentinel-1 SAR & L-band) analyzes millimeter-scale displacement of moraine embankments to detect slope failure weeks in advance."
            }
        ]
    },
    {
        "category": "Physical Engineering Mitigation",
        "icon": "Shovel",
        "solutions": [
            {
                "title": "Controlled Lake Siphoning & Spillway Lowering",
                "problem_solved": "Excessive hydrostatic head pushing on fragile moraine dams.",
                "engineering_details": "As successfully implemented at Tsho Rolpa (lowered by 3.5m) and Imja Lake (lowered by 3.4m), excavated reinforced open-channel spillways and siphon pipes permanently decrease water volume and freeboard risk."
            },
            {
                "title": "Debris Filtration Check Dams & Retention Basins",
                "problem_solved": "Glacial floods become hyper-concentrated debris flows carrying boulders up to 5 meters wide.",
                "engineering_details": "Slit-type and open grid steel check dams placed in upstream tributary canyons trap large boulders while allowing harmless base flow to pass."
            }
        ]
    },
    {
        "category": "Transboundary & Civic Governance",
        "icon": "Globe",
        "solutions": [
            {
                "title": "Transboundary Telemetry API Data Exchange",
                "problem_solved": "Glacial lakes and cloudbursts originate in Tibet (China) and surge into Nepal, or from Nepal into India.",
                "engineering_details": "Automated regional data-sharing protocols (ICIMOD HKH-HYCOS) relaying real-time discharge and barrage gate positions cross-border via machine-to-machine APIs."
            },
            {
                "title": "Community-Based Sirens & Demarcated Safe Contours",
                "problem_solved": "Communication lines often cut during mountain emergencies.",
                "engineering_details": "Direct VHF radio and satellite-linked sirens deployed in every village. Pre-surveyed evacuation paths guide citizens above designated +25m flood inundation contours within 20 minutes."
            }
        ]
    }
]
