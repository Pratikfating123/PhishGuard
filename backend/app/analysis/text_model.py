"""TF-IDF + Logistic Regression text classifier wrapper.

If no trained model file exists, `predict` returns None and the engine reports
an inconclusive verdict. It never silently labels mail safe.
"""
from __future__ import annotations

import json
from pathlib import Path

import joblib

MODEL_DIR = Path(__file__).resolve().parents[2] / "ml" / "artifacts"


class TextModel:
    def __init__(self, model_dir: Path = MODEL_DIR):
        self.model_dir = Path(model_dir)
        self.pipeline = None
        self.meta: dict = {}
        self._load()

    def _load(self) -> None:
        path = self.model_dir / "model.joblib"
        if path.exists():
            self.pipeline = joblib.load(path)
            meta_path = self.model_dir / "metadata.json"
            self.meta = json.loads(meta_path.read_text()) if meta_path.exists() else {}

    @property
    def available(self) -> bool:
        return self.pipeline is not None

    @property
    def version(self) -> str:
        return self.meta.get("model_version", "none")

    @property
    def threshold(self) -> float:
        return float(self.meta.get("threshold", 0.5))

    def predict(self, text: str) -> dict | None:
        if not self.available:
            return None
        p = float(self.pipeline.predict_proba([text])[0][1])
        return {"phishing_score": p, "label": "phishing" if p >= self.threshold else "legitimate", "model_version": self.version}
