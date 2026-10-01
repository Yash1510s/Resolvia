"""
Resolvia — ML Inference Predictor
===================================
Loads the trained XGBoost champion model and TF-IDF feature extractor,
and provides real-time dispute outcome predictions.

This module is consumed by analysis_pipeline.py to augment LLM-based
analysis with a deterministic ML second opinion.

On-Chain Integrity:
  The model SHA-256 hash stored in model_metadata.json can be registered
  on-chain via the DisputeResolution smart contract for tamper verification.
"""

import os
import json
import hashlib
import numpy as np
import joblib
from typing import Dict, Any, Optional, List


# ─── Paths ────────────────────────────────────────────────────────────────────
_THIS_DIR = os.path.dirname(os.path.abspath(__file__))
_MODELS_DIR = os.path.join(_THIS_DIR, "models")
_MODEL_PATH = os.path.join(_MODELS_DIR, "dispute_classifier.joblib")
_EXTRACTOR_PATH = os.path.join(_MODELS_DIR, "feature_extractor.joblib")
_METADATA_PATH = os.path.join(_MODELS_DIR, "model_metadata.json")

# ─── Outcome labels ──────────────────────────────────────────────────────────
OUTCOME_LABELS = {
    0: "Claimant Justified",
    1: "Respondent Justified",
    2: "Compromise",
}

# ─── Favored party mapping (for API compatibility) ────────────────────────────
FAVORED_PARTY_MAP = {
    "Claimant Justified": "Claimant",
    "Respondent Justified": "Respondent",
    "Compromise": "Split Settlement",
}


