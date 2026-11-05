# VortiCast – Machine Learning Module (Phase 1)

This directory contains the Machine Learning (ML) research, data processing, and predictive modeling environment for **VortiCast**, a cyclone prediction and analysis platform.

The ML module is designed to operate independently during experimentation, research, and model training, while structuring model artifacts and inference routines for seamless integration with the VortiCast FastAPI backend (`backend/app`).

---

## 1. Directory Structure

```text
ml/
├── data/
│   ├── raw/                 # Unmodified raw source data (IBTrACS, IMD, satellite/reanalysis NetCDF/HDF5)
│   ├── processed/           # Cleaned, normalized, and feature-engineered datasets
│   └── external/            # External auxiliary datasets (geographical boundaries, bathymetry, SST)
│
├── notebooks/               # Jupyter notebooks for exploratory data analysis (EDA) and prototyping
│
├── src/                     # Core reusable Python source packages
│   ├── __init__.py
│   ├── preprocessing/       # Data ingestion, cleaning, transformation, and feature engineering
│   ├── models/              # Model architectures, estimators, and neural network definitions
│   ├── training/            # Training loops, hyperparameter optimization, and cross-validation
│   ├── evaluation/          # Metrics, error analysis, validation curves, and evaluation reports
│   └── prediction/          # Inference pipelines, post-processing, and artifact loading
│
├── saved_models/            # Serialized model weights, pipeline artifacts, and encoders
│
├── tests/                   # Unit and integration tests for ML routines
│
├── .venv/                   # Isolated Python virtual environment (ignored by Git)
├── .env.example             # Configuration and environment variable template
├── .gitignore               # ML-specific Git exclusion rules
├── requirements.txt         # Pinned Python package dependencies
├── verify_env.py            # Environment and dependency verification script
└── README.md                # ML module documentation
```

---

## 2. Python Environment Setup

The ML module uses an isolated Python virtual environment (`.venv`) to ensure reproducibility without affecting global packages or other VortiCast services.

### Prerequisites
- Python 3.9+ (Python 3.14.x tested and supported)
- `pip` package manager

### Create the Virtual Environment
From the `ml/` directory:

```bash
# Navigate to the ml directory
cd ml

# Create virtual environment
python3 -m venv .venv
```

---

## 3. Environment Activation

### Linux / macOS
```bash
source .venv/bin/activate
```

*(To deactivate when finished, simply run `deactivate`)*

### Windows
**Command Prompt (cmd.exe):**
```cmd
.venv\Scripts\activate.bat
```

**PowerShell:**
```powershell
.venv\Scripts\Activate.ps1
```

*(Note: If PowerShell script execution is restricted, run `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser` first).*

---

## 4. Dependency Installation

With the virtual environment activated, install all required dependencies:

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### Essential Installed Libraries:
- **Data Manipulation & Analysis:** `numpy`, `pandas`, `scipy`
- **Machine Learning:** `scikit-learn`, `joblib`
- **Meteorological & Scientific Formats:** `xarray`, `netCDF4`, `h5py`
- **Visualization:** `matplotlib`, `seaborn`
- **Interactive Prototyping:** `jupyter`, `notebook`
- **Utilities & Testing:** `requests`, `tqdm`, `python-dotenv`, `pytest`

---

## 5. Environment Configuration

Create a local `.env` configuration file from the template:

```bash
cp .env.example .env
```

Configure local dataset paths and backend endpoints inside `.env`. Note that `.env` is excluded from version control to prevent committing sensitive information.

---

## 6. Environment Verification

To verify that the Python environment, packages, and underlying libraries are correctly installed and operational, run the verification script:

```bash
python verify_env.py
```

Or execute directly with the environment binary:
```bash
./.venv/bin/python verify_env.py
```

Expected output:
```text
=================================================================
 VortiCast ML Environment Verification
=================================================================
Python Executable : .../ml/.venv/bin/python
Python Version    : 3.14.9 (linux)
Virtual Env Active: Yes
[+] Python version check passed.
-----------------------------------------------------------------
Package            Import Name     Status     Version        
-----------------------------------------------------------------
numpy              numpy           [OK]       2.5.4          
pandas             pandas          [OK]       3.1.1          
scipy              scipy           [OK]       1.18.1         
scikit-learn       sklearn         [OK]       1.9.1          
matplotlib         matplotlib      [OK]       3.11.2         
seaborn            seaborn         [OK]       0.13.2         
jupyter            jupyter         [OK]       1.1.1          
notebook           notebook        [OK]       7.6.4          
xarray             xarray          [OK]       2026.9.0       
netCDF4            netCDF4         [OK]       1.7.5.1.post1  
h5py               h5py            [OK]       3.16.0         
joblib             joblib          [OK]       1.6.0          
requests           requests        [OK]       2.34.2         
tqdm               tqdm            [OK]       4.70.1         
python-dotenv      dotenv          [OK]       1.2.4          
pytest             pytest          [OK]       9.2.0          
-----------------------------------------------------------------
Running basic functional smoke tests...
[+] Functional smoke test passed: NumPy, Pandas, xarray operational.
=================================================================
 SUCCESS: ML environment verified successfully!
=================================================================
```

---

## 7. Launching Jupyter Notebook

To start an interactive Jupyter Notebook server for exploratory data analysis and prototyping:

```bash
# Make sure the virtual environment is activated
source .venv/bin/activate

# Launch Jupyter Notebook
jupyter notebook --notebook-dir=notebooks
```

Or launch JupyterLab:
```bash
jupyter lab --notebook-dir=notebooks
```

The notebook interface will open in your default browser at `http://localhost:8888`.

---

## 8. Running Tests

Run unit tests across the ML suite using `pytest`:

```bash
pytest tests/
```

