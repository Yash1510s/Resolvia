"""
Resolvia — Feature Engineering Pipeline
=========================================
Extracts multi-modal NLP and structured features from dispute records.

Feature components:
  1. Textual TF-IDF representations (Claimant & Respondent statements)
  2. Cosine semantic divergence between claimant and respondent statements
  3. VADER sentiment polarity scores and sentiment gap
  4. Specificity & credibility metrics (dates, numbers, monetary patterns)
  5. Contradiction & concession keyword signals
  6. Evidence metadata signals (contract, receipt, logs, official records)
  7. Dispute categorization (One-Hot Encoded across 8 universal categories)
  8. Monetary scale features (log1p transformed)
"""

import re
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from nltk.sentiment.vader import SentimentIntensityAnalyzer

# ─── Constants ────────────────────────────────────────────────────────────────
CATEGORIES = [
    "Academic",
    "Community",
    "Consumer",
    "Digital",
    "Freelance",
    "Personal",
    "Property",
    "Workplace",
]

EVIDENCE_COLUMNS = [
    "has_written_agreement",
    "has_communication_proof",
    "has_visual_proof",
    "has_witness",
    "has_official_record",
    "has_timeline_proof",
]

OUTCOME_MAP = {
    "Claimant Justified": 0,
    "Respondent Justified": 1,
    "Compromise": 2,
}

REVERSE_OUTCOME_MAP = {v: k for k, v in OUTCOME_MAP.items()}

# Keywords signaling strong dispute/denial vs concession/admission
DENIAL_KEYWORDS = [
    "never", "false", "denied", "deny", "untrue", "fake", "refused",
    "refuse", "failed", "breach", "violat", "stole", "damage", "scam"
]

CONCESSION_KEYWORDS = [
    "admitted", "accept", "agreed", "agree", "apologized", "apology",
    "partial", "refund", "willing", "compromise", "repair", "replace"
]

SPECIFICITY_REGEX = re.compile(r"\b(\d+(\.\d+)?|\d{1,2}(st|nd|rd|th)?|rs|inr|\$|percent|%)\b", re.IGNORECASE)


