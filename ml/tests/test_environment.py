"""
Basic sanity tests for the ML environment setup.
"""

import sys
import importlib


def test_python_version():
    assert sys.version_info >= (3, 9), "Python version must be 3.9 or higher"


def test_required_imports():
    packages = [
        "numpy",
        "pandas",
        "scipy",
        "sklearn",
        "matplotlib",
        "seaborn",
        "xarray",
        "netCDF4",
        "h5py",
        "joblib",
        "requests",
        "tqdm",
        "dotenv",
        "pytest",
    ]
    for pkg in packages:
        mod = importlib.import_module(pkg)
        assert mod is not None, f"Failed to import {pkg}"

