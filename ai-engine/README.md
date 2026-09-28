# Resolvia AI & ML Engine

> **Advisory-Only Architecture:** Under Section 63 of Bharatiya Sakshya Adhiniyam 2023, automated outputs are non-binding decision-support indicators. Authoritative verdict power rests solely with the elected human jury panel.

The **Resolvia AI & ML Engine** is a dual-pipeline system combining **deterministic statistical Machine Learning** with **multi-provider LLM narrative synthesis** and **OWASP prompt injection defense**.

---

## 1. System Overview

```
                      ┌───────────────────────────────────────────────┐
                      │          Incoming Dispute Case Payload         │
                      │  (Statements, Evidence Signals, Claim Amount)  │
                      └───────────────────────┬───────────────────────┘
                                              │
                      ┌───────────────────────▼───────────────────────┐
                      │    OWASP LLM01 Prompt Injection Defense       │
                      │ (Regex adversarial scanning & text scrubbing) │
                      └───────────────────────┬───────────────────────┘
                                              │
                     ┌────────────────────────┴────────────────────────┐
                     ▼                                                 ▼
     ┌───────────────────────────────┐                 ┌───────────────────────────────┐
     │   Supervised ML Predictor     │                 │   Advisory LLM Orchestrator   │
     │   (XGBoost Champion Model)    │                 │   (Gemini / OpenAI / Ollama)  │
     ├───────────────────────────────┤                 ├───────────────────────────────┤
     │ • 98-dim hybrid feature vector│                 │ • Timeline reconstruction     │
     │ • TF-IDF + VADER sentiment    │                 │ • Contradiction radar         │
     │ • Evidence credibility signals│                 │ • Claim-to-evidence matrix    │
     │ • Multi-class probabilities   │                 │ • BSA 2023 statutory advisory │
     └───────────────┬───────────────┘                 └───────────────┬───────────────┘
                     │                                                 │
                     └────────────────────────┬────────────────────────┘
                                              │
                                ┌─────────────▼─────────────┐
                                │ Unified Advisory Package  │
                                │ (JSON to Juror & Backend) │
                                └───────────────────────────┘
```

---

## 2. Machine Learning Model Performance

Trained on stratified 5-fold cross-validation with an unseen 400-sample test set:

| Model | Test Accuracy | Macro F1 | Weighted F1 | Log-Loss | Status |
|---|---|---|---|---|---|
| Random Forest | 91.25% | 0.8980 | 0.9112 | 0.4533 | Evaluated |
| Gradient Boosting | 93.75% | 0.9247 | 0.9368 | 0.2642 | Evaluated |
| **XGBoost** | **94.00%** | **0.9286** | **0.9392** | **0.2664** | **PRODUCTION CHAMPION** |

### Output Classes:
1. `Claimant Justified` (Full claim upheld)
2. `Respondent Justified` (Claim rejected)
3. `Compromise` (Split liability / mutual settlement)

---

## 3. Directory Layout

```
ai-engine/
├── README.md                      # This documentation file
├── ML_ROADMAP.md                  # Comprehensive 4-Phase ML evolution roadmap
├── analysis_pipeline.py           # Multi-provider LLM pipeline + Prompt injection defense
├── ml_predictor.py                # Singleton ML inference engine (loads XGBoost model)
├── evaluate_model.py              # Standalone test evaluation script
├── requirements.txt               # Python package dependencies
├── data/
│   ├── generate_dataset.py        # Generates balanced dispute datasets
│   ├── disputes_train.csv         # 1,600 training dispute records
│   └── disputes_test.csv          # 400 holdout test dispute records
├── training/
│   ├── feature_engineering.py     # 98-feature NLP + structured feature extractor
│   └── train_model.py             # Cross-validation, training & model export pipeline
└── models/
    ├── dispute_classifier.joblib  # Trained XGBoost model artifact (SHA-256 verified)
    ├── feature_extractor.joblib   # Fitted vectorizer & scaler pipeline
    └── model_metadata.json        # Benchmark metrics, feature importance & hashes
```

---

## 4. Quickstart & Usage

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Run Inference via Python
```python
from ml_predictor import predict_dispute

result = predict_dispute({
    "case_id": "case-084",
    "title": "Unpaid Milestone for Mobile App Delivery",
    "category": "Freelance",
    "claim_amount": 2500,
    "claimant_statement": "Completed all 4 milestones, client confirmed acceptance in chat, payment overdue 45 days.",
    "respondent_statement": "App has persistent memory leaks on iOS. Rejected milestone until fixed.",
    "evidence_list": [
        {"title": "Signed Scope of Work", "type": "contract"},
        {"title": "Client Chat Approval", "type": "communication"}
    ]
})

print("Predicted Outcome:", result["outcome"])
print("Probabilities:", result["probabilities"])
print("Confidence:", result["confidence"])
```

### 3. Retrain Pipeline
```bash
# Generate fresh dataset (optional)
python data/generate_dataset.py

# Train models and export new champion
python training/train_model.py

# Evaluate against holdout test set
python evaluate_model.py
```

---

## 5. ML Evolution Roadmap

See [ML_ROADMAP.md](file:///c:/Users/YASH%20VIJAY%20SINGH/Desktop/MLBC%20project%20copy/Resolvia/ai-engine/ML_ROADMAP.md) for the complete roadmap:
* **Phase 0 (Done):** Baseline XGBoost (94% accuracy) + TF-IDF + VADER sentiment + 8-category OHE.
* **Phase 1 (Weeks 1–3):** 10,000+ real-world ADR dataset expansion, SMOTE for rare dispute classes, drift monitoring.
* **Phase 2 (Weeks 4–6):** Dense BGE/Legal-BERT embeddings, TreeSHAP feature attribution for juror console.
* **Phase 3 (Weeks 7–10):** Multi-modal OCR/VLM evidence parsing (PDFs, receipts, chats), domain QLoRA fine-tuning.
* **Phase 4 (Weeks 11–14):** Closed-verdict active learning flywheel, model registry, on-chain model hash anchoring (`CaseRegistry.sol`).
