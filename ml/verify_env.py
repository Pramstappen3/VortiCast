#!/usr/bin/env python3
"""
VortiCast ML Environment Verification Script

Verifies:
1. Python version and virtual environment isolation.
2. Importability of all required machine learning and data processing libraries.
3. Installed package versions.
4. Basic functional smoke test (NumPy array, Pandas DataFrame, xarray Dataset).
"""

import os
import sys
import tempfile
from importlib import metadata

# Ensure Matplotlib config uses a writable temporary directory in sandboxed/container setups
os.environ.setdefault("MPLCONFIGDIR", tempfile.gettempdir())

REQUIRED_PACKAGES = [
    ("numpy", "numpy"),
    ("pandas", "pandas"),
    ("scipy", "scipy"),
    ("scikit-learn", "sklearn"),
    ("matplotlib", "matplotlib"),
    ("seaborn", "seaborn"),
    ("jupyter", "jupyter"),
    ("notebook", "notebook"),
    ("xarray", "xarray"),
    ("netCDF4", "netCDF4"),
    ("h5py", "h5py"),
    ("joblib", "joblib"),
    ("requests", "requests"),
    ("tqdm", "tqdm"),
    ("python-dotenv", "dotenv"),
    ("pytest", "pytest"),
]


def check_python_version() -> bool:
    print("=" * 65)
    print(" VortiCast ML Environment Verification")
    print("=" * 65)
    print(f"Python Executable : {sys.executable}")
    print(f"Python Version    : {sys.version.split()[0]} ({sys.platform})")
    
    in_venv = sys.prefix != sys.base_prefix
    print(f"Virtual Env Active: {'Yes (' + sys.prefix + ')' if in_venv else 'No (Running in system Python)'}")
    
    if sys.version_info < (3, 9):
        print("[-] Error: Python 3.9+ is required.")
        return False
    print("[+] Python version check passed.")
    print("-" * 65)
    return True


def check_libraries() -> bool:
    print(f"{'Package':<18} {'Import Name':<15} {'Status':<10} {'Version':<15}")
    print("-" * 65)

    all_passed = True
    for dist_name, import_name in REQUIRED_PACKAGES:
        try:
            mod = __import__(import_name)
            # Try getting version from module or metadata
            ver = getattr(mod, "__version__", None)
            if ver is None:
                try:
                    ver = metadata.version(dist_name)
                except Exception:
                    ver = "installed"
            print(f"{dist_name:<18} {import_name:<15} {'[OK]':<10} {ver:<15}")
        except ImportError as e:
            print(f"{dist_name:<18} {import_name:<15} {'[FAILED]':<10} {str(e):<15}")
            all_passed = False

    print("-" * 65)
    return all_passed


def smoke_test() -> bool:
    print("Running basic functional smoke tests...")
    try:
        import numpy as np
        import pandas as pd
        import xarray as xr

        # Smoke test numpy & pandas
        arr = np.array([1.0, 2.0, 3.0, 4.0])
        df = pd.DataFrame({"pressure_hpa": arr, "wind_speed_kt": arr * 10})
        assert len(df) == 4, "DataFrame creation failed"

        # Smoke test xarray
        ds = xr.Dataset(
            data_vars={"wind_speed": (("time",), arr)},
            coords={"time": pd.date_range("2026-01-01", periods=4, freq="6h")},
        )
        assert "wind_speed" in ds, "xarray Dataset creation failed"

        print("[+] Functional smoke test passed: NumPy, Pandas, xarray operational.")
        return True
    except Exception as e:
        print(f"[-] Functional smoke test failed: {e}")
        return False


def main():
    py_ok = check_python_version()
    libs_ok = check_libraries()
    smoke_ok = smoke_test()

    print("=" * 65)
    if py_ok and libs_ok and smoke_ok:
        print(" SUCCESS: ML environment verified successfully!")
        print("=" * 65)
        sys.exit(0)
    else:
        print(" FAILURE: One or more environment checks failed.")
        print("=" * 65)
        sys.exit(1)


if __name__ == "__main__":
    main()
