"""
Resolvia — Standalone Model Evaluation Script
=============================================
Loads the test dataset (disputes_test.csv) and evaluates
the saved XGBoost champion model.

Usage:
    python evaluate_model.py
"""

import os
import joblib
import pandas as pd
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from training.feature_engineering import OUTCOME_MAP

def evaluate():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    test_csv = os.path.join(base_dir, "data", "disputes_test.csv")
    extractor_path = os.path.join(base_dir, "models", "feature_extractor.joblib")
    model_path = os.path.join(base_dir, "models", "dispute_classifier.joblib")

    print("=" * 60)
    print("  RESOLVIA ML ENGINE — MODEL EVALUATION")
    print("=" * 60)

    # 1. Load data
    print(f"\n[1/3] Loading test dataset from: {test_csv}")
    df_test = pd.read_csv(test_csv)
    print(f"      Loaded {len(df_test)} test dispute samples.")

    # 2. Load model
    print(f"\n[2/3] Loading saved model artifacts...")
    extractor = joblib.load(extractor_path)
    model = joblib.load(model_path)
    print(f"      Champion Model: XGBoost ({len(extractor.get_feature_names())} features)")

    # 3. Predict & evaluate
    print(f"\n[3/3] Running inference on unseen test disputes...")
    X_test = extractor.transform(df_test)
    y_test = df_test["outcome"].map(OUTCOME_MAP).values
    y_pred = model.predict(X_test)

    acc = accuracy_score(y_test, y_pred)
    target_names = ["Claimant Justified", "Respondent Justified", "Compromise"]

    print("\n" + "=" * 60)
    print(f"  FINAL TEST ACCURACY: {acc * 100:.2f}%")
    print("=" * 60)
    print("\nClassification Report:\n")
    print(classification_report(y_test, y_pred, target_names=target_names))

    print("Confusion Matrix:")
    cm = confusion_matrix(y_test, y_pred)
    cm_df = pd.DataFrame(cm, index=target_names, columns=[f"Pred {n}" for n in target_names])
    print(cm_df.to_string())
    print("\n" + "=" * 60)

if __name__ == "__main__":
    evaluate()