class DisputeFeatureExtractor:
    """
    Transforms raw dispute records into a unified numeric feature vector
    ready for Scikit-Learn and XGBoost classifiers.
    """

    def __init__(self, max_tfidf_features=40):
        self.max_tfidf_features = max_tfidf_features
        self.tfidf_claimant = TfidfVectorizer(
            max_features=max_tfidf_features,
            ngram_range=(1, 2),
            stop_words="english",
            sublinear_tf=True,
        )
        self.tfidf_respondent = TfidfVectorizer(
            max_features=max_tfidf_features,
            ngram_range=(1, 2),
            stop_words="english",
            sublinear_tf=True,
        )
        self.sia = SentimentIntensityAnalyzer()
        self.feature_names_ = []
        self.is_fitted_ = False

    def _ensure_df(self, data):
        """Converts dict or list of dicts to DataFrame."""
        if isinstance(data, dict):
            return pd.DataFrame([data])
        if isinstance(data, list):
            return pd.DataFrame(data)
        return data.copy()

    def _extract_text_signals(self, text):
        """Calculates word count, specificity count, denial and concession scores."""
        text_str = str(text or "")
        words = text_str.lower().split()
        word_count = len(words)
        char_count = len(text_str)

        # Specificity: count numeric values, dates, percentages
        specificity = len(SPECIFICITY_REGEX.findall(text_str))

        # Denial and Concession keyword frequencies
        denial_count = sum(1 for kw in DENIAL_KEYWORDS if kw in text_str.lower())
        concession_count = sum(1 for kw in CONCESSION_KEYWORDS if kw in text_str.lower())

        return [word_count, char_count, specificity, denial_count, concession_count]

    def fit(self, data, y=None):
        """Fits the TF-IDF vectorizers on claimant and respondent statements."""
        df = self._ensure_df(data)

        claimant_texts = df["claimant_statement"].fillna("").astype(str)
        respondent_texts = df["respondent_statement"].fillna("").astype(str)

        self.tfidf_claimant.fit(claimant_texts)
        self.tfidf_respondent.fit(respondent_texts)

        # Build feature names
        feature_names = []

        # 1. TF-IDF features
        for feat in self.tfidf_claimant.get_feature_names_out():
            feature_names.append(f"claimant_tfidf_{feat}")
        for feat in self.tfidf_respondent.get_feature_names_out():
            feature_names.append(f"respondent_tfidf_{feat}")

        # 2. Cosine similarity
        feature_names.append("statement_cosine_similarity")

        # 3. Sentiment features
        for prefix in ["claimant", "respondent"]:
            for sent_metric in ["neg", "neu", "pos", "compound"]:
                feature_names.append(f"{prefix}_sentiment_{sent_metric}")
        feature_names.append("sentiment_gap_compound")

        # 4. Text structural signals
        for prefix in ["claimant", "respondent"]:
            feature_names.extend([
                f"{prefix}_word_count",
                f"{prefix}_char_count",
                f"{prefix}_specificity_count",
                f"{prefix}_denial_count",
                f"{prefix}_concession_count",
            ])
        feature_names.append("word_count_ratio")

        # 5. Evidence flags and metadata
        for col in EVIDENCE_COLUMNS:
            feature_names.append(col)
        feature_names.extend(["evidence_count", "total_evidence_signals"])

        # 6. Monetary features
        feature_names.extend(["is_monetary", "log_amount_disputed"])

        # 7. Category one-hot features
        for cat in CATEGORIES:
            feature_names.append(f"cat_{cat}")

        self.feature_names_ = feature_names
        self.is_fitted_ = True
        return self

    def transform(self, data):
        """Transforms dispute records into a 2D NumPy feature matrix."""
        if not self.is_fitted_:
            raise ValueError("DisputeFeatureExtractor must be fitted before transform.")

        df = self._ensure_df(data)
        n_samples = len(df)

        # 1. TF-IDF matrices
        claimant_texts = df["claimant_statement"].fillna("").astype(str)
        respondent_texts = df["respondent_statement"].fillna("").astype(str)

        X_claimant_tfidf = self.tfidf_claimant.transform(claimant_texts).toarray()
        X_respondent_tfidf = self.tfidf_respondent.transform(respondent_texts).toarray()

        # 2. Pairwise Cosine Similarity row-by-row
        cosine_sims = np.zeros((n_samples, 1))
        for i in range(n_samples):
            v1 = X_claimant_tfidf[i].reshape(1, -1)
            v2 = X_respondent_tfidf[i].reshape(1, -1)
            norm1 = np.linalg.norm(v1)
            norm2 = np.linalg.norm(v2)
            if norm1 > 0 and norm2 > 0:
                cosine_sims[i, 0] = cosine_similarity(v1, v2)[0, 0]
            else:
                cosine_sims[i, 0] = 0.0

        # 3. Sentiment analysis
        sentiments = np.zeros((n_samples, 9))
        for i in range(n_samples):
            c_scores = self.sia.polarity_scores(claimant_texts.iloc[i])
            r_scores = self.sia.polarity_scores(respondent_texts.iloc[i])
            sentiments[i, 0] = c_scores["neg"]
            sentiments[i, 1] = c_scores["neu"]
            sentiments[i, 2] = c_scores["pos"]
            sentiments[i, 3] = c_scores["compound"]
            sentiments[i, 4] = r_scores["neg"]
            sentiments[i, 5] = r_scores["neu"]
            sentiments[i, 6] = r_scores["pos"]
            sentiments[i, 7] = r_scores["compound"]
            sentiments[i, 8] = c_scores["compound"] - r_scores["compound"]

        # 4. Text structural signals
        text_signals = np.zeros((n_samples, 11))
        for i in range(n_samples):
            c_sig = self._extract_text_signals(claimant_texts.iloc[i])
            r_sig = self._extract_text_signals(respondent_texts.iloc[i])
            ratio = (c_sig[0] + 1.0) / (r_sig[0] + 1.0)
            text_signals[i, :5] = c_sig
            text_signals[i, 5:10] = r_sig
            text_signals[i, 10] = ratio

        # 5. Evidence metadata
        evidence_matrix = np.zeros((n_samples, len(EVIDENCE_COLUMNS) + 2))
        for j, col in enumerate(EVIDENCE_COLUMNS):
            if col in df.columns:
                evidence_matrix[:, j] = df[col].astype(bool).astype(float).values
        if "evidence_count" in df.columns:
            evidence_matrix[:, len(EVIDENCE_COLUMNS)] = df["evidence_count"].fillna(0).astype(float).values
        # Sum of evidence signals
        evidence_matrix[:, len(EVIDENCE_COLUMNS) + 1] = np.sum(evidence_matrix[:, :len(EVIDENCE_COLUMNS)], axis=1)

        # 6. Monetary features
        monetary_matrix = np.zeros((n_samples, 2))
        if "is_monetary" in df.columns:
            monetary_matrix[:, 0] = df["is_monetary"].astype(bool).astype(float).values
        amt_col = "dispute_amount" if "dispute_amount" in df.columns else "amount_disputed"
        if amt_col in df.columns:
            amounts = df[amt_col].fillna(0.0).astype(float).values
            monetary_matrix[:, 1] = np.log1p(np.maximum(0.0, amounts))

        # 7. Category One-Hot Encoding
        category_matrix = np.zeros((n_samples, len(CATEGORIES)))
        if "category" in df.columns:
            for j, cat in enumerate(CATEGORIES):
                category_matrix[:, j] = (df["category"] == cat).astype(float).values

        # Concatenate all blocks horizontally
        X_all = np.hstack([
            X_claimant_tfidf,
            X_respondent_tfidf,
            cosine_sims,
            sentiments,
            text_signals,
            evidence_matrix,
            monetary_matrix,
            category_matrix,
        ])

        return X_all.astype(np.float32)

    def fit_transform(self, data, y=None):
        """Fit and transform in a single call."""
        return self.fit(data).transform(data)

    def get_feature_names(self):
        """Returns list of all feature names for interpretability."""
        return self.feature_names_


def load_dataset(csv_path):
    """Loads dispute dataset CSV and extracts X features and y target."""
    df = pd.read_csv(csv_path)
    y = None
    if "outcome" in df.columns:
        y = df["outcome"].map(OUTCOME_MAP).values
    return df, y