class MLPredictor:
    """
    Singleton-style ML inference engine for dispute outcome prediction.

    Usage:
        predictor = MLPredictor()
        result = predictor.predict(dispute_data)
    """

    _instance: Optional["MLPredictor"] = None

    def __new__(cls):
        """Singleton: load model only once across all requests."""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._loaded = False
        return cls._instance

    def __init__(self):
        if not self._loaded:
            self._load_artifacts()

    def _load_artifacts(self):
        """Load model, extractor, and metadata from disk."""
        try:
            self.model = joblib.load(_MODEL_PATH)
            self.extractor = joblib.load(_EXTRACTOR_PATH)

            self.metadata = {}
            if os.path.exists(_METADATA_PATH):
                with open(_METADATA_PATH, "r", encoding="utf-8") as f:
                    self.metadata = json.load(f)

            self.model_sha256 = self.metadata.get("model_sha256", "unknown")
            self.champion_name = self.metadata.get("champion_model", "Unknown")
            self.feature_names = self.extractor.get_feature_names()
            self._loaded = True
            print(f"[ML-Predictor] Loaded {self.champion_name} model ({len(self.feature_names)} features)")
            print(f"[ML-Predictor] Model SHA-256: {self.model_sha256[:16]}...")

        except FileNotFoundError:
            print("[ML-Predictor] WARNING: Model artifacts not found. ML predictions disabled.")
            self.model = None
            self.extractor = None
            self._loaded = True  # prevent retry loop

        except Exception as e:
            print(f"[ML-Predictor] ERROR loading model: {e}")
            self.model = None
            self.extractor = None
            self._loaded = True

    @property
    def is_available(self) -> bool:
        """Returns True if model is loaded and ready for inference."""
        return self.model is not None and self.extractor is not None

    def predict(self, dispute_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Predict dispute outcome from raw dispute data.

        Args:
            dispute_data: Dict with keys:
                - claimant_statement (str)
                - respondent_statement (str)
                - category (str, optional)
                - evidence_count (int, optional)
                - is_monetary (bool, optional)
                - dispute_amount (float, optional)
                - has_written_agreement (bool, optional)
                - has_communication_proof (bool, optional)
                - has_visual_proof (bool, optional)
                - has_witness (bool, optional)
                - has_official_record (bool, optional)
                - has_timeline_proof (bool, optional)

        Returns:
            Dict with prediction results or None if model unavailable.
        """
        if not self.is_available:
            return None

        try:
            # Extract features using the fitted pipeline
            X = self.extractor.transform(dispute_data)

            # Predict class and probabilities
            y_pred = self.model.predict(X)[0]
            y_prob = self.model.predict_proba(X)[0]

            predicted_outcome = OUTCOME_LABELS[int(y_pred)]
            confidence = float(np.max(y_prob)) * 100

            # Build probability breakdown
            probability_breakdown = {}
            for idx, label in OUTCOME_LABELS.items():
                probability_breakdown[label] = round(float(y_prob[idx]) * 100, 2)

            # Extract top contributing features for explainability
            top_reasons = self._extract_top_reasons(X[0])

            result = {
                "predictedOutcome": predicted_outcome,
                "favoredParty": FAVORED_PARTY_MAP.get(predicted_outcome, "Unknown"),
                "confidence": round(confidence, 2),
                "probabilityBreakdown": probability_breakdown,
                "topReasons": top_reasons,
                "advisory": True,
                "benchmarkType": "SYNTHETIC_BENCHMARK",
                "disclaimer": "Advisory Only — Non-Binding Arbitral Assessment",
                "modelInfo": {
                    "name": self.champion_name,
                    "sha256": self.model_sha256,
                    "featureCount": len(self.feature_names),
                    "trainingSamples": self.metadata.get("num_train_samples", 0),
                    "benchmarkAccuracy": self.metadata.get("metrics", {}).get("test_accuracy", 0),
                    "benchmarkF1": self.metadata.get("metrics", {}).get("test_f1_macro", 0),
                    "accuracyType": "synthetic_benchmark_distribution",
                },
            }

            return result

        except Exception as e:
            print(f"[ML-Predictor] Prediction error: {e}")
            return None

    def _extract_top_reasons(self, feature_vector: np.ndarray, top_n: int = 5) -> List[Dict[str, Any]]:
        """Extract top N feature contributions for the prediction (explainability)."""
        reasons = []
        if not hasattr(self.model, "feature_importances_"):
            return reasons

        importances = self.model.feature_importances_
        # Weighted contribution = feature_value * global_importance
        contributions = np.abs(feature_vector) * importances
        sorted_indices = np.argsort(contributions)[::-1]

        for idx in sorted_indices[:top_n]:
            feat_name = self.feature_names[idx]
            # Clean up feature name for display
            display_name = self._humanize_feature_name(feat_name)
            reasons.append({
                "feature": feat_name,
                "displayName": display_name,
                "contribution": round(float(contributions[idx]) * 100, 3),
                "value": round(float(feature_vector[idx]), 4),
            })

        return reasons

    @staticmethod
    def _humanize_feature_name(feat_name: str) -> str:
        """Convert internal feature name to human-readable label."""
        mappings = {
            "has_official_record": "Official Records Present",
            "has_written_agreement": "Written Agreement Exists",
            "has_communication_proof": "Communication Proof Available",
            "has_visual_proof": "Visual Evidence Submitted",
            "has_witness": "Witness Statement Filed",
            "has_timeline_proof": "Timeline Documentation Present",
            "evidence_count": "Number of Evidence Items",
            "total_evidence_signals": "Total Evidence Strength",
            "is_monetary": "Monetary Dispute",
            "log_amount_disputed": "Dispute Amount (Scale)",
            "statement_cosine_similarity": "Statement Agreement Level",
            "sentiment_gap_compound": "Sentiment Divergence",
            "word_count_ratio": "Statement Length Ratio",
        }

        if feat_name in mappings:
            return mappings[feat_name]

        # Category features
        if feat_name.startswith("cat_"):
            return f"Category: {feat_name[4:]}"

        # Sentiment features
        if "sentiment" in feat_name:
            parts = feat_name.split("_")
            party = parts[0].title()
            metric = parts[-1].title()
            return f"{party} Sentiment ({metric})"

        # TF-IDF features
        if "tfidf" in feat_name:
            parts = feat_name.split("tfidf_")
            party = "Claimant" if "claimant" in parts[0] else "Respondent"
            keyword = parts[-1].replace("_", " ").title() if len(parts) > 1 else "keyword"
            return f"{party} mentioned '{keyword}'"

        # Text signal features
        if "denial_count" in feat_name:
            party = "Claimant" if "claimant" in feat_name else "Respondent"
            return f"{party} Denial Language"
        if "concession_count" in feat_name:
            party = "Claimant" if "claimant" in feat_name else "Respondent"
            return f"{party} Concession Language"
        if "specificity_count" in feat_name:
            party = "Claimant" if "claimant" in feat_name else "Respondent"
            return f"{party} Specificity (Dates/Numbers)"

        return feat_name.replace("_", " ").title()


def predict_dispute(
    claimant_statement: str,
    respondent_statement: str,
    category: str = "Personal",
    evidence_list: Optional[List[Dict[str, Any]]] = None,
    dispute_amount: float = 0.0,
) -> Optional[Dict[str, Any]]:
    """
    Convenience function for one-shot predictions without managing the predictor.

    Args:
        claimant_statement: The claimant's dispute description.
        respondent_statement: The respondent's counter-statement.
        category: Dispute category (Academic, Community, Consumer, etc.).
        evidence_list: List of evidence dicts with optional type/description.
        dispute_amount: Monetary amount in dispute (0 for non-monetary).

    Returns:
        Prediction result dict or None.
    """
    predictor = MLPredictor()
    if not predictor.is_available:
        return None

    # Parse evidence list into structured flags
    ev = evidence_list or []
    evidence_types = []
    for item in ev:
        if isinstance(item, dict):
            ev_type = item.get("type", item.get("evidenceType", ""))
            evidence_types.append(ev_type.lower())

    dispute_data = {
        "claimant_statement": claimant_statement,
        "respondent_statement": respondent_statement,
        "category": category,
        "evidence_count": len(ev),
        "is_monetary": dispute_amount > 0,
        "dispute_amount": dispute_amount,
        "has_written_agreement": any(t in str(evidence_types) for t in
            ["contract", "agreement", "lease", "employment", "terms"]),
        "has_communication_proof": any(t in str(evidence_types) for t in
            ["email", "chat", "message", "letter", "communication"]),
        "has_visual_proof": any(t in str(evidence_types) for t in
            ["photo", "video", "screenshot", "image"]),
        "has_witness": any(t in str(evidence_types) for t in
            ["witness"]),
        "has_official_record": any(t in str(evidence_types) for t in
            ["receipt", "record", "bank", "pay", "invoice", "log", "attendance"]),
        "has_timeline_proof": any(t in str(evidence_types) for t in
            ["transaction", "timeline", "delivery", "tracking", "inspection"]),
    }

    return predictor.predict(dispute_data)
