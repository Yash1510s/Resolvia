"""
Resolvia — ML Model Training & Comparison Engine
=================================================
Trains and compares 3 competitive classification algorithms:
  1. Random Forest Classifier
  2. Gradient Boosting Classifier
  3. XGBoost Classifier

Selects champion model, evaluates on unseen test set, generates
cryptographic model hash (SHA-256) for on-chain contract verification,
and serializes artifacts to `ai-engine/models/`.
"""

import os
import sys
import json
import hashlib
import time
from datetime import datetime, timezone
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.model_selection import StratifiedKFold, cross_val_score
from sklearn.metrics import (
    accuracy_score,
    f1_score,
    precision_score,
    recall_score,
    classification_report,
    confusion_matrix,
    log_loss,
)
from xgboost import XGBClassifier

# Ensure ai-engine directory and training directory are in sys.path
_THIS_DIR = os.path.dirname(os.path.abspath(__file__))
_AI_ENGINE_DIR = os.path.dirname(_THIS_DIR)
if _AI_ENGINE_DIR not in sys.path:
    sys.path.insert(0, _AI_ENGINE_DIR)
if _THIS_DIR not in sys.path:
    sys.path.insert(0, _THIS_DIR)

try:
    from training.feature_engineering import (
        DisputeFeatureExtractor,
        load_dataset,
        OUTCOME_MAP,
        REVERSE_OUTCOME_MAP,
    )
except ImportError:
    from feature_engineering import (
        DisputeFeatureExtractor,
        load_dataset,
        OUTCOME_MAP,
        REVERSE_OUTCOME_MAP,
    )


def compute_sha256(filepath):
    """Computes SHA-256 hash of a file for on-chain verification."""
    hasher = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(65536):
            hasher.update(chunk)
    return hasher.hexdigest()


