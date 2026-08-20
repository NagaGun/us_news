"""
synthetic_augmentor.py

Loads Synthetic_Data.xlsx (43-row metric-definition schema, NOT per-hospital
observations) and turns it into actual per-hospital synthetic training rows,
one set per department, for ml_models.py's RandomForests and ood_guard.py's
fitting step.

WHY THIS FILE EXISTS
---------------------
Synthetic_Data.xlsx describes *metrics* (weight, valid range, peer averages),
not hospitals. There is nothing in it to train a model on directly. This
module samples plausible individual hospitals from each metric's
peer_avg_value / peer_p25_value / peer_p75_value / dataset_min / dataset_max,
with a shared per-hospital "acuity" latent factor so that a handful of
related metrics (patient_volume, nurse_staffing_ratio, intensivists_staffing,
calculated_smr) move together rather than independently -- this is what
gives the OOD guard something real to detect (see ood_guard.py: without
joint correlation in the training data, Mahalanobis distance and isolation
forest have nothing to key off of).

CANONICAL METRIC KEYS
----------------------
This module is the single source of truth for the backend's metric key
names. `calculated_smr` is canonical for mortality (NOT
`mortality_survival_index` -- that field is being removed from mock_data.py).
`intensivists_staffing` is canonical for the intensivist feature (NOT
`intensivist_hours` -- ml_models.py's old naming is being renamed to match).

OUTPUTS
-------
- SYNTHETIC_TRAINING_DATA: Dict[dept_id -> pd.DataFrame], one row per
  synthetic hospital, columns = the 12 canonical metric keys. Feed this to
  ml_models.py to fit the RandomForests and to ood_guard.py to fit the
  OOD guard, per department (or concatenated, if you want one global model
  -- see note in __main__).
- SYNTHETIC_HOSPITAL_DATA: Dict[dept_id -> {"my_hospital": {...},
  "peer_group": [...]}], same shape mock_data.py's HOSPITAL_DATA already
  uses, just extended to 10 departments instead of 1.
- BACKEND_METRIC_LIMITS: Dict[metric_key -> (min, max)], sourced from the
  Excel's dataset_min/dataset_max -- for engine.py to replace its old
  hand-picked METRIC_LIMITS.
- BACKEND_METRIC_WEIGHTS: Dict[metric_key -> {"weight": float, "component":
  str}], sourced from the Excel's own weight column (already sums to ~1.0
  across all 12 metrics) -- for engine.py's flat composite-score replacement
  of the old nested category-weight math.
- distribution_report.json: written to disk, per-metric per-department
  summary stats + a differentiation check (see validate_differentiation()).

Run directly to regenerate everything and print a summary:
    python synthetic_augmentor.py
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Dict, List, Tuple

import numpy as np
import pandas as pd

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

RANDOM_SEED = 42
np.random.seed(RANDOM_SEED)

THIS_DIR = Path(__file__).resolve().parent
EXCEL_PATH = THIS_DIR / "Synthetic_Data.xlsx"
DISTRIBUTION_REPORT_PATH = THIS_DIR / "distribution_report.json"

N_HOSPITALS_PER_DEPARTMENT = 250  # synthetic training rows per department
# Raised from 60: the OOD guard estimates a covariance matrix over its
# feature set, and 60 samples was too sparse relative to dimensionality
# for a stable estimate -- it caused Mahalanobis distance to flag nearly
# every query, including in-distribution ones.

# A department mean more than this many multiples away from the
# cross-department median mean gets flagged as "too heavily differentiated."
DIFFERENTIATION_MAX_RATIO = 3.0

# Excel short_name -> canonical backend metric key.
METRIC_KEY_MAP: Dict[str, str] = {
    "Mortality – Random Effects": "calculated_smr",
    "Discharge to Home – Random Effects": "discharge_home_rate",
    "Patient Volume": "patient_volume",
    "Advanced Technologies": "advanced_tech_adoption",
    "Nurse Staffing": "nurse_staffing_ratio",
    "Nurse Magnet": "nurse_magnet",
    "Intensivists": "intensivists_staffing",
    "Patient Services": "patient_services_diversity",
    "Trauma Center": "trauma_center",
    "Expert Opinion – Specialists": "expert_consults",
    "Public Transparency": "public_transparency",
    "HCAHPS Score": "hcahps_score",
}

# Metric keys whose per-hospital value is blended with the hospital's latent
# "acuity/scale" factor, so they co-vary the way real correlated clinical
# metrics do (this is what makes an off-diagonal combination genuinely
# out-of-distribution instead of just "a rare independent draw").
CORRELATED_WITH_ACUITY = {
    "patient_volume",
    "nurse_staffing_ratio",
    "intensivists_staffing",
    "calculated_smr",
}

# The OOD guard (ood_guard.py) should fit ONLY on this subset, not all 12
# metrics. The other 8 metrics are sampled independently in this module
# (no shared latent factor), so they have no real joint relationship for
# Mahalanobis distance / isolation forest to key off of -- including them
# just adds noisy, uncorrelated dimensions that made nearly every query
# look anomalous in practice. Sorted for a deterministic column order.
OOD_GUARD_FEATURES: List[str] = sorted(CORRELATED_WITH_ACUITY)


def get_ood_training_matrix(dept_id: str, training_data: Dict[str, pd.DataFrame]) -> np.ndarray:
    """Return this department's training data restricted to
    OOD_GUARD_FEATURES, in that fixed column order, as a plain numpy array.
    ood_guard.py should standardize (z-score) this itself using its own
    mean/std before computing Mahalanobis distance or fitting the
    IsolationForest -- these raw columns are on very different scales."""
    df = training_data[dept_id]
    return df[OOD_GUARD_FEATURES].to_numpy()


# Department ids MUST match src/data.ts DEPARTMENTS ids exactly.
# volume_mult / acuity_mult only nudge the acuity-correlated metrics above --
# every other metric is drawn from the same base distribution across
# departments on purpose, to avoid failing the differentiation check.
DEPARTMENT_PROFILES: Dict[str, Dict[str, float]] = {
    "cancer":     {"volume_mult": 1.05, "acuity_mult": 1.05},
    "cardiology": {"volume_mult": 1.35, "acuity_mult": 1.15},
    "dige":       {"volume_mult": 0.75, "acuity_mult": 0.90},
    "endo":       {"volume_mult": 0.55, "acuity_mult": 0.75},
    "specialty":  {"volume_mult": 0.60, "acuity_mult": 1.00},
    "neuro":      {"volume_mult": 0.95, "acuity_mult": 1.10},
    "respi":      {"volume_mult": 1.10, "acuity_mult": 0.95},
    "ortho":      {"volume_mult": 1.20, "acuity_mult": 0.90},
    "urology":    {"volume_mult": 0.80, "acuity_mult": 0.85},
    "geriatrics": {"volume_mult": 1.00, "acuity_mult": 1.05},
}

BOOLEAN_METRICS = {"trauma_center"}          # 0/1
PERCENT_ADOPTION_METRICS = {"advanced_tech_adoption"}  # 0-100 checkbox %


# ---------------------------------------------------------------------------
# Step 1: load + map the metric-definition schema
# ---------------------------------------------------------------------------

def load_metric_definitions(excel_path: Path = EXCEL_PATH) -> Dict[str, dict]:
    """Read Synthetic_Data.xlsx, keep only top-level scored metrics, and
    return a dict keyed by canonical backend metric key."""
    df = pd.read_excel(excel_path)
    scored = df[df["node_type"] == "scored"].copy()

    defs: Dict[str, dict] = {}
    unmapped = []
    for _, row in scored.iterrows():
        key = METRIC_KEY_MAP.get(row["short_name"])
        if key is None:
            unmapped.append(row["short_name"])
            continue
        defs[key] = {
            "excel_short_name": row["short_name"],
            "component": row["component"],
            "weight": float(row["weight"]),
            "dataset_min": float(row["dataset_min"]),
            "dataset_max": float(row["dataset_max"]),
            "value_max": float(row["value_max"]),
            "reverse_bar": bool(row["reverse_bar"]),
            "peer_avg": float(row["peer_avg_value"]),
            "peer_p25": float(row["peer_p25_value"]),
            "peer_p75": float(row["peer_p75_value"]),
        }

    if unmapped:
        raise ValueError(
            f"Found scored metrics in Synthetic_Data.xlsx with no entry in "
            f"METRIC_KEY_MAP: {unmapped}. Add them to METRIC_KEY_MAP before "
            f"continuing -- silently dropping a scored metric would break "
            f"the composite weight sum (currently expected to total ~1.0)."
        )

    weight_sum = sum(d["weight"] for d in defs.values())
    if not (0.95 <= weight_sum <= 1.05):
        raise ValueError(
            f"Scored metric weights sum to {weight_sum:.4f}, expected ~1.0. "
            f"Check METRIC_KEY_MAP against the current Excel file -- a "
            f"metric may be missing or double-mapped."
        )

    return defs


# ---------------------------------------------------------------------------
# Step 2: sample synthetic per-hospital rows, per department
# ---------------------------------------------------------------------------

def _sample_metric(
    metric_def: dict,
    n: int,
    acuity_latent: np.ndarray,
    dept_profile: Dict[str, float],
    metric_key: str,
) -> np.ndarray:
    """Sample n synthetic hospital values for one metric.

    Base distribution: normal centered on peer_avg_value, with std derived
    from the peer_p25/p75 spread (a normal's IQR spans ~1.349 std devs),
    clipped to [dataset_min, dataset_max].

    If this metric is in CORRELATED_WITH_ACUITY, blend in the hospital's
    shared acuity_latent factor (and the department's volume/acuity
    multiplier) so it co-varies with the other correlated metrics instead of
    being drawn independently.
    """
    lo, hi = metric_def["dataset_min"], metric_def["dataset_max"]
    mean = metric_def["peer_avg"]
    iqr = max(metric_def["peer_p75"] - metric_def["peer_p25"], 1e-6)
    std = iqr / 1.349

    base = np.random.normal(loc=mean, scale=std, size=n)

    if metric_key in CORRELATED_WITH_ACUITY:
        mult = dept_profile["volume_mult"] if metric_key == "patient_volume" else dept_profile["acuity_mult"]
        # Blend: 55% base draw, 45% pulled toward mean*acuity_latent*mult.
        # This keeps each hospital's value plausible on its own (still
        # anchored near the real peer distribution) while making it move
        # together with the other correlated metrics for that same
        # hospital -- exactly the joint structure the OOD guard needs.
        scaled_target = mean * mult * acuity_latent
        base = 0.55 * base + 0.45 * scaled_target

    values = np.clip(base, lo, hi)

    if metric_key in BOOLEAN_METRICS:
        values = (values >= (lo + hi) / 2).astype(float)
    elif metric_key in PERCENT_ADOPTION_METRICS:
        values = np.clip(values, 0, 100)

    return values


def generate_department_hospitals(
    dept_id: str,
    metric_defs: Dict[str, dict],
    n: int = N_HOSPITALS_PER_DEPARTMENT,
) -> pd.DataFrame:
    """Generate n synthetic hospitals for one department as a DataFrame,
    one column per canonical metric key."""
    profile = DEPARTMENT_PROFILES[dept_id]

    # Shared latent "acuity/scale" factor per synthetic hospital -- this is
    # what creates realistic joint correlation (e.g. high-volume hospitals
    # trending toward a particular staffing/mortality band) rather than
    # every metric being an independent random draw.
    acuity_latent = np.clip(np.random.normal(loc=1.0, scale=0.15, size=n), 0.6, 1.6)

    columns = {}
    for metric_key, metric_def in metric_defs.items():
        columns[metric_key] = _sample_metric(metric_def, n, acuity_latent, profile, metric_key)

    return pd.DataFrame(columns)


def generate_all_departments(
    metric_defs: Dict[str, dict],
    n_per_dept: int = N_HOSPITALS_PER_DEPARTMENT,
) -> Dict[str, pd.DataFrame]:
    return {
        dept_id: generate_department_hospitals(dept_id, metric_defs, n_per_dept)
        for dept_id in DEPARTMENT_PROFILES
    }


# ---------------------------------------------------------------------------
# Step 3: distribution tracking + differentiation validation
# ---------------------------------------------------------------------------

def build_distribution_report(
    training_data: Dict[str, pd.DataFrame],
    metric_defs: Dict[str, dict],
) -> dict:
    """Per-metric, per-department summary stats. This is the concrete
    'track the distribution' mechanism: written to distribution_report.json
    so it can be inspected or diffed later, not just eyeballed once."""
    report = {}
    for metric_key in metric_defs:
        report[metric_key] = {}
        for dept_id, df in training_data.items():
            series = df[metric_key]
            report[metric_key][dept_id] = {
                "mean": round(float(series.mean()), 3),
                "std": round(float(series.std()), 3),
                "min": round(float(series.min()), 3),
                "max": round(float(series.max()), 3),
                "p5": round(float(series.quantile(0.05)), 3),
                "p95": round(float(series.quantile(0.95)), 3),
            }
    return report


def validate_differentiation(report: dict) -> List[str]:
    """Flag any metric where a department's mean sits more than
    DIFFERENTIATION_MAX_RATIO away from the cross-department median mean.
    Returns a list of human-readable warnings (empty list = all clear)."""
    warnings: List[str] = []
    for metric_key, per_dept in report.items():
        means = {dept_id: stats["mean"] for dept_id, stats in per_dept.items()}
        nonzero_means = [m for m in means.values() if abs(m) > 1e-9]
        if not nonzero_means:
            continue
        median_mean = float(np.median(nonzero_means))
        if abs(median_mean) < 1e-9:
            continue
        for dept_id, mean in means.items():
            ratio = mean / median_mean if median_mean != 0 else float("inf")
            if ratio > DIFFERENTIATION_MAX_RATIO or ratio < (1 / DIFFERENTIATION_MAX_RATIO):
                warnings.append(
                    f"[{metric_key}] department '{dept_id}' mean={mean:.2f} is "
                    f"{ratio:.1f}x the cross-department median ({median_mean:.2f}) "
                    f"-- exceeds the {DIFFERENTIATION_MAX_RATIO}x differentiation bound."
                )
    return warnings


# ---------------------------------------------------------------------------
# Step 4: exports for ml_models.py / engine.py / mock_data.py
# ---------------------------------------------------------------------------

def build_hospital_data(
    training_data: Dict[str, pd.DataFrame],
    metric_defs: Dict[str, dict],
) -> Dict[str, dict]:
    """mock_data.py-shaped export: one 'my_hospital' + a small peer_group
    per department. my_hospital = first synthetic row (arbitrary but fixed
    via RANDOM_SEED, so it's stable across runs). peer_group values come
    straight from the Excel's own peer_avg/p25/p75 -- these are already
    real aggregate figures, no need to re-derive them from the sampled rows.
    """
    hospital_data: Dict[str, dict] = {}
    for dept_id, df in training_data.items():
        my_hospital = df.iloc[0].to_dict()
        peer_group = [
            {k: round(v["peer_p25"], 3) for k, v in metric_defs.items()},
            {k: round(v["peer_avg"], 3) for k, v in metric_defs.items()},
            {k: round(v["peer_p75"], 3) for k, v in metric_defs.items()},
        ]
        hospital_data[dept_id] = {
            "my_hospital": {k: round(v, 3) for k, v in my_hospital.items()},
            "peer_group": peer_group,
        }
    return hospital_data


def build_metric_limits(metric_defs: Dict[str, dict]) -> Dict[str, Tuple[float, float]]:
    """For engine.py to replace its old hand-picked METRIC_LIMITS."""
    return {k: (v["dataset_min"], v["dataset_max"]) for k, v in metric_defs.items()}


def build_metric_weights(metric_defs: Dict[str, dict]) -> Dict[str, dict]:
    """For engine.py's flat composite-score math (replaces nested
    category-weight math -- see the chat history for why: these weights
    already sum to ~1.0 across all 12 metrics)."""
    return {
        k: {"weight": v["weight"], "component": v["component"]}
        for k, v in metric_defs.items()
    }


# ---------------------------------------------------------------------------
# Module-level exports (computed at import time, mirroring mock_data.py's
# existing pattern of exporting ready-to-use module-level constants)
# ---------------------------------------------------------------------------

try:
    _METRIC_DEFS = load_metric_definitions()
    SYNTHETIC_TRAINING_DATA = generate_all_departments(_METRIC_DEFS)
    _DISTRIBUTION_REPORT = build_distribution_report(SYNTHETIC_TRAINING_DATA, _METRIC_DEFS)
    SYNTHETIC_HOSPITAL_DATA = build_hospital_data(SYNTHETIC_TRAINING_DATA, _METRIC_DEFS)
    BACKEND_METRIC_LIMITS = build_metric_limits(_METRIC_DEFS)
    BACKEND_METRIC_WEIGHTS = build_metric_weights(_METRIC_DEFS)
    AUGMENTOR_LOAD_ERROR = None
except Exception as exc:  # noqa: BLE001 - deliberate broad catch for import guard
    # mock_data.py imports this module wrapped in a try/except and falls
    # back to hardcoded data if this fails -- surface the real reason why.
    SYNTHETIC_TRAINING_DATA = {}
    SYNTHETIC_HOSPITAL_DATA = {}
    BACKEND_METRIC_LIMITS = {}
    BACKEND_METRIC_WEIGHTS = {}
    AUGMENTOR_LOAD_ERROR = str(exc)


# ---------------------------------------------------------------------------
# CLI entry point: regenerate + report
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    if AUGMENTOR_LOAD_ERROR:
        raise SystemExit(f"synthetic_augmentor failed to load: {AUGMENTOR_LOAD_ERROR}")

    with open(DISTRIBUTION_REPORT_PATH, "w") as f:
        json.dump(_DISTRIBUTION_REPORT, f, indent=2)

    warnings = validate_differentiation(_DISTRIBUTION_REPORT)

    print(f"Loaded {len(_METRIC_DEFS)} scored metrics, weights sum to "
          f"{sum(d['weight'] for d in _METRIC_DEFS.values()):.4f}")
    print(f"Generated {N_HOSPITALS_PER_DEPARTMENT} synthetic hospitals for "
          f"each of {len(SYNTHETIC_TRAINING_DATA)} departments")
    print(f"Wrote {DISTRIBUTION_REPORT_PATH.name}")

    if warnings:
        print(f"\n{len(warnings)} DIFFERENTIATION WARNING(S):")
        for w in warnings:
            print(f"  - {w}")
    else:
        print("\nDifferentiation check: all departments within "
              f"{DIFFERENTIATION_MAX_RATIO}x of the cross-department median. OK.")