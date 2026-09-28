# Resolvia AI Engine — Machine Learning Training & Evolution Roadmap

**Document Version:** 2.0.0  
**Last Updated:** 29 September 2026  
**Scope:** Machine Learning, Predictive Modeling, NLP Feature Engineering, Explainability (XAI), and On-Chain Model Integrity for Resolvia's Dispute Arbitration Advisory Engine.

---

## 1. Executive Summary & Vision

Resolvia's AI Engine operates under a strict, legally grounded boundary:
> **"AI is advisory; the human jury makes the binding decision."** *(Bharatiya Sakshya Adhiniyam 2023, Section 63)*

The Machine Learning subsystem serves as an objective, statistical "Second Opinion" alongside LLM narrative synthesis. It evaluates dispute claims, counter-claims, financial disparities, and forensic evidence signals to predict dispute probability distributions across three outcomes:
1. `Claimant Justified` (Full claim upheld)
2. `Respondent Justified` (Claim rejected)
3. `Compromise` (Split liability / mutual settlement)

This roadmap documents the transition from our current **Phase 0 (Baseline Champion Model)** to a **verifiable, multi-modal, continuously learning decentralized ML pipeline**.

---

## 2. Current Architecture & Baseline Status (Phase 0 — COMPLETED)

### 2.1 Model Benchmark & Production Champion (28 Sep 2026)
Across rigorous 5-fold cross-validation and a 20% holdout test set (400 unseen disputes), the models benchmarked as follows:

| Model | CV F1-Macro (Mean ± Std) | Test Accuracy | Test F1-Macro | Test Log-Loss | Status |
|---|---|---|---|---|---|
| **Random Forest** | 0.9044 ± 0.0106 | 91.25% | 0.8980 | 0.4533 | Evaluated |
| **Gradient Boosting** | 0.9413 ± 0.0119 | 93.75% | 0.9247 | 0.2642 | Evaluated |
| **XGBoost (Champion)** | **0.9424 ± 0.0086** | **94.00%** | **0.9286** | **0.2664** | **PRODUCTION CHAMPION** |

### 2.2 Current Production Artifacts
* **Classifier Model:** `ai-engine/models/dispute_classifier.joblib` (SHA-256: `8d6d14dd...`)
* **Feature Extractor:** `ai-engine/models/feature_extractor.joblib` (SHA-256: `269ad106...`)
* **Model Metadata & Benchmark:** `ai-engine/models/model_metadata.json`
* **Inference Engine:** `ai-engine/ml_predictor.py` (Singleton loader with fallback)
* **Advisory Orchestration:** `ai-engine/analysis_pipeline.py` (OWASP prompt injection defense + LLM multi-provider + ML outcome prediction)

### 2.3 Current Feature Composition (98 Dimensions)
1. **Textual TF-IDF (80 features):** Uni-gram and bi-gram representations of claimant and respondent statements.
2. **Semantic Divergence:** Cosine distance between opposing parties' claims.
3. **Sentiment Polarity (VADER):** Compound sentiment score and emotional divergence gap.
4. **Specificity & Credibility:** Frequency of date mentions, quantitative tokens, and currency amounts.
5. **Linguistic Signals:** Keyword counts of denial (`false`, `breach`, `stole`) vs concession (`admitted`, `apologized`, `refunded`).
6. **Evidence Metadata Signals:** Flags for written agreements, communication logs, visual proofs, witness statements, official records, and chronological timeline verification.
7. **Dispute Category:** One-hot encoding across 8 universal domains (`Academic`, `Community`, `Consumer`, `Digital`, `Freelance`, `Personal`, `Property`, `Workplace`).
8. **Financial Scale:** Log-transformed claim amounts.

---

