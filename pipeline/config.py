"""Configuración global y constantes compartidas del pipeline Atlas México-EEUU.

Ninguna ruta ni umbral debe repetirse hardcodeado en otros módulos: todo lo que
sea "el umbral mínimo de observaciones" o "dónde vive sectors.yaml" vive aquí.
"""
from __future__ import annotations

from pathlib import Path

# --- Rutas -------------------------------------------------------------
PIPELINE_ROOT = Path(__file__).resolve().parent
REPO_ROOT = PIPELINE_ROOT.parent

REFERENCE_DIR = PIPELINE_ROOT / "reference"
SECTORS_YAML = REFERENCE_DIR / "sectors.yaml"
REGION_REGISTRY_YAML = REFERENCE_DIR / "region_registry.yaml"
CROSSWALK_CSV = REFERENCE_DIR / "scian_naics_crosswalk.csv"

# Cache local de datos crudos/procesados en formato columnar. No se commitea al
# repo (ver .gitignore) — es solo cache de re-ejecución local.
RAW_CACHE_DIR = PIPELINE_ROOT / "data" / "raw"
PROCESSED_CACHE_DIR = PIPELINE_ROOT / "data" / "processed"

# Único directorio que el frontend Next.js lee. Vive en la raíz del monorepo,
# NUNCA dentro de pipeline/.
DATA_DIR = REPO_ROOT / "data"
SERIES_DIR = DATA_DIR / "series"
RESULTS_DIR = DATA_DIR / "results"
MANIFEST_PATH = DATA_DIR / "manifest.json"

# --- Umbrales del motor econométrico -----------------------------------
# Si el número de observaciones alineadas cae debajo de estos mínimos, el par
# se marca `insufficient_data` en vez de reportar un estadístico espurio.
MIN_OBS_QUARTERLY = 30
MIN_OBS_MONTHLY = 40
MIN_OBS_ANNUAL = 8
MIN_OBS_DAILY = 250

# Nivel de significancia y corrección multi-test.
ALPHA = 0.05
FDR_ALPHA = 0.05
FDR_METHOD = "fdr_bh"

# Orden máximo de diferenciación al buscar estacionariedad (ver
# pipeline/econometrics/stationarity.py). No se difiere indefinidamente.
MAX_DIFF_ORDER = 2

# --- Generador de datos mock ---------------------------------------------
# Semilla fija y documentada: toda la corrida de mock es reproducible byte a
# byte a partir de este entero.
MOCK_RANDOM_SEED = 42
MOCK_START_PERIOD = "2010-01"
MOCK_END_PERIOD = "2026-06"
