import sqlite3
import os
import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "alerts.db")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS alerts (
            id TEXT PRIMARY KEY,
            location_id TEXT NOT NULL,
            location_name TEXT NOT NULL,
            risk_level TEXT NOT NULL,
            risk_score REAL NOT NULL,
            rainfall_conditions TEXT NOT NULL,
            water_level_m REAL NOT NULL,
            status TEXT NOT NULL DEFAULT 'ACTIVE',
            recommended_action TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            acknowledged_at TEXT,
            is_simulated INTEGER NOT NULL DEFAULT 1
        )
    """)
    conn.commit()

    # Seed baseline demonstration alerts if empty
    cursor.execute("SELECT COUNT(*) as count FROM alerts")
    count = cursor.fetchone()["count"]
    if count == 0:
        seed_alerts = [
            (
                "ALT-101",
                "LOC-002",
                "Central Rail Underpass",
                "HIGH",
                88.5,
                "Intense precipitation 48.5 mm/h; 24h total 120mm",
                1.95,
                "ACTIVE",
                "Deploy warning barricades and activate high-flow auxiliary sump pumps immediately.",
                datetime.now(timezone.utc).isoformat(),
                None,
                1
            ),
            (
                "ALT-102",
                "LOC-001",
                "Adyar River Basin Lowland",
                "HIGH",
                81.2,
                "River telemetry reaching 2.7m (critical 2.8m)",
                2.72,
                "ACTIVE",
                "Notify regional emergency management cell and inspect embankment revetments.",
                datetime.now(timezone.utc).isoformat(),
                None,
                1
            ),
            (
                "ALT-103",
                "LOC-006",
                "Old Town Commercial Basin",
                "HIGH",
                76.4,
                "Silt buildup observed; drainage capacity constrained",
                2.15,
                "ACTIVE",
                "Pre-position mobile dewatering crews; notify merchant associations.",
                datetime.now(timezone.utc).isoformat(),
                None,
                1
            ),
            (
                "ALT-104",
                "LOC-003",
                "Velachery Lake Catchment",
                "MEDIUM",
                53.4,
                "Moderate surface runoff into arterial drainage channel",
                2.30,
                "ACTIVE",
                "Inspect sluice gates and clear surface trash racks.",
                datetime.now(timezone.utc).isoformat(),
                None,
                1
            ),
            (
                "ALT-105",
                "LOC-009",
                "Harbor Dock Gate Lowland",
                "MEDIUM",
                59.8,
                "High coastal tide coinciding with local cloudband",
                1.55,
                "ACKNOWLEDGED",
                "Deploy temporary sandbag perimeter around critical electrical transformers.",
                datetime.now(timezone.utc).isoformat(),
                datetime.now(timezone.utc).isoformat(),
                1
            )
        ]
        cursor.executemany("""
            INSERT INTO alerts (
                id, location_id, location_name, risk_level, risk_score,
                rainfall_conditions, water_level_m, status, recommended_action,
                timestamp, acknowledged_at, is_simulated
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, seed_alerts)
        conn.commit()
    conn.close()

# Initialize DB on module import
init_db()

def get_alerts(status_filter: Optional[str] = None, location_filter: Optional[str] = None) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    query = "SELECT * FROM alerts WHERE 1=1"
    params = []

    if status_filter:
        query += " AND status = ?"
        params.append(status_filter.upper())
    if location_filter:
        query += " AND location_id = ?"
        params.append(location_filter)

    query += " ORDER BY timestamp DESC"
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    alerts = []
    for row in rows:
        alerts.append({
            "id": row["id"],
            "location_id": row["location_id"],
            "location_name": row["location_name"],
            "risk_level": row["risk_level"],
            "risk_score": float(row["risk_score"]),
            "rainfall_conditions": row["rainfall_conditions"],
            "water_level_m": float(row["water_level_m"]),
            "status": row["status"],
            "recommended_action": row["recommended_action"],
            "timestamp": row["timestamp"],
            "acknowledged_at": row["acknowledged_at"],
            "is_simulated": bool(row["is_simulated"])
        })
    return alerts

def create_alert(
    location_id: str,
    location_name: str,
    risk_level: str,
    risk_score: float,
    rainfall_conditions: str,
    water_level_m: float,
    recommended_action: str,
    is_simulated: bool = True
) -> Dict[str, Any]:
    alert_id = f"ALT-{uuid.uuid4().hex[:6].upper()}"
    now_iso = datetime.now(timezone.utc).isoformat()
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO alerts (
            id, location_id, location_name, risk_level, risk_score,
            rainfall_conditions, water_level_m, status, recommended_action,
            timestamp, acknowledged_at, is_simulated
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?, NULL, ?)
    """, (
        alert_id, location_id, location_name, risk_level, risk_score,
        rainfall_conditions, water_level_m, recommended_action, now_iso, int(is_simulated)
    ))
    conn.commit()
    conn.close()

    return {
        "id": alert_id,
        "location_id": location_id,
        "location_name": location_name,
        "risk_level": risk_level,
        "risk_score": risk_score,
        "rainfall_conditions": rainfall_conditions,
        "water_level_m": water_level_m,
        "status": "ACTIVE",
        "recommended_action": recommended_action,
        "timestamp": now_iso,
        "acknowledged_at": None,
        "is_simulated": is_simulated
    }

def acknowledge_alert(alert_id: str) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    now_iso = datetime.now(timezone.utc).isoformat()
    cursor.execute("""
        UPDATE alerts
        SET status = 'ACKNOWLEDGED', acknowledged_at = ?
        WHERE id = ?
    """, (now_iso, alert_id))
    conn.commit()

    cursor.execute("SELECT * FROM alerts WHERE id = ?", (alert_id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        return None

    return {
        "id": row["id"],
        "location_id": row["location_id"],
        "location_name": row["location_name"],
        "risk_level": row["risk_level"],
        "risk_score": float(row["risk_score"]),
        "rainfall_conditions": row["rainfall_conditions"],
        "water_level_m": float(row["water_level_m"]),
        "status": row["status"],
        "recommended_action": row["recommended_action"],
        "timestamp": row["timestamp"],
        "acknowledged_at": row["acknowledged_at"],
        "is_simulated": bool(row["is_simulated"])
    }
