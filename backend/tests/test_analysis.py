"""Analysis pipeline tests. Run with: pytest tests/test_analysis.py

The tiny model below is a wiring fixture only. It says nothing about real accuracy.
"""
import pandas as pd
import pytest

from app.analysis.engine import analyze, categorize
from app.analysis.headers import analyze_sender
from app.analysis.parser import EmailParseError, parse_eml, parse_pasted
from app.analysis.text_model import TextModel
from app.analysis.urls import analyze_url
from ml.train import train

EML = b"""From: Support <support@secure-acc0unt-verify.com>
Reply-To: attacker@evil.example
Subject: Urgent: verify your account
Authentication-Results: mx.example; spf=fail; dkim=pass
Content-Type: text/plain

Please log in immediately at http://secure-acc0unt-verify.com/login to keep access.
"""


class FakeModel(TextModel):
    def __init__(self, label="phishing", score=0.9):
        self.pipeline, self.meta = None, {}
        self._out = {"phishing_score": score, "label": label, "model_version": "fake"}

    @property
    def available(self):
        return self._out is not None

    def predict(self, text):
        return self._out


class NoModel(TextModel):
    def __init__(self):
        self.pipeline, self.meta = None, {}


def test_parse_eml_extracts_fields_and_urls():
    p = parse_eml(EML)
    assert p.sender == "support@secure-acc0unt-verify.com"
    assert p.reply_to == "attacker@evil.example"
    assert "http://secure-acc0unt-verify.com/login" in p.urls


def test_parse_eml_rejects_garbage():
    with pytest.raises(EmailParseError):
        parse_eml(b"")
    with pytest.raises(EmailParseError):
        parse_eml(b"just some bytes without headers")


def test_url_flags_ip_and_http():
    r = analyze_url("http://192.168.4.4/login")
    codes = {f["code"] for f in r["flags"]}
    assert {"ip_host", "no_https"} <= codes
    assert r["risk"] in {"medium", "high"}


def test_url_plain_https_is_low():
    assert analyze_url("https://example.org/about")["risk"] == "low"


def test_sender_reply_to_mismatch_and_spf_fail():
    codes = {i["code"] for i in analyze_sender("a@x.com", "b@y.com", {"Authentication-Results": "spf=fail"})}
    assert {"reply_to_mismatch", "spf_fail"} <= codes


def test_missing_auth_header_is_not_treated_as_failure():
    ind = analyze_sender("a@x.com", "", {})
    assert [i["weight"] for i in ind if i["code"] == "no_auth_results"] == [0]


def test_no_model_and_no_evidence_is_inconclusive_not_safe():
    assert categorize(None, 0) == "inconclusive"


def test_phishing_with_evidence_is_high_risk():
    assert categorize({"label": "phishing"}, 3) == "high_risk"


def test_end_to_end_with_fake_model():
    out = analyze(parse_eml(EML), FakeModel())
    assert out["risk_category"] == "high_risk"
    assert out["urls"] and out["indicators"]
    assert 0 <= out["risk_score"] <= 100


def test_end_to_end_without_model_still_uses_heuristics():
    out = analyze(parse_eml(EML), NoModel())
    assert out["model"]["available"] is False
    assert out["risk_category"] in {"suspicious", "high_risk"}


def test_training_script_reports_split_and_dedups():
    phish = [f"urgent verify your password account suspended click now variant {i}" for i in range(60)]
    legit = [f"meeting notes agenda for project review schedule item {i}" for i in range(60)]
    df = pd.DataFrame({"text": phish + legit + phish[:10], "label": [1] * 60 + [0] * 60 + [1] * 10})
    res = train(df, "text", "label", "fixture.csv")
    m = res["meta"]
    assert m["rows_raw"] == 130 and m["rows_after_dedup"] == 120
    assert sum(m["split"].values()) == 120
    assert "confusion_matrix" in m["test_metrics"]