## 3. Four-Phase Evolution Roadmap

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               ML TRAINING & EVOLUTION ROADMAP                          │
├─────────────────────┬──────────────────────┬────────────────────┬──────────────────────┤
│      PHASE 1        │       PHASE 2        │      PHASE 3       │       PHASE 4        │
│ Dataset Flywheel &  │ Semantic Embeddings  │ Multi-Modal Intake │ Continuous Learning  │
│ Data Quality        │  & Explainable AI    │ & Domain LLM LoRA  │ & zkML On-Chain      │
│ (Weeks 1–3)         │ (Weeks 4–6)          │ (Weeks 7–10)       │ (Weeks 11–14)        │
└─────────────────────┴──────────────────────┴────────────────────┴──────────────────────┘
```

---

### Phase 1: Real-World Dataset Expansion & Robustness (Weeks 1–3)

**Objective:** Move beyond template-based synthetic datasets to diverse, edge-case resilient, and real-world ADR (Alternative Dispute Resolution) distributions.

#### Key Deliverables:
1. **Semi-Synthetic & Open-Source ADR Dataset Ingestion:**
   - Ingest public small-claims judgments, consumer forum disputes (NCDRC/Consumer Court records), and e-commerce arbitration case studies.
   - Expand dataset size from 2,000 samples to 10,000+ high-fidelity multi-turn dispute records.
2. **Adversarial & Edge-Case Generation:**
   - Generate complex borderline cases:
     * Disproportionate evidence (heavy documentation on irrelevant claims).
     * High emotional hostility but legally baseless claims.
     * Partial performance with subjective acceptance criteria (e.g. freelance design).
     * Mutual contractual breach (both parties partially at fault).
3. **Class Imbalance & Minority Category Handling:**
   - Apply SMOTE (Synthetic Minority Over-sampling Technique) or class-weighted focal loss to underrepresented dispute domains (`Academic`, `IP/Digital Assets`).
4. **Strict Featurization Hygiene & Split Validation:**
   - Maintain strict separation: train/validation/test splits established *before* any feature extraction, vectorizer fitting, or scaling to eliminate data leakage.

**Success Metrics:**
* Test dataset expansion to ≥2,500 samples across all 8 dispute categories.
* Macro F1-score across all categories $\ge 0.93$.
* Zero data leakage verified via cross-dataset drift test.

---

### Phase 2: Dense Semantic Embeddings & Explainable AI (XAI) (Weeks 4–6)

**Objective:** Upgrade from sparse TF-IDF to dense contextual legal representations, and provide jurors with interpretable, mathematically sound reasons for model predictions.

#### Key Deliverables:
1. **Dense Legal Embeddings (Hybrid Feature Space):**
   - Supplement/replace TF-IDF with domain-adapted embeddings using `BAAI/bge-small-en-v1.5` or `Legal-BERT`.
   - Compute explicit **Claim-to-Evidence Alignment Scores** via cross-attention cosine similarity between evidence descriptions and claim clauses.
2. **Local Feature Explainability via TreeSHAP:**
   - Integrate `shap.TreeExplainer` into `ml_predictor.py`.
   - For every inference request, compute exact Shapley feature contributions:
     * *Example Output:* "Claimant probability boosted by +28% due to verified official record, +14% due to invoice timestamp match, −8% due to high semantic divergence in delivery logs."
3. **Juror Decision Support UI Integration:**
   - Render visual feature importance waterfall charts directly in the juror deliberation console (`frontend/app/(app)/jury/[caseId]/page.tsx`).
4. **Model Fairness & Bias Auditing:**
   - Conduct disparate impact testing across party categories to guarantee the model does not exhibit systematic bias against individual claimants vs institutional respondents.

**Success Metrics:**
* Average inference latency $\le 85\text{ms}$ per dispute (including SHAP attribution).
* Top-3 SHAP factors dynamically displayed in the UI for 100% of analyzed cases.
* Disparate impact ratio within $0.90 \le \text{DIR} \le 1.10$ across all categories.

---

### Phase 3: Multi-Modal Document Parsing & Domain LLM Fine-Tuning (Weeks 7–10)

**Objective:** Enable automated parsing of raw evidence files (PDFs, bank receipts, WhatsApp screenshots) and fine-tune open-weights LLMs for statutory BSA 2023 legal synthesis.

#### Key Deliverables:
1. **Multi-Modal Evidence Feature Extractor:**
   - Add OCR & document vision processing (via `pytesseract` / `LayoutLMv3` / vision LLM fallback) to parse raw uploaded evidence in `backend/uploads/`.
   - Automatically extract:
     * Transaction amounts, dates, and account identifiers from bank slips.
     * Signature presence on contracts.
     * Message timestamps and sender identities from chat exports.
   - Feed extracted structured signals directly into the XGBoost feature vector.
2. **Domain-Specific Legal LoRA Fine-Tuning:**
   - Fine-tune an open-source model (`Llama-3.1-8B-Instruct` or `Mistral-7B-Instruct`) using QLoRA.
   - Target objectives:
     * Chronological timeline synthesis.
     * Contradiction detection between statement and submitted receipts.
     * Section 63 BSA 2023 formal compliance certificates.
3. **Probability Calibration:**
   - Implement Platt Scaling / Isotonic Regression to ensure that predicted probabilities (e.g. "82% Claimant Justified") accurately reflect real-world empirical confidence.
   - Evaluate with Brier Score and Reliability Diagrams.

**Success Metrics:**
* Expected Calibration Error (ECE) $\le 0.04$.
* Multi-modal document parser extracts key financial amounts with $\ge 96\%$ recall.
* Fine-tuned LLM passes prompt-injection security benchmark with 0% leak rate.

---

### Phase 4: Decentralized Active Learning & Verifiable ML (Weeks 11–14)

**Objective:** Create a self-improving data flywheel from closed disputes and link ML model provenance immutably to the blockchain ledger.

#### Key Deliverables:
1. **Post-Verdict Active Learning Flywheel:**
   - When a human jury panel settles a dispute and the 48-hour appeal window expires, the closed case data is sanitized (PII redacted) and queued in the retraining pool.
   - High-disagreement cases (e.g. 3–2 split juror votes) are tagged as "Hard Negative / Borderline" samples for targeted fine-tuning.
2. **Automated MLOps Pipeline:**
   - Track model artifacts, datasets, and hyperparameters using MLflow / DVC.
   - Automated regression testing: A new model candidate must outperform the current production champion on the golden benchmark test set before auto-promotion.
3. **On-Chain Model Integrity Registration (zkML / Hash Anchoring):**
   - Register the SHA-256 hash of `dispute_classifier.joblib` and `feature_extractor.joblib` into `ArbitrationHub.sol` or `CaseRegistry.sol` via `anchorModelDigest(bytes32 modelHash, uint256 version)`.
   - Frontend and Proof Verifier can verify that the AI advisory shown for a case was produced by a verified, tamper-evident model version.

**Success Metrics:**
* Zero-touch retraining pipeline with automated benchmark gates.
* On-chain model hash verification visible in `/proof-verifier`.
* Retrained model performance gains verified on post-launch real dispute distribution.

---

## 4. Summary Implementation Matrix

| Milestone | Target Horizon | Core Technique | Primary Deliverable | Target Metric |
|---|---|---|---|---|
| **Phase 0 (Current)** | Done (28 Sep 2026) | XGBoost + TF-IDF + VADER | Model artifacts & inference engine | 94.0% Test Acc / 0.928 F1 |
| **Phase 1** | Weeks 1–3 | Synthetic expansion, SMOTE, drift detection | 10k sample dataset + robust edge cases | Macro F1 $\ge 0.93$ across all domains |
| **Phase 2** | Weeks 4–6 | BGE embeddings + TreeSHAP explainability | Real-time juror reasoning waterfall | Latency $\le 85\text{ms}$, 100% XAI coverage |
| **Phase 3** | Weeks 7–10 | LayoutLM/OCR + QLoRA Llama 3.1 + Calibration | Raw document intake + statutory reports | ECE $\le 0.04$, OCR Recall $\ge 96\%$ |
| **Phase 4** | Weeks 11–14 | Active learning + MLflow + On-chain hash | Decentralized data flywheel + model hash anchor | Verifiable on-chain model registry |

---

## 5. Developer Guide: How to Retrain & Evaluate

### Retrain Models:
```bash
cd ai-engine
# 1. (Optional) Generate expanded dataset
python data/generate_dataset.py

# 2. Run feature engineering and model training
python training/train_model.py
```

### Evaluate Champion Model:
```bash
python evaluate_model.py
```

### Test ML Inference:
```python
from ml_predictor import predict_dispute

sample_case = {
    "title": "Unpaid Web Development Milestone",
    "category": "Freelance",
    "claim_amount": 1500,
    "claimant_statement": "Delivered responsive frontend on time with git commits. Client refuses payment.",
    "respondent_statement": "Code had responsive design bugs and missed deadline.",
    "evidence_list": [
        {"title": "Contract.pdf", "type": "contract"},
        {"title": "Git Logs", "type": "official_record"}
    ]
}

result = predict_dispute(sample_case)
print(result)
# Outputs: predicted outcome, confidence probabilities, favored party, and model hash
```
