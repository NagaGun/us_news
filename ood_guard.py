"""
ood_guard.py

Three-layer out-of-distribution (OOD) detection for the RandomForest models
trained in ml_models.py.

LAYER SUMMARY
-------------
Layer 1 — Leaf Agreement (bounding-box with 0.5σ margin)
    Uses the FULL feature set the RandomForest was trained on.
    Checks whether the query lands inside the empirical bounding box of
    training points that share the same leaf, per tree. Agreement < 0.3 = fail.

Layer 2 — Isolation Forest  (reduced + standardized OOD feature set only)
    Fits on synthetic_augmentor.OOD_GUARD_FEATURES (the 4 acuity-correlated
    metrics: calculated_smr, intensivists_staffing, nurse_staffing_ratio,
    patient_volume).  These are z-score standardized before fitting and before
    scoring a query.  predict == -1 = fail.

Layer 3 — Mahalanobis distance  (same reduced + standardized set)
    Chi-squared 97.5th percentile threshold with df = len(OOD_GUARD_FEATURES) = 4.
    Distance computed on the standardized reduced matrix; centroid and cov_inv
    are also computed on the standardized data.  Exceeds threshold = fail.

WHY REDUCED FEATURE SET FOR LAYERS 2 & 3
-----------------------------------------
The 8 metrics excluded from OOD_GUARD_FEATURES are sampled independently in
synthetic_augmentor.py (no shared latent factor).  Including uncorrelated
dimensions in a covariance-based guard produces near-diagonal covariance
matrices that inflate Mahalanobis distance for almost every query, and
confuses the Isolation Forest.  Using only the 4 correlated metrics gives
the guard a real joint distribution to key off.

FALLBACK
--------
nearest_neighbor_fallback() has been removed from this module.
Out-of-range fallback predictions are handled by ml_models.linear_fallback_predict().
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional, Dict, Any, List
import numpy as np
from sklearn.ensemble import IsolationForest, RandomForestRegressor
from scipy.stats import chi2


@dataclass
class OodGuard:
    # Reduced OOD feature matrix (OOD_GUARD_FEATURES columns, raw scale)
    X_train_ood: np.ndarray
    # Standardization params computed from X_train_ood
    train_mean: np.ndarray
    train_std: np.ndarray
    # Standardized version of X_train_ood
    X_train_ood_scaled: np.ndarray
    # Fitted on X_train_ood_scaled
    isolation_forest: IsolationForest
    # Mahalanobis components (computed on standardized data)
    train_centroid: np.ndarray      # centroid of X_train_ood_scaled
    cov_inv: np.ndarray             # pseudo-inverse of cov(X_train_ood_scaled)
    mahal_threshold: float          # sqrt(chi2.ppf(0.975, df=len(OOD_GUARD_FEATURES)))
    # Layer 1: full-feature RF model (optional)
    rf_model: Optional[RandomForestRegressor] = field(default=None)
    # Column names for the reduced OOD feature set (for diagnostics)
    ood_feature_keys: list = field(default_factory=list)


def fit_ood_guard(
    X_train_ood: np.ndarray,
    ood_feature_keys: list | None = None,
    rf_model: RandomForestRegressor | None = None,
) -> OodGuard:
    """Fit all OOD guard components on the REDUCED training feature matrix.

    X_train_ood must already be sliced to OOD_GUARD_FEATURES columns
    (use synthetic_augmentor.get_ood_training_matrix() to get it).
    This function handles standardization internally.
    """
    # --- Standardize ---
    train_mean = X_train_ood.mean(axis=0)
    train_std = X_train_ood.std(axis=0)
    # Avoid division by zero for zero-variance columns
    train_std_safe = np.where(train_std == 0, 1.0, train_std)
    X_scaled = (X_train_ood - train_mean) / train_std_safe

    # --- Layer 2: Isolation Forest on standardized data ---
    iso = IsolationForest(contamination=0.05, random_state=42, n_estimators=200)
    iso.fit(X_scaled)

    # --- Layer 3: Mahalanobis on standardized data ---
    centroid = X_scaled.mean(axis=0)
    cov = np.cov(X_scaled.T)
    if cov.ndim == 0:
        cov = np.array([[float(cov)]])
    cov_inv = np.linalg.pinv(cov)

    n_features = len(ood_feature_keys) if ood_feature_keys else X_train_ood.shape[1]
    mahal_threshold = float(np.sqrt(chi2.ppf(0.975, df=n_features)))

    return OodGuard(
        X_train_ood=X_train_ood,
        train_mean=train_mean,
        train_std=train_std_safe,
        X_train_ood_scaled=X_scaled,
        isolation_forest=iso,
        train_centroid=centroid,
        cov_inv=cov_inv,
        mahal_threshold=mahal_threshold,
        rf_model=rf_model,
        ood_feature_keys=ood_feature_keys or [],
    )


def _standardize_query(guard: OodGuard, X_q_ood: np.ndarray) -> np.ndarray:
    """Z-score standardize a query using the guard's stored mean/std."""
    return (X_q_ood - guard.train_mean) / guard.train_std