def train_and_evaluate(
    data_dir=None,
    models_dir=None,
    max_tfidf=100,
    cv_folds=5,
):
    """Orchestrates end-to-end training, CV comparison, test evaluation, and model export."""
    start_time = time.time()

    # Resolve paths relative to ai-engine root if relative
    if data_dir is None:
        data_dir = os.path.join(_AI_ENGINE_DIR, "data")
    elif not os.path.isabs(data_dir):
        if not os.path.exists(data_dir) and os.path.exists(os.path.join(_AI_ENGINE_DIR, data_dir)):
            data_dir = os.path.join(_AI_ENGINE_DIR, data_dir)

    if models_dir is None:
        models_dir = os.path.join(_AI_ENGINE_DIR, "models")
    elif not os.path.isabs(models_dir):
        if not os.path.exists(models_dir) and os.path.exists(os.path.join(_AI_ENGINE_DIR, models_dir)):
            models_dir = os.path.join(_AI_ENGINE_DIR, models_dir)

    os.makedirs(models_dir, exist_ok=True)

    train_path = os.path.join(data_dir, "disputes_train.csv")
    test_path = os.path.join(data_dir, "disputes_test.csv")

    print("=" * 65)
    print("  RESOLVIA AI ENGINE — MODEL TRAINING & BENCHMARKING")
    print("=" * 65)
    print(f"  Training dataset:  {train_path}")
    print(f"  Test dataset:      {test_path}")

    # 1. Load data
    train_df, y_train = load_dataset(train_path)
    test_df, y_test = load_dataset(test_path)

    print(f"  Loaded {len(train_df)} training samples, {len(test_df)} test samples.")

    # 2. Extract features
    print("\n[Step 1/4] Running DisputeFeatureExtractor pipeline...")
    extractor = DisputeFeatureExtractor(max_tfidf_features=max_tfidf)
    X_train = extractor.fit_transform(train_df)
    X_test = extractor.transform(test_df)

    feature_names = extractor.get_feature_names()
    print(f"  [OK] Extracted {X_train.shape[1]} features per dispute record.")

    # 3. Model definitions (tuned for 8GB RAM systems)
    candidate_models = {
        "Random Forest": RandomForestClassifier(
            n_estimators=80,
            max_depth=10,
            min_samples_split=5,
            min_samples_leaf=3,
            random_state=42,
            n_jobs=1,
        ),
        "Gradient Boosting": GradientBoostingClassifier(
            n_estimators=80,
            learning_rate=0.1,
            max_depth=4,
            subsample=0.8,
            random_state=42,
        ),
        "XGBoost": XGBClassifier(
            n_estimators=80,
            learning_rate=0.1,
            max_depth=4,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=42,
            eval_metric="mlogloss",
            tree_method="hist",
            n_jobs=1,
        ),
    }

    # 4. Cross-Validation and Test Evaluation
    print(f"\n[Step 2/4] Benchmarking candidate models ({cv_folds}-Fold Stratified CV)...")
    cv = StratifiedKFold(n_splits=cv_folds, shuffle=True, random_state=42)
    results = {}

    for name, model in candidate_models.items():
        print(f"  Evaluating {name:20s}...", end=" ", flush=True)
        cv_scores = cross_val_score(model, X_train, y_train, cv=cv, scoring="f1_macro", n_jobs=1)
        mean_cv_f1 = float(np.mean(cv_scores))
        std_cv_f1 = float(np.std(cv_scores))

        # Train on full training set
        model.fit(X_train, y_train)

        # Predict on unseen test set
        y_pred = model.predict(X_test)
        y_prob = model.predict_proba(X_test)

        test_acc = float(accuracy_score(y_test, y_pred))
        test_f1_macro = float(f1_score(y_test, y_pred, average="macro"))
        test_f1_weighted = float(f1_score(y_test, y_pred, average="weighted"))
        test_precision = float(precision_score(y_test, y_pred, average="macro"))
        test_recall = float(recall_score(y_test, y_pred, average="macro"))
        test_loss = float(log_loss(y_test, y_prob))

        results[name] = {
            "model": model,
            "cv_f1_macro_mean": mean_cv_f1,
            "cv_f1_macro_std": std_cv_f1,
            "test_accuracy": test_acc,
            "test_f1_macro": test_f1_macro,
            "test_f1_weighted": test_f1_weighted,
            "test_precision_macro": test_precision,
            "test_recall_macro": test_recall,
            "test_log_loss": test_loss,
            "y_pred": y_pred,
            "y_prob": y_prob,
        }
        print(f"CV F1: {mean_cv_f1:.4f} (+/- {std_cv_f1:.4f}) | Test Acc: {test_acc:.4f} | Test F1: {test_f1_macro:.4f}")

    # 5. Select Champion Model (highest test macro F1)
    champion_name = max(results.keys(), key=lambda k: results[k]["test_f1_macro"])
    champion_data = results[champion_name]
    champion_model = champion_data["model"]

    print("\n" + "=" * 65)
    print(f"  CHAMPION MODEL SELECTED: {champion_name.upper()}")
    print("=" * 65)
    print(f"  Test Accuracy:     {champion_data['test_accuracy'] * 100:.2f}%")
    print(f"  Test Macro F1:     {champion_data['test_f1_macro']:.4f}")
    print(f"  Test Precision:    {champion_data['test_precision_macro']:.4f}")
    print(f"  Test Recall:       {champion_data['test_recall_macro']:.4f}")
    print(f"  Test Log Loss:     {champion_data['test_log_loss']:.4f}")

    # Classification report
    print("\n  Classification Report (Test Set):")
    target_names = [REVERSE_OUTCOME_MAP[i] for i in range(3)]
    report_dict = classification_report(
        y_test,
        champion_data["y_pred"],
        target_names=target_names,
        output_dict=True,
    )
    for class_name in target_names:
        metrics = report_dict[class_name]
        print(f"    {class_name:24s}: Precision={metrics['precision']:.3f}, Recall={metrics['recall']:.3f}, F1={metrics['f1-score']:.3f}")

    # Confusion matrix
    cm = confusion_matrix(y_test, champion_data["y_pred"])
    print("\n  Confusion Matrix (Rows: Actual, Cols: Predicted):")
    print(f"                         {'Claimant':>10} {'Respondent':>12} {'Compromise':>12}")
    for idx, row in enumerate(cm):
        print(f"    {target_names[idx]:20s}: {row[0]:10d} {row[1]:12d} {row[2]:12d}")

    # 6. Feature Importance ranking (Top 15)
    print("\n[Step 3/4] Extracting Feature Importances...")
    importances = None
    if hasattr(champion_model, "feature_importances_"):
        importances = champion_model.feature_importances_
        sorted_indices = np.argsort(importances)[::-1]
        print("  Top 15 Most Influential Dispute Features:")
        top_features = []
        for rank, idx in enumerate(sorted_indices[:15], 1):
            feat_name = feature_names[idx]
            feat_imp = float(importances[idx])
            top_features.append({"rank": rank, "feature": feat_name, "importance": feat_imp})
            print(f"    #{rank:02d} {feat_name:35s}: {feat_imp * 100:6.2f}%")
    else:
        top_features = []

    # 7. Category-wise performance breakdown (Fairness / Zero-Bias audit)
    print("\n  Category-wise Performance Audit (Fairness check):")
    category_metrics = {}
    test_categories = test_df["category"].values
    for cat in sorted(test_df["category"].unique()):
        cat_mask = (test_categories == cat)
        if np.sum(cat_mask) > 0:
            cat_y_true = y_test[cat_mask]
            cat_y_pred = champion_data["y_pred"][cat_mask]
            cat_acc = float(accuracy_score(cat_y_true, cat_y_pred))
            cat_f1 = float(f1_score(cat_y_true, cat_y_pred, average="macro", zero_division=0))
            category_metrics[cat] = {"accuracy": cat_acc, "f1_macro": cat_f1, "sample_count": int(np.sum(cat_mask))}
            print(f"    {cat:15s} (n={np.sum(cat_mask):3d}): Accuracy={cat_acc * 100:5.1f}%, F1={cat_f1:.3f}")

    # 8. Save artifacts to models/
    print("\n[Step 4/4] Serializing model artifacts & generating on-chain hash...")

    model_filepath = os.path.join(models_dir, "dispute_classifier.joblib")
    extractor_filepath = os.path.join(models_dir, "feature_extractor.joblib")

    joblib.dump(champion_model, model_filepath)
    joblib.dump(extractor, extractor_filepath)

    # Compute SHA-256 hash
    model_sha256 = compute_sha256(model_filepath)
    extractor_sha256 = compute_sha256(extractor_filepath)

    print(f"  [OK] Saved model:     {model_filepath}")
    print(f"  [OK] Saved extractor: {extractor_filepath}")
    print(f"  [OK] Model SHA-256:   {model_sha256}")

    # Summary json
    summary_data = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "elapsed_seconds": round(time.time() - start_time, 2),
        "champion_model": champion_name,
        "model_sha256": model_sha256,
        "extractor_sha256": extractor_sha256,
        "metrics": {
            "test_accuracy": champion_data["test_accuracy"],
            "test_f1_macro": champion_data["test_f1_macro"],
            "test_f1_weighted": champion_data["test_f1_weighted"],
            "test_precision_macro": champion_data["test_precision_macro"],
            "test_recall_macro": champion_data["test_recall_macro"],
            "test_log_loss": champion_data["test_log_loss"],
        },
        "all_models_benchmark": {
            k: {
                "cv_f1_macro_mean": v["cv_f1_macro_mean"],
                "cv_f1_macro_std": v["cv_f1_macro_std"],
                "test_accuracy": v["test_accuracy"],
                "test_f1_macro": v["test_f1_macro"],
                "test_log_loss": v["test_log_loss"],
            }
            for k, v in results.items()
        },
        "top_features": top_features,
        "category_metrics": category_metrics,
        "target_classes": OUTCOME_MAP,
        "num_train_samples": len(train_df),
        "num_test_samples": len(test_df),
        "num_features": X_train.shape[1],
    }

    metadata_path = os.path.join(models_dir, "model_metadata.json")
    with open(metadata_path, "w", encoding="utf-8") as f:
        json.dump(summary_data, f, indent=2)

    print(f"  [OK] Saved metadata:  {metadata_path}")
    print("\n" + "=" * 65)
    print(f"  TRAINING PIPELINE FINISHED IN {summary_data['elapsed_seconds']} SECONDS")
    print("=" * 65)

    return summary_data


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Train and evaluate Resolvia dispute classifiers")
    parser.add_argument("--data", type=str, default=None, help="Directory containing CSV files (default: ai-engine/data)")
    parser.add_argument("--models", type=str, default=None, help="Directory to save model artifacts (default: ai-engine/models)")
    parser.add_argument("--tfidf", type=int, default=40, help="Max TF-IDF features per statement")
    parser.add_argument("--cv", type=int, default=5, help="Number of CV folds")
    args = parser.parse_args()

    train_and_evaluate(
        data_dir=args.data,
        models_dir=args.models,
        max_tfidf=args.tfidf,
        cv_folds=args.cv,
    )
