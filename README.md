# FloodGuard AI — Intelligent Urban Flood Prediction System

**FloodGuard AI** is a full-stack, AI-powered disaster management and urban flood early-warning web application built for a 24-hour hackathon. The system analyzes real-time rainfall, Open-Meteo numerical weather forecasts, terrain elevation, drainage conduit capacities, canal water levels, and historical flood telemetry to calculate explainable localized flood risk, display live risk zones on interactive GIS maps, issue early-warning alerts, and recommend tactical municipal actions.

---

## 1. System Architecture

```text
       ┌────────────────────────────────────────────────────────────────────────┐
       │                           React.js Frontend                            │
       │   (Vite + Tailwind CSS + React-Leaflet + Recharts + GLOF Dashboard)    │
       └───────────────────────────────────┬────────────────────────────────────┘
                                           │ HTTP / JSON (Axios)
                                           ▼
       ┌────────────────────────────────────────────────────────────────────────┐
       │                            FastAPI Backend                             │
       │             (Python 3.13 / Uvicorn / Pydantic / Async I/O)             │
       └───┬───────────────────────┬─────────────────────┬──────────────────┬───┘
           │                       │                     │                  │
           ▼                       ▼                     ▼                  ▼
┌──────────────────────┐  ┌─────────────────┐  ┌───────────────────┐  ┌──────────────────────┐
│Explainable Risk Engine│ │Alert & Siren Box│  │  Weather Service  │  │ GLOF Outburst Engine │
│• Multi-factor weights│  │  (SQLite DB)    │  │ • Open-Meteo API  │  │ • Nepal GLOF Basins  │
│• Normalization math  │  │ • Persistent    │  │ • Fallback model  │  │ • dh/dt rate of rise │
│• Scikit-learn RF ML  │  │   bulletins     │  └───────────────────┘  │ • Dam-break physics  │
└──────────────────────┘  └─────────────────┘                         └──────────────────────┘
```

---

## 2. Technology Stack

### Frontend
* **React 19** with **Vite**
* **Tailwind CSS v4** for clean, disaster-management aesthetics
* **React Router v7** for single-page application routing
* **React-Leaflet & Leaflet** for GIS mapping
* **Recharts** for rainfall trend and risk distribution charts
* **Lucide React** for icons
* **Axios** for API requests

### Backend
* **Python** (3.13+)
* **FastAPI** & **Uvicorn**
* **Pydantic v2** for strict request/response data validation
* **Scikit-learn** Random Forest Classifier for ML ensemble flood probability
* **NumPy & Pandas** for hydrological data transformations
* **SQLite** for persisting alert records and acknowledgement history
* **HTTPX** for asynchronous weather forecasting

### Data & Integrations
* **Open-Meteo API**: Real-time hourly precipitation forecast and weather telemetry
* **CSV Datasets**: Monitored urban basin elevations and historical flood records

---

## 3. Application Pages

1. **Dashboard (`/`)**:
   - Monitored locations counter, high-risk zone counter, average precipitation gauge, active warnings.
   - Interactive GIS flood risk map with color-coded risk markers.
   - 24-hour rainfall trend area chart and risk distribution donut chart.
   - Active alerts table with inline acknowledgement controls.
   - Comprehensive location vulnerability matrix.

2. **Live Flood Map (`/map`)**:
   - Leaflet map with OpenStreetMap tiles.
   - Custom markers: Green (< 40, Low), Amber (40–69, Medium), Red (≥ 70, High).
   - Interactive popup cards showing water stage, critical limits, rainfall rate, and action directives.
   - Station inspection drawer showing coordinates, elevation, drainage capacity, and simulation shortcuts.

3. **Flood Prediction Engine (`/predict`)**:
   - Interactive hydrological input form: 1-hour rainfall, 24-hour accumulated rainfall, 6-hour forecast, elevation, drainage capacity, water level.
   - Preset buttons for instant demo: *Torrential Cloudburst (High)*, *Monsoon Downpour (Medium)*, *Dry Run (Low)*.
   - Normalized 0–100 risk score and category badge.
   - Contributing factor weight breakdown with progress meters.
   - Scikit-learn Random Forest model probability prediction.
   - Tactical municipal directives with heuristic disclaimers.

4. **Alerts & Warning Vault (`/alerts`)**:
   - Filterable list of flood warning bulletins (Status: Active / Acknowledged, Severity: High / Medium / Low).
   - Inline alert acknowledgement (`PATCH /api/alerts/{id}`).
   - **Simulated Alert Dispatcher Modal** allowing presenters and judges to trigger real-time alert broadcasts during demonstrations.

