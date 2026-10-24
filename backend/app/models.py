from datetime import datetime, timezone

from sqlalchemy import JSON, Boolean, DateTime, Float, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base


def now():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    full_name: Mapped[str] = mapped_column(String(120), default="")
    role: Mapped[str] = mapped_column(String(20), default="user")  # user | admin
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class EmailRecord(Base):
    __tablename__ = "email_records"
    id: Mapped[int] = mapped_column(primary_key=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    sender: Mapped[str] = mapped_column(String(320), default="")
    reply_to: Mapped[str] = mapped_column(String(320), default="")
    subject: Mapped[str] = mapped_column(String(998), default="")
    body_text: Mapped[str] = mapped_column(Text, default="")
    headers: Mapped[dict] = mapped_column(JSON, default=dict)
    attachments: Mapped[list] = mapped_column(JSON, default=list)  # metadata only
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    is_quarantined: Mapped[bool] = mapped_column(Boolean, default=False)
    received_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    analyses: Mapped[list["EmailAnalysis"]] = relationship(back_populates="email", order_by="EmailAnalysis.id.desc()")
    __table_args__ = (Index("ix_email_owner_received", "owner_id", "received_at"),)


class EmailAnalysis(Base):
    __tablename__ = "email_analyses"
    id: Mapped[int] = mapped_column(primary_key=True)
    email_id: Mapped[int] = mapped_column(ForeignKey("email_records.id"), index=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    risk_category: Mapped[str] = mapped_column(String(20), index=True)
    risk_score: Mapped[float] = mapped_column(Float)
    classification: Mapped[str] = mapped_column(String(20), default="unavailable")
    model_version: Mapped[str] = mapped_column(String(64), default="none")
    evidence: Mapped[dict] = mapped_column(JSON, default=dict)  # indicators, steps, summary
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now, index=True)
    email: Mapped[EmailRecord] = relationship(back_populates="analyses")
    urls: Mapped[list["URLIndicator"]] = relationship(cascade="all, delete-orphan")


class URLIndicator(Base):
    __tablename__ = "url_indicators"
    id: Mapped[int] = mapped_column(primary_key=True)
    analysis_id: Mapped[int] = mapped_column(ForeignKey("email_analyses.id"), index=True)
    url: Mapped[str] = mapped_column(Text)
    host: Mapped[str] = mapped_column(String(255), default="")
    risk: Mapped[str] = mapped_column(String(12))
    flags: Mapped[list] = mapped_column(JSON, default=list)


class ThreatEvent(Base):
    __tablename__ = "threat_events"
    id: Mapped[int] = mapped_column(primary_key=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    analysis_id: Mapped[int] = mapped_column(ForeignKey("email_analyses.id"))
    threat_type: Mapped[str] = mapped_column(String(40))
    risk_category: Mapped[str] = mapped_column(String(20))
    review_status: Mapped[str] = mapped_column(String(20), default="open")
    detected_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now, index=True)


class QuarantineRecord(Base):
    __tablename__ = "quarantine_records"
    id: Mapped[int] = mapped_column(primary_key=True)
    email_id: Mapped[int] = mapped_column(ForeignKey("email_records.id"), index=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    reason: Mapped[str] = mapped_column(String(255))
    status: Mapped[str] = mapped_column(String(20), default="held")  # held | released
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    released_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    released_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class AuditLog(Base):
    """Application code only ever inserts into this table."""
    __tablename__ = "audit_logs"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True, index=True)
    action: Mapped[str] = mapped_column(String(60), index=True)
    target: Mapped[str] = mapped_column(String(120), default="")
    result: Mapped[str] = mapped_column(String(20), default="success")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now, index=True)


class IntegrationConfiguration(Base):
    __tablename__ = "integration_configurations"
    id: Mapped[int] = mapped_column(primary_key=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    provider: Mapped[str] = mapped_column(String(30))  # gmail | microsoft365
    enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    # OAuth tokens belong in an encrypted secret store, never returned to the frontend.
