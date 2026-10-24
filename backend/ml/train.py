"""Train the baseline phishing classifier.

Usage:
    python -m ml.train --data data/emails.csv --text-col text --label-col label

The CSV must be a real, properly labeled dataset (label 1 = phishing, 0 = legitimate).
The script removes exact duplicates before splitting (to prevent train/test leakage),
selects the decision threshold on a validation split, and reports metrics on a
held-out test split. Nothing here claims production accuracy: report the numbers
it prints in your evaluation write-up.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import confusion_matrix, precision_recall_fscore_support
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline

OUT = Path(__file__).parent / "artifacts"


def train(df: pd.DataFrame, text_col: str, label_col: str, dataset_name: str, seed: int = 42) -> dict:
    df = df[[text_col, label_col]].dropna().rename(columns={text_col: "text", label_col: "label"})
    df["label"] = df["label"].astype(int)
    n_raw = len(df)
    df["norm"] = df["text"].str.lower().str.replace(r"\s+", " ", regex=True).str.strip()
    df = df.drop_duplicates(subset="norm")
    n_dedup = len(df)
    if df["label"].nunique() != 2 or df["label"].value_counts().min() < 20:
        raise SystemExit("Need at least 20 examples of each class after de-duplication.")

    x_tmp, x_test, y_tmp, y_test = train_test_split(df["text"], df["label"], test_size=0.2, stratify=df["label"], random_state=seed)
    x_train, x_val, y_train, y_val = train_test_split(x_tmp, y_tmp, test_size=0.25, stratify=y_tmp, random_state=seed)

    pipe = Pipeline([
        ("tfidf", TfidfVectorizer(lowercase=True, ngram_range=(1, 2), min_df=2, max_features=50000, sublinear_tf=True)),
        ("clf", LogisticRegression(max_iter=1000, class_weight="balanced")),
    ])
    pipe.fit(x_train, y_train)

    # Threshold chosen on validation data only, maximizing F1.
    val_p = pipe.predict_proba(x_val)[:, 1]
    grid = np.linspace(0.1, 0.9, 81)
    f1s = [precision_recall_fscore_support(y_val, val_p >= t, average="binary", zero_division=0)[2] for t in grid]
    threshold = float(grid[int(np.argmax(f1s))])

    test_p = pipe.predict_proba(x_test)[:, 1]
    pred = test_p >= threshold
    prec, rec, f1, _ = precision_recall_fscore_support(y_test, pred, average="binary", zero_division=0)
    tn, fp, fn, tp = confusion_matrix(y_test, pred, labels=[0, 1]).ravel()

    meta = {
        "model_version": datetime.now(timezone.utc).strftime("lr-tfidf-%Y%m%d%H%M"),
        "dataset": dataset_name,
        "dataset_sha256": hashlib.sha256(pd.util.hash_pandas_object(df["norm"]).values.tobytes()).hexdigest()[:16],
        "rows_raw": n_raw, "rows_after_dedup": n_dedup,
        "split": {"train": len(x_train), "validation": len(x_val), "test": len(x_test)},
        "test_class_counts": {"legitimate": int((y_test == 0).sum()), "phishing": int((y_test == 1).sum())},
        "threshold": threshold,
        "test_metrics": {"precision": prec, "recall": rec, "f1": f1,
                         "confusion_matrix": {"tn": int(tn), "fp": int(fp), "fn": int(fn), "tp": int(tp)}},
    }
    return {"pipeline": pipe, "meta": meta}


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", required=True)
    ap.add_argument("--text-col", default="text")
    ap.add_argument("--label-col", default="label")
    ap.add_argument("--out", default=str(OUT))
    a = ap.parse_args()
    result = train(pd.read_csv(a.data), a.text_col, a.label_col, Path(a.data).name)
    out = Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    joblib.dump(result["pipeline"], out / "model.joblib")
    (out / "metadata.json").write_text(json.dumps(result["meta"], indent=2))
    print(json.dumps(result["meta"], indent=2))


if __name__ == "__main__":
    main()
