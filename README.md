# VortiCast

> **AI-Assisted Tropical Cyclone Monitoring, Prediction, and Analysis Platform**

[![Python Version](https://img.shields.io/badge/python-3.11%20%7C%203.12%20%7C%203.14-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-green.svg)](https://fastapi.tiangolo.com/)
[![Tests](https://img.shields.io/badge/tests-21%20passed-brightgreen.svg)]()
[![Code Style](https://img.shields.io/badge/code%20style-ruff-000000.svg)](https://github.com/astral-sh/ruff)

---

## 1. Project Overview & Educational Disclaimer

**VortiCast** is an educational and research prototype designed for analyzing historical tropical cyclone tracks, producing experimental track and intensity forecasts, and explaining why consecutive model forecasts shift over time.

> [!CAUTION]
> **Research and Educational Prototype Notice:**
> VortiCast is **not** an operational meteorological agency or official weather warning system. Never describe unvalidated model output as an official cyclone warning or use it for emergency life/property decisions.

### Core Capabilities
- **Historical Cyclone Ingestion:** Robust CSV parsing supporting NOAA IBTrACS formats, schema validation, coordinate sanity checks, and duplicate detection.
- **Track & Intensity Analytics:** Cumulative track distance, translation speed, forward bearings, intensity trends, and duration statistics.
- **Experimental ML Forecasting:** Supervised baseline models (Ridge regression on velocity displacements and intensity deltas) and constant-motion / persistence benchmarks.
- **Immutable Forecast Versioning:** Every prediction is versioned with issuance timestamps, forecast horizon, and input observation snapshot provenance.
- **Explainable Forecast Differences:** Quantifies track shifts (in kilometers via great-circle geodesic calculation), wind speed differences, changed input features, and version updates between successive forecast runs, coupled with honest scientific limitations to prevent unsupported causal claims.

---

## 2. Architecture & Directory Structure

```text
VortiCast/
├── backend/                     # FastAPI backend & ML pipeline
│   ├── app/
│   │   ├── main.py              # FastAPI application entry point, CORS, lifespan
│   │   ├── core/
│   │   │   ├── config.py        # Pydantic Settings & environment variables
│   │   │   ├── logging.py       # Structured logging configuration
│   │   │   └── exceptions.py    # Domain exceptions and uniform JSON error handlers
│   │   ├── api/
│   │   │   ├── deps.py          # Database session dependencies
│   │   │   └── v1/
│   │   │       ├── router.py    # API v1 route aggregator
│   │   │       └── endpoints/
│   │   │           ├── health.py    # Health check & artifact detection
│   │   │           ├── storms.py    # Storms, observations, & analytics
│   │   │           └── predictions.py # Inference & change explanations
│   │   ├── schemas/             # Pydantic request and response models
│   │   ├── models/              # SQLAlchemy 2.x ORM models
│   │   ├── db/                  # Engine & SessionLocal
│   │   ├── repositories/        # Data access layer
│   │   ├── services/            # Business logic (ingestion, analytics, prediction, comparison)
│   │   ├── ml/                  # Feature extraction, baseline models, inference
│   │   └── utils/               # Datetime & Haversine geospatial calculations
│   ├── training/                # Dataset preparation, training, and evaluation scripts
│   ├── scripts/                 # Dataset import CLI tool
│   ├── tests/                   # Pytest automated test suite (24 tests)
│   ├── data/                    # Raw, processed, and model artifacts (.joblib)
│   ├── alembic/                 # Database migration scripts
│   ├── alembic.ini              # Alembic configuration
│   ├── requirements.txt         # Pinned backend dependencies
│   ├── pyproject.toml           # Backend packaging and tool configurations
│   └── .env.example             # Backend environment template
├── frontend/                    # React 18 + Vite + TypeScript dashboard
│   ├── src/
│   │   ├── components/          # Reusable UI cards, maps, charts, and layouts
│   │   ├── pages/               # Dashboard, Live Cyclones, Predictions, Analytics, etc.
│   │   ├── services/            # API client and meteorological services
│   │   ├── types/               # TypeScript interfaces
│   │   ├── mocks/               # Benchmark demonstration dataset
│   │   ├── App.tsx              # Main routing and global state
│   │   └── main.tsx             # Application bootstrap
│   ├── package.json             # Frontend dependencies and build scripts
│   ├── vite.config.ts           # Vite configuration with proxy and aliases
│   ├── tailwind.config.js       # Tailwind CSS styling configuration
│   └── .env.example             # Frontend environment template
├── docker-compose.yml           # Optional PostgreSQL container
├── .gitignore                   # Root gitignore
└── README.md                    # Project documentation
```

---

## 3. Getting Started & Installation

### Prerequisites
- Python 3.11 or newer (tested with 3.11, 3.12, 3.14).
- Node.js 18+ and npm.
- Optional: Docker and Docker Compose (if using PostgreSQL).

### Backend Setup
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
alembic upgrade head
```

VortiCast backend defaults to zero-configuration **SQLite** (`vorticast.db`), so you can run and test immediately without configuring a database server!

For PostgreSQL, set `DATABASE_URL` in `backend/.env`:
```env
DATABASE_URL="postgresql+psycopg2://vorticast:vorticast_password@localhost:5432/vorticast"
```
*(You can start local PostgreSQL with `docker compose up -d`)*.

### Frontend Setup
```bash
cd frontend
npm ci
cp .env.example .env
```

---

## 4. Running the Applications

### Start Backend API Server:
```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Once running:
- **API Root**: [http://localhost:8000/](http://localhost:8000/)
- **Interactive Swagger Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Alternative ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **Health Endpoint**: [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)

### Start Frontend Development Server:
```bash
cd frontend
npm run dev
```

Once running:
- **Dashboard Interface**: [http://localhost:5173/](http://localhost:5173/)

---

## 5. Dataset Ingestion

VortiCast provides a CLI ingestion tool supporting historical best-track data from **NOAA IBTrACS** ([NOAA NCEI IBTrACS Archive](https://www.ncei.noaa.gov/products/international-best-track-archive)).

A sample dataset containing tracks for Hurricane Otis (2023) and Cyclone Biparjoy (2023) is included in `data/raw/sample_ibtracs.csv`.

### Validate with a Dry-Run (No DB writes):
```bash
python scripts/import_dataset.py --file data/raw/sample_ibtracs.csv --dry-run
```

### Ingest Data into the Database:
```bash
python scripts/import_dataset.py --file data/raw/sample_ibtracs.csv
```

The ingestion tool:
1. Validates coordinate boundaries (-90 to 90 lat, -180 to 180 lon).
2. Normalizes timestamps to UTC.
3. Standardizes units (`knots` for wind speed, `mb` for central pressure).
4. Detects and skips duplicate observations.
5. Emits a structured JSON summary report detailing imported, skipped, and rejected records.

---

## 6. Training & Evaluating Baseline Models

### Train Baseline Models:
```bash
python training/train_baseline.py
```
This script:
- Queries historical observations grouped by storm.
- Performs a **storm-aware chronological split** (train storms vs test storms) to prevent data leakage.
- Trains `BaselineMLTrackModel` and `BaselineMLIntensityModel` using Ridge regression on motion velocity and intensity change features.
- Saves model artifacts into `data/artifacts/`.
- Evaluates track displacement errors (in km) and intensity MAE/RMSE compared against a constant-motion and persistence reference benchmark.

### Evaluate Models:
```bash
python training/evaluate_model.py
```

---

## 7. Generating Predictions & Explaining Changes

### Generate an Experimental Forecast:
```bash
curl -X POST "http://localhost:8000/api/v1/predictions" \
  -H "Content-Type: application/json" \
  -d '{"storm_id": 1, "forecast_horizon_hours": 24}'
```
Response:
```json
{
  "id": 1,
  "storm_id": 1,
  "issued_at_utc": "2023-10-25T06:00:00Z",
  "valid_at_utc": "2023-10-26T06:00:00Z",
  "forecast_horizon_hours": 24,
  "predicted_latitude": 18.52,
  "predicted_longitude": -101.44,
  "predicted_wind_speed_kts": 82.3,
  "wind_speed_unit": "knots",
  "model_name": "BaselineRidgeTrackModel",
  "model_version": "1.0.0",
  "input_snapshot_id": "2023297N10087_obs11_202310250600",
  "status": "completed"
}
```

### Inspect Historical Forecast Versions:
```bash
curl "http://localhost:8000/api/v1/storms/1/predictions/history"
```

### Explain Why a Prediction Changed:
When an updated forecast is generated (e.g. prediction ID 2 after new observations are recorded), request the change explanation:
```bash
curl "http://localhost:8000/api/v1/predictions/2/changes"
```
Response:
```json
{
  "current_prediction_id": 2,
  "previous_prediction_id": 1,
  "prediction_changed": true,
  "track_shift_km": 42.15,
  "wind_speed_change_kts": -5.0,
  "variables_changed": ["track_position", "wind_speed"],
  "changed_inputs": [
    {
      "feature_name": "translation_speed_kmh",
      "previous_value": 24.5,
      "current_value": 28.2,
      "difference": 3.7,
      "description": "Feature 'translation_speed_kmh' shifted from 24.5 to 28.2 (delta: 3.7)."
    }
  ],
  "explanation_method": "RULE_BASED_METRIC_DIFFERENCING_AND_PROVENANCE",
  "evidence": [
    {
      "metric": "track_shift",
      "description": "Predicted center shifted by 42.15 km over 24h horizon.",
      "raw_data": {
        "previous_coords": [18.52, -101.44],
        "current_coords": [18.81, -101.72],
        "shift_km": 42.15
      }
    }
  ],
  "limitations": [
    "Quantified track and intensity shifts represent measured differences between forecast runs, NOT proven physical causation.",
    "Atmospheric environmental drivers (sea surface temperature, vertical wind shear) are not causally attributed unless explicitly modeled.",
    "If model versions or input observation intervals changed, shifts reflect combined effects of new inputs and algorithmic updates."
  ]
}
```

---

## 8. Automated Testing & Code Quality

### Backend Tests & Linting:
```bash
cd backend
# Run Pytest suite (24 tests)
pytest tests/ -v

# Check code quality and linting using Ruff
ruff check .

# Format code
ruff format .
```

### Frontend Type-Checking & Production Build:
```bash
cd frontend
# TypeScript check and Vite production build
npm run build
```

---

## 9. Feature Availability Matrix

| Feature | Out-of-the-Box (Immediate) | Requires Imported Dataset | Requires Trained Model |
| :--- | :---: | :---: | :---: |
| **API Root & Documentation** (`/`, `/docs`) |  Yes | No | No |
| **System Health Check** (`/api/v1/health`) |  Yes | No | No |
| **CSV Dry-Run Validation** |  Yes | Yes (CSV file) | No |
| **Database Ingestion** |  Yes | Yes (CSV file) | No |
| **Storm & Observation Queries** |  Yes (empty if no data) | Yes | No |
| **Storm Track Analytics** |  Yes (empty if no data) | Yes | No |
| **Model Training & Evaluation** |  No | Yes (>= 24h tracks) | No |
| **Forecast Generation** (`POST /predictions`) |  No | Yes (>= 2 observations)| Yes |
| **Prediction Change Explanations** |  No | Yes | Yes (>= 2 forecast runs) |

---

## 10. Troubleshooting

- **Error: `ModelNotTrainedException` (503 Service Unavailable)**:
  Run `python training/train_baseline.py` to train and serialize the baseline models before requesting forecast predictions.
- **Error: `InsufficientObservationsException` (400 Bad Request)**:
  A storm must have at least 2 chronological observations in the database to extract movement dynamics and speed.
- **PostgreSQL Connection Error**:
  Verify the database is running or set `DATABASE_URL="sqlite:///./vorticast.db"` in `.env` for local SQLite development.