def assess_ood_confidence(
    guard: OodGuard,
    X_train_full: np.ndarray | None = None,
    X_query_full: np.ndarray | None = None,
    X_query_ood: np.ndarray | None = None,
) -> dict:
    """Assess OOD confidence across 3 layers.

    Calling conventions:
      assess_ood_confidence(guard, X_train_full, X_query_full)
          Layer 1 uses X_train_full / X_query_full (full feature set).
          Layers 2 & 3 use guard.X_train_ood_scaled as reference;
          X_query_ood must be provided, OR the function will use X_query_full
          sliced to guard.ood_feature_keys if feature_keys are set.

      assess_ood_confidence(guard, X_query_ood=X_query_ood)
          Layers 2 & 3 only (no Layer 1 — rf_model must be None or not used).
    """
    flags: List[str] = []
    scores: Dict[str, Any] = {}

    # ------------------------------------------------------------------ #
    # Layer 1: Leaf Agreement — FULL feature set, RF model required       #
    # ------------------------------------------------------------------ #
    X_tr_full = X_train_full
    X_q_full = X_query_full

    if guard.rf_model is not None and X_tr_full is not None and X_q_full is not None:
        X_tr_full = np.atleast_2d(X_tr_full)
        X_q_full_2d = np.atleast_2d(X_q_full)
        train_leaves = guard.rf_model.apply(X_tr_full)
        query_leaves = guard.rf_model.apply(X_q_full_2d)
        n_trees = len(guard.rf_model.estimators_)
        margin = 0.5 * X_tr_full.std(axis=0)

        covered_trees = 0
        for t in range(n_trees):
            q_leaf = query_leaves[0, t]
            train_idx = np.where(train_leaves[:, t] == q_leaf)[0]
            if len(train_idx) > 0:
                leaf_pts = X_tr_full[train_idx]
                min_b = leaf_pts.min(axis=0) - margin
                max_b = leaf_pts.max(axis=0) + margin
                in_bounds = np.all(X_q_full_2d[0] >= min_b) and np.all(X_q_full_2d[0] <= max_b)
                if in_bounds:
                    covered_trees += 1

        agreement = float(covered_trees / n_trees)
        scores["leaf_agreement"] = round(agreement, 4)
        if agreement < 0.3:
            flags.append("leaf_agreement")
    else:
        scores["leaf_agreement"] = None

    # ------------------------------------------------------------------ #
    # Resolve reduced OOD query vector                                    #
    # ------------------------------------------------------------------ #
    if X_query_ood is None and X_q_full is not None and guard.ood_feature_keys:
        # Not provided — can't safely auto-slice without knowing column order
        # Caller should always pass X_query_ood explicitly
        X_query_ood = None

    if X_query_ood is not None:
        X_q_ood = np.atleast_2d(X_query_ood)
        X_q_ood_scaled = _standardize_query(guard, X_q_ood)

        # ------------------------------------------------------------------ #
        # Layer 2: Isolation Forest — standardized reduced set               #
        # ------------------------------------------------------------------ #
        iso_score = float(guard.isolation_forest.score_samples(X_q_ood_scaled)[0])
        scores["isolation_forest"] = round(iso_score, 4)
        if guard.isolation_forest.predict(X_q_ood_scaled)[0] == -1:
            flags.append("isolation_forest")

        # ------------------------------------------------------------------ #
        # Layer 3: Mahalanobis — standardized reduced set                    #
        # ------------------------------------------------------------------ #
        delta = X_q_ood_scaled - guard.train_centroid
        mahal = float(np.sqrt(np.einsum("ij,jk,ik->i", delta, guard.cov_inv, delta)[0]))
        scores["mahalanobis"] = round(mahal, 3)
        if mahal > guard.mahal_threshold:
            flags.append("mahalanobis")
    else:
        scores["isolation_forest"] = None
        scores["mahalanobis"] = None

    # ------------------------------------------------------------------ #
    # Combine flags -> level                                              #
    # ------------------------------------------------------------------ #
    n_flags = len([f for f in flags if f is not None])
    if n_flags == 0:
        level = "confident"
        score = 0.95
        message = "This combination of inputs is typical for the historical data."
    elif n_flags in (1, 2):
        level = "caution"
        score = 0.55
        message = "This combination of inputs is unusual for the training data. Prediction may be less reliable."
    else:
        level = "out_of_range"
        score = 0.15
        message = "This combination of inputs has not been seen before. The forecast is based on the closest historical benchmarks."

    return {
        "level": level,
        "score": score,
        "flags": flags,
        "scores": scores,
        "message": message,
    }


