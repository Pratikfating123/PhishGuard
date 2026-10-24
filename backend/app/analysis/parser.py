"""Email parsing. Never executes attachments or fetches remote content."""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from email import policy
from email.parser import BytesParser, Parser
from email.utils import parseaddr

MAX_EML_BYTES = 5 * 1024 * 1024
URL_RE = re.compile(r"""https?://[^\s<>"'\)\]]+""", re.IGNORECASE)
TAG_RE = re.compile(r"<[^>]+>")


class EmailParseError(ValueError):
    pass


@dataclass
class ParsedEmail:
    sender: str = ""
    reply_to: str = ""
    subject: str = ""
    body_text: str = ""
    headers: dict[str, str] = field(default_factory=dict)
    urls: list[str] = field(default_factory=list)
    attachments: list[dict] = field(default_factory=list)  # metadata only


def extract_urls(text: str) -> list[str]:
    seen, out = set(), []
    for m in URL_RE.findall(text or ""):
        u = m.rstrip(".,;:!?")
        if u not in seen:
            seen.add(u)
            out.append(u)
    return out


def _strip_html(html: str) -> str:
    return re.sub(r"\s+", " ", TAG_RE.sub(" ", html or "")).strip()


def _from_message(msg) -> ParsedEmail:
    body, html_part, attachments = "", "", []
    if msg.is_multipart():
        for part in msg.walk():
            if part.is_multipart():
                continue
            ctype = part.get_content_type()
            disp = part.get_content_disposition()
            if disp == "attachment" or part.get_filename():
                payload = part.get_payload(decode=True) or b""
                attachments.append({"filename": part.get_filename() or "unnamed", "content_type": ctype, "size": len(payload)})
            elif ctype == "text/plain":
                body += part.get_content()
            elif ctype == "text/html":
                html_part += part.get_content()
    else:
        content = msg.get_content()
        if msg.get_content_type() == "text/html":
            html_part = content
        else:
            body = content
    text = body or _strip_html(html_part)
    # URLs are extracted from both text and raw HTML (href targets), never fetched.
    hrefs = re.findall(r'href=["\']([^"\']+)["\']', html_part, flags=re.IGNORECASE)
    urls = extract_urls(text + " " + " ".join(hrefs) + " " + html_part)
    return ParsedEmail(
        sender=parseaddr(str(msg.get("From", "")))[1].lower(),
        reply_to=parseaddr(str(msg.get("Reply-To", "")))[1].lower(),
        subject=str(msg.get("Subject", "")),
        body_text=text.strip(),
        headers={k: str(v) for k, v in msg.items()},
        urls=urls,
        attachments=attachments,
    )


def parse_eml(data: bytes) -> ParsedEmail:
    if not data:
        raise EmailParseError("The file is empty.")
    if len(data) > MAX_EML_BYTES:
        raise EmailParseError("The file is larger than the 5 MB limit.")
    try:
        msg = BytesParser(policy=policy.default).parsebytes(data)
    except Exception as exc:  # noqa: BLE001
        raise EmailParseError("The file is not a readable email message.") from exc
    if not msg.keys():
        raise EmailParseError("No email headers were found. Upload a valid .eml file.")
    return _from_message(msg)


def parse_pasted(sender: str, subject: str, body: str, reply_to: str = "", raw_headers: str = "") -> ParsedEmail:
    headers: dict[str, str] = {}
    if raw_headers.strip():
        try:
            msg = Parser(policy=policy.default).parsestr(raw_headers + "\n\n")
            headers = {k: str(v) for k, v in msg.items()}
        except Exception as exc:  # noqa: BLE001
            raise EmailParseError("The raw headers could not be read.") from exc
    return ParsedEmail(
        sender=parseaddr(sender)[1].lower(),
        reply_to=parseaddr(reply_to)[1].lower(),
        subject=subject.strip(),
        body_text=body.strip(),
        headers=headers,
        urls=extract_urls(body),
    )
