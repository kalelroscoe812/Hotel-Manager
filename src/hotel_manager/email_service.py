import logging
import os
from typing import Any
import resend

logger = logging.getLogger(__name__)

RESEND_API_KEY = os.getenv("RESEND_API_KEY", "").strip()
RESEND_FROM_EMAIL = os.getenv(
    "RESEND_FROM_EMAIL", "Hotel Manager <onboarding@resend.dev>"
).strip()

if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY


def is_resend_configured() -> bool:
    """Return True if a Resend API key is configured."""
    return bool(os.getenv("RESEND_API_KEY", "").strip())


def send_email(
    to_email: str,
    subject: str,
    html_content: str,
    text_content: str | None = None,
) -> dict[str, Any]:
    """Send an email using Resend, or simulate delivery if no API key is configured."""
    api_key = os.getenv("RESEND_API_KEY", "").strip()

    if not api_key:
        logger.info(
            "[Resend Email Service] Simulation mode (no RESEND_API_KEY set). Target: %s, Subject: '%s'",
            to_email,
            subject,
        )
        return {
            "status": "simulated",
            "to": to_email,
            "subject": subject,
            "message": "Email logged and simulated. Configure RESEND_API_KEY for live delivery.",
        }

    try:
        resend.api_key = api_key
        params = {
            "from": RESEND_FROM_EMAIL,
            "to": [to_email],
            "subject": subject,
            "html": html_content,
        }
        if text_content:
            params["text"] = text_content

        result = resend.Emails.send(params)
        logger.info("[Resend Email Service] Successfully sent email to %s (ID: %s)", to_email, result.get("id"))
        return {
            "status": "sent",
            "id": result.get("id"),
            "to": to_email,
            "subject": subject,
            "message": "Email successfully delivered via Resend API",
        }
    except Exception as exc:
        logger.error("[Resend Email Service] Failed to send email to %s: %s", to_email, exc)
        return {
            "status": "error",
            "to": to_email,
            "subject": subject,
            "error": str(exc),
        }


def send_welcome_email(
    to_email: str,
    username: str,
    role: str,
    hotel_name: str | None = None,
) -> dict[str, Any]:
    """Send an onboarding welcome email upon user registration or email connection."""
    subject = f"Welcome to Hotel Manager, @{username}!"
    property_info = f"<p><strong>Assigned Property:</strong> {hotel_name}</p>" if hotel_name else ""
    html_content = f"""
    <div style="font-family: Arial, sans-serif; background-color: #020617; color: #f8fafc; padding: 32px; border-radius: 12px; max-width: 580px; margin: 0 auto; border: 1px solid #1e293b;">
        <div style="display: flex; align-items: center; margin-bottom: 20px;">
            <div style="background-color: #f59e0b; color: #020617; font-weight: 800; padding: 8px 14px; border-radius: 8px; font-size: 16px; margin-right: 12px;">
                HM
            </div>
            <h2 style="color: #ffffff; margin: 0; font-size: 20px;">Hotel Manager Portal</h2>
        </div>
        <p style="font-size: 15px; color: #cbd5e1; line-height: 1.6;">
            Hello <strong>@{username}</strong>,
        </p>
        <p style="font-size: 14px; color: #94a3b8; line-height: 1.6;">
            Your account has been connected to <strong>Hotel Manager</strong>. You can now access your designated role portal with authenticated credentials.
        </p>
        <div style="background-color: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 16px; margin: 24px 0;">
            <p style="margin: 4px 0; font-size: 13px; color: #e2e8f0;"><strong>Username:</strong> {username}</p>
            <p style="margin: 4px 0; font-size: 13px; color: #e2e8f0;"><strong>Role:</strong> <span style="color: #f59e0b; font-weight: bold;">{role}</span></p>
            {property_info}
            <p style="margin: 4px 0; font-size: 13px; color: #e2e8f0;"><strong>Connected Email:</strong> {to_email}</p>
        </div>
        <p style="font-size: 12px; color: #64748b;">
            This email was sent via the Resend API integration for Hotel Manager.
        </p>
    </div>
    """
    return send_email(to_email=to_email, subject=subject, html_content=html_content)


def send_test_email(to_email: str, username: str = "User") -> dict[str, Any]:
    """Send a diagnostic test email to verify Resend backend email connectivity."""
    subject = "Hotel Manager - Resend Email Integration Verified"
    html_content = f"""
    <div style="font-family: Arial, sans-serif; background-color: #020617; color: #f8fafc; padding: 28px; border-radius: 12px; max-width: 540px; margin: 0 auto; border: 1px solid #1e293b;">
        <h3 style="color: #10b981; margin-top: 0;">✓ Resend Email Service Connected</h3>
        <p style="font-size: 14px; color: #cbd5e1; line-height: 1.5;">
            Hi @{username}, your email address <strong>{to_email}</strong> is successfully connected to the Hotel Manager backend via Resend.
        </p>
        <p style="font-size: 12px; color: #64748b; margin-top: 20px;">
            Service: Resend API • Status: Active
        </p>
    </div>
    """
    return send_email(to_email=to_email, subject=subject, html_content=html_content)