5. **Weather Monitoring (`/weather`)**:
   - Live Open-Meteo integration with automatic deterministic fallback.
   - Ambient temperature, apparent heat index, relative humidity, precipitation rate, and surface wind speed.
   - 24-hour precipitation depth and precipitation probability profile chart.
   - Chronological forecast matrix table.

6. **Action Protocols (`/recommendations`)**:
   - Standard Operating Procedures (SOP) across Tier 1 (Low), Tier 2 (Medium), and Tier 3 (High).
   - Detailed rationales for why each recommendation is required.
   - Interactive emergency deployment checklist for civic engineers.
   - Technical explanations for urban impermeable runoff, tidal locks, and conduit siltation.

7. **GLOF & Non-Rainfall Outburst Flood Engine (`/glof`)** *(New Block)*:
   - Early warning module designed specifically for flash floods with **zero local rainfall** (e.g., Nepal's Thame 2024 GLOF and Melamchi 2021 LDOF).
   - Real-time telemetry monitoring: Rate-of-rise ($dh/dt$), glacial lake volume, moraine stability, bedrock geophone vibrations (10–50 Hz), and Sentinel-1 InSAR creep rate ($mm/yr$).
   - Interactive Froehlich dam-break hydrograph simulator calculating downstream arrival time, wave velocity, peak discharge ($m^3/s$), and surge crest depth.
   - Sensor comparison matrix detailing why standard rain gauges fail and non-rainfall sensors succeed.
   - Direct broadcast integration to the central emergency Alert Vault.

---

## 4. Flood-Risk Scoring Formulation

### A. Urban Rainfall-Driven Risk Formulation:
The rainfall model normalizes 6 key hydrological parameters to a 0–100 scale:

$$\text{Risk Score} = \sum_{i=1}^{6} w_i \times \text{Subscore}_i$$

* **Rainfall Intensity (1h)** (20%): $0 \text{ mm} \rightarrow 0$, $\ge 65 \text{ mm/h} \rightarrow 100$
* **Accumulated Rainfall (24h)** (20%): $0 \text{ mm} \rightarrow 0$, $\ge 140 \text{ mm} \rightarrow 100$
* **Forecast Rainfall (6h)** (15%): $0 \text{ mm} \rightarrow 0$, $\ge 50 \text{ mm} \rightarrow 100$
* **Terrain Elevation Vulnerability** (15%): Inverted score ($> 20\text{m} \rightarrow 0$, $\le 1.5\text{m} \rightarrow 100$)
* **Drainage Vulnerability** (15%): Inverted score ($> 60\text{ mm/h} \rightarrow 0$, $\le 15\text{ mm/h} \rightarrow 100$)
* **Water Level Vulnerability** (15%): Ratio of current water level to critical bankfull depth ($ratio \ge 1.0 \rightarrow 100$)

### B. Non-Rainfall Glacial & Dam Outburst (GLOF) Formulation:
When $\text{Rainfall} = 0 \text{ mm}$, the GLOF engine utilizes non-precipitation physical parameters:

$$\text{GLOF Risk Score} = w_{dh/dt} S_{dh/dt} + w_{mor} S_{mor} + w_{vol} S_{vol} + w_{ac} S_{ac} + w_{sar} S_{sar} + w_{th} S_{th}$$

* **Upstream Rate-of-Rise ($dh/dt$)** (28%): $\le 0.05 \text{ m/h} \rightarrow 5$, $\ge 1.0 \text{ m/h} \rightarrow 100$
* **Moraine Dam Instability** (22%): $100 - \text{Stability Index}$
* **Impounded Lake Volume** (18%): $\le 0.5 \times 10^6\text{m}^3 \rightarrow 15$, $\ge 30 \times 10^6\text{m}^3 \rightarrow 100$
* **Bedrock Geophone Vibration** (14%): High-frequency boulder rumbling ($0 \text{ to } 10 \rightarrow 0 \text{ to } 100$)
* **InSAR Satellite Displacement Creep** (10%): $\le 5\text{ mm/yr} \rightarrow 10$, $\ge 40\text{ mm/yr} \rightarrow 100$
* **Cryosphere Thermal Anomaly** (8%): $+0^\circ\text{C} \rightarrow 10$, $\ge +4^\circ\text{C} \rightarrow 100$

### Risk Thresholds:
* **Low Risk**: $0 \le \text{Score} < 40$ (Green)
* **Medium Risk**: $40 \le \text{Score} < 70$ (Amber)
* **High / Critical Risk**: $70 \le \text{Score} \le 100$ (Red)

---

## 5. Setup & Execution Instructions

### Prerequisites
* Python 3.10+ (with pip)
* Node.js 18+ (with npm)

### Backend Setup

```bash
cd backend

# Create virtual environment (optional but recommended)
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
# source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run backend automated test suite
pytest test_backend.py -v

# Start FastAPI server
uvicorn main:app --reload --port 8000
```
Backend API docs available at: `http://localhost:8000/docs`

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```
Frontend accessible at: `http://localhost:5173`

---

## 6. Backend API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service health status and component checks |
| `GET` | `/api/locations` | Retrieve monitored urban stations and geographical metadata |
| `GET` | `/api/dashboard` | Aggregated dashboard stats, risk distributions, and trend data |
| `GET` | `/api/weather?lat={lat}&lon={lon}` | Retrieve Open-Meteo forecast with fallback support |
| `GET` | `/api/risk` | Current risk assessments for all stations |
| `POST` | `/api/predict` | Calculate flood risk score and run ML inference |
| `GET` | `/api/alerts` | Query active and historical flood alerts |
| `POST` | `/api/alerts` | Create and broadcast a new alert |
| `PATCH` | `/api/alerts/{alert_id}` | Acknowledge an active alert |

---

## 7. Two-Minute Hackathon Demo Script

* **0:00 – 0:25 (Problem & Overview)**:
  > "Urban flooding causes billions in damage and endangers lives due to delayed early-warnings and isolated sensor silos. We built **FloodGuard AI** — an end-to-end intelligent urban flood prediction system that unifies real-time weather radar, terrain elevation, canal water levels, and drainage capacity to calculate localized risk."

* **0:25 – 0:50 (Live Dashboard & GIS Map)**:
  > "On our dashboard, we monitor 10 vulnerable metropolitan catchments. Notice the clear disaster-management hierarchy: high-risk stations appear red, medium amber, and low green. On our interactive Leaflet map, clicking on *Central Rail Underpass* reveals that water levels are approaching 1.9m against a 1.5m critical threshold."

* **0:50 – 1:20 (AI & Explainable Prediction)**:
  > "Navigating to **Flood Prediction**, we can simulate extreme weather. Let's select the *Cloudburst* preset with 58 mm/h rainfall and low drainage. Clicking **Predict Flood Risk**, our FastAPI backend instantly runs both our deterministic weighted engine and our Scikit-learn Random Forest model. We get a 90.9 High Risk score, a 100% ML flood probability, an explainable factor breakdown, and prescriptive action directives."

* **1:20 – 1:45 (Alerts & Action Protocols)**:
  > "In **Alerts & Warnings**, early warning bulletins are stored in SQLite. Let's click *Acknowledge* on an active alert — it immediately updates status. We can also click *Issue Simulated Alert* to broadcast an urgent warning. In **Action Protocols**, civic engineers get actionable SOPs with clear rationales for why each step is required."

* **1:45 – 2:00 (Impact & Wrap-Up)**:
  > "FloodGuard AI runs locally, requires zero paid APIs, has passing automated tests, and provides an explainable decision support tool for municipal disaster resilience. Thank you!"

---

## 8. Architecture & Future Roadmap

### Current Capabilities:
- Full end-to-end integration between React and FastAPI.
- Resilient architecture with deterministic offline fallbacks for external weather APIs.
- Dual-model inference: explainable weighted scoring + Scikit-learn Random Forest baseline.
- Interactive GIS map with custom Leaflet marker animations.

### Future Improvements:
1. **IoT Sensor Ingestion**: Real-time MQTT / WebSocket streaming from solar ultrasonic river depth sensors.
2. **High-Resolution DEM (Digital Elevation Models)**: Integrate 1-meter LiDAR or Copernicus DEM raster data for 2D hydrodynamic flood plain modeling (HEC-RAS / LISFLOOD).
3. **Automated SMS & WhatsApp Alerts**: Integration with Twilio / WhatsApp Business API for geofenced broadcast messages to affected citizens.
4. **Computer Vision Gauge Reading**: Edge CCTV camera models reading water depth staff gauges automatically.