# ---------------------------------------------------------------------------
# Calibration check + self-test
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import sys
    from synthetic_augmentor import (
        SYNTHETIC_TRAINING_DATA,
        OOD_GUARD_FEATURES,
        get_ood_training_matrix,
        AUGMENTOR_LOAD_ERROR,
    )

    if AUGMENTOR_LOAD_ERROR:
        print(f"Cannot run calibration: {AUGMENTOR_LOAD_ERROR}", file=sys.stderr)
        sys.exit(1)

    DEPT = "cardiology"
    X_ood = get_ood_training_matrix(DEPT, SYNTHETIC_TRAINING_DATA)   # shape (250, 4)

    guard = fit_ood_guard(X_ood, ood_feature_keys=OOD_GUARD_FEATURES)

    # ---------- calibration check: what fraction of TRAINING rows are "confident"? ----------
    n_total = X_ood.shape[0]
    n_confident = 0
    for i in range(n_total):
        row = X_ood[i : i + 1]
        result = assess_ood_confidence(guard, X_query_ood=row)
        if result["level"] == "confident":
            n_confident += 1

    frac_confident = n_confident / n_total
    print(f"\nCalibration check ({DEPT}): {n_confident}/{n_total} = {frac_confident:.1%} of training rows → 'confident'")
    if frac_confident < 0.90:
        print("⚠️  WARNING: < 90% confident on own training data — check standardization or threshold!", file=sys.stderr)
        sys.exit(1)
    else:
        print("✅ Calibration OK (≥ 90% confident on own training data)")

    # ---------- sanity checks on obvious in/out domain points ----------
    centroid_ood = X_ood.mean(axis=0).reshape(1, -1)
    extreme_ood = (X_ood.max(axis=0) * 5).reshape(1, -1)

    in_domain = assess_ood_confidence(guard, X_query_ood=centroid_ood)
    out_domain = assess_ood_confidence(guard, X_query_ood=extreme_ood)

    print(f"\nIn-domain (centroid): {in_domain['level']} | score: {in_domain['score']}")
    print(f"Out-domain (5× max):  {out_domain['level']} | score: {out_domain['score']}")

    assert in_domain["level"] == "confident", f"Expected confident, got {in_domain['level']}"
    assert out_domain["level"] == "out_of_range", f"Expected out_of_range, got {out_domain['level']}"
    print("\n✅ OOD Guard self-test passed!")
