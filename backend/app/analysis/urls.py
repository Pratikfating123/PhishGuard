"""URL feature extraction. Parses strings only; never resolves or visits a URL."""
from __future__ import annotations

import ipaddress
import re
from urllib.parse import urlparse

SHORTENERS = {"bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly", "is.gd", "buff.ly", "rebrand.ly", "cutt.ly"}
SUSPICIOUS_TLDS = {"zip", "mov", "top", "xyz", "click", "country", "gq", "tk", "ml", "cf", "work", "support"}
BRAND_WORDS = ("paypal", "microsoft", "office365", "apple", "google", "amazon", "netflix", "bank", "secure", "verify", "login", "account")


def analyze_url(url: str) -> dict:
    """Return observed facts (`facts`) and heuristic warnings (`flags`) for one URL."""
    flags: list[dict] = []
    facts: dict = {}
    try:
        p = urlparse(url)
        host = (p.hostname or "").lower()
    except ValueError:
        return {"url": url, "host": "", "risk": "inconclusive", "facts": {}, "flags": [
            {"code": "unparseable", "kind": "observed", "text": "The URL could not be parsed."}]}

    facts.update(scheme=p.scheme, host=host, path_length=len(p.path), has_userinfo=bool(p.username))
    score = 0

    def flag(code, text, weight, kind="heuristic"):
        nonlocal score
        flags.append({"code": code, "kind": kind, "text": text})
        score += weight

    try:
        ipaddress.ip_address(host)
        flag("ip_host", "The link uses a raw IP address instead of a domain name.", 3, "observed")
    except ValueError:
        pass
    if p.scheme == "http":
        flag("no_https", "The link does not use HTTPS.", 1, "observed")
    if p.username:
        flag("userinfo", "The link contains credentials before the host, a common disguise.", 3, "observed")
    if host in SHORTENERS:
        flag("shortener", "A link shortener hides the real destination.", 2, "observed")
    if host.startswith("xn--") or ".xn--" in host:
        flag("punycode", "The domain uses punycode, which can imitate other characters.", 2, "observed")
    labels = host.split(".") if host else []
    if len(labels) > 4:
        flag("many_subdomains", "The hostname has an unusually deep subdomain structure.", 1)
    if labels and labels[-1] in SUSPICIOUS_TLDS:
        flag("suspicious_tld", f"The top-level domain .{labels[-1]} is often abused.", 1)
    if re.search(r"[a-z][0-9][a-z]|[0-9][a-z][0-9]", labels[-2] if len(labels) >= 2 else ""):
        flag("digit_swap", "The domain mixes digits into words, like a look-alike spelling.", 2)
    if host.count("-") >= 3:
        flag("many_hyphens", "The hostname contains many hyphens.", 1)
    if any(w in host for w in BRAND_WORDS) and len(labels) >= 3:
        flag("brand_subdomain", "Sensitive words appear inside a longer hostname.", 1)
    if len(url) > 120:
        flag("long_url", "The URL is unusually long.", 1)

    risk = "high" if score >= 4 else "medium" if score >= 2 else "low"
    return {"url": url, "host": host, "risk": risk, "score": score, "facts": facts, "flags": flags}


def analyze_urls(urls: list[str]) -> list[dict]:
    return [analyze_url(u) for u in urls[:50]]
