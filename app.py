"""
Tilak BV Portfolio — Flask Backend
====================================
Routes:
  GET  /             → renders portfolio homepage
  POST /contact       → handles contact form, sends email via SMTP
  GET  /download-cv   → triggers a direct attachment download for the CV PDF
  GET  /view-cv       → renders the CV PDF directly inline inside a browser tab

Setup:
  pip install flask flask-mail python-dotenv
  Create a .env file containing your secure email configurations
  python app.py
"""

from flask import Flask, render_template, request, jsonify, send_file
from flask_mail import Mail, Message
from dotenv import load_dotenv
import os
import re
import threading
import uuid
import json
import requests as http_requests
from datetime import datetime

# Force load_dotenv to read from the absolute script directory
basedir = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(basedir, '.env'))

app = Flask(__name__)

# ── Persistent Guestbook Store (thread-safe) ───────────────────────────────
_store_lock = threading.Lock()
GUESTBOOK_FILE = os.path.join(basedir, "guestbook.json")

def load_guestbook():
    try:
        with open(GUESTBOOK_FILE, "r") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return []

def save_guestbook(msgs):
    with open(GUESTBOOK_FILE, "w") as f:
        json.dump(msgs, f, indent=2)

_guestbook_messages = load_guestbook()

# ── Mail config (reads securely from .env) ──────────────────────────────
app.config["MAIL_SERVER"] = os.getenv("MAIL_SERVER", "smtp.gmail.com")
app.config["MAIL_PORT"] = int(os.getenv("MAIL_PORT", 587))
app.config["MAIL_USE_TLS"] = os.getenv("MAIL_USE_TLS", "true").lower() == "true"
app.config["MAIL_USE_SSL"] = os.getenv("MAIL_USE_SSL", "false").lower() == "true"
app.config["MAIL_USERNAME"] = os.getenv("MAIL_USERNAME", "")   # Your Gmail address
app.config["MAIL_PASSWORD"] = os.getenv("MAIL_PASSWORD", "")   # Your Google App Password
app.config["MAIL_DEFAULT_SENDER"] = os.getenv("MAIL_USERNAME", "")
app.config["MAIL_TIMEOUT"] = 15  # seconds — prevents hanging on Render free tier
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "tilakbv-portfolio-secret")
app.config["BREVO_API_KEY"] = os.getenv("BREVO_API_KEY", "")

mail = Mail(app)

OWNER_EMAIL = "tilakatilakachary@gmail.com"


def send_email_via_brevo(to_email, to_name, subject, html_content, reply_to=None):
    """Send transactional email via Brevo HTTP API (no SMTP — works on Render free tier)."""
    api_key = app.config.get("BREVO_API_KEY", "")
    if not api_key:
        raise ValueError("BREVO_API_KEY is not configured in environment variables.")

    payload = {
        "sender": {"name": "Tilak BV Portfolio", "email": OWNER_EMAIL},
        "to": [{"email": to_email, "name": to_name}],
        "subject": subject,
        "htmlContent": html_content,
    }
    if reply_to:
        payload["replyTo"] = {"email": reply_to}

    resp = http_requests.post(
        "https://api.brevo.com/v3/smtp/email",
        json=payload,
        headers={
            "api-key": api_key,
            "content-type": "application/json",
            "accept": "application/json",
        },
        timeout=30,
    )
    resp.raise_for_status()
    return resp

# ── Helper ──────────────────────────────────────────────────────────────
def is_valid_email(email: str) -> bool:
    return bool(re.match(r"^[^\s@]+@[^\s@]+\.[^\s@]+$", email))

# ── Routes ──────────────────────────────────────────────────────────────

@app.route("/")
def index():
    return render_template("index.html")

@app.route('/blogs') # This is the URL path
def blogs():         # This is the endpoint name
    return render_template('blogs.html')

@app.route("/contact", methods=["POST"])
def contact():
    """
    Accepts JSON: { name, email, subject, message }
    Returns JSON status block along with clean error message feedback tracking.
    """
    data = request.get_json(silent=True) or {}

    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip()
    subject = (data.get("subject") or "").strip()
    body = (data.get("message") or "").strip()

    # ── Server Side Validation ──
    errors = {}
    if not name:
        errors["name"] = "Name is required."
    if not is_valid_email(email):
        errors["email"] = "Valid email is required."
    if not subject:
        errors["subject"] = "Subject is required."
    if not body:
        errors["message"] = "Message is required."

    if errors:
        return jsonify({"success": False, "errors": errors}), 400

    # Ensure environment configs exist before triggering active mail contexts
    if not app.config.get("BREVO_API_KEY"):
        app.logger.error("BREVO_API_KEY is missing inside your .env configuration.")
        return jsonify({
            "success": False,
            "message": "Server configuration missing. Please reach out directly to tilakatilakachary@gmail.com.",
            "errors": {}
        }), 500

    # ── Send emails via Brevo HTTP API in a background thread ──────────────
    sent_at = datetime.now().strftime('%d %b %Y, %I:%M %p')

    owner_html = f"""
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#0f1117;color:#fff;border-radius:12px;">
  <div style="border-bottom:2px solid #2ecc8f;padding-bottom:16px;margin-bottom:24px;">
    <h2 style="color:#2ecc8f;margin:0;">&#128236; New Portfolio Message</h2>
  </div>
  <table style="width:100%;border-collapse:collapse;">
    <tr><td style="padding:8px 0;color:#aaa;width:80px;">Name</td><td style="padding:8px 0;font-weight:bold;">{name}</td></tr>
    <tr><td style="padding:8px 0;color:#aaa;">Email</td><td style="padding:8px 0;"><a href="mailto:{email}" style="color:#2ecc8f;">{email}</a></td></tr>
    <tr><td style="padding:8px 0;color:#aaa;">Subject</td><td style="padding:8px 0;">{subject}</td></tr>
    <tr><td style="padding:8px 0;color:#aaa;">Date</td><td style="padding:8px 0;">{sent_at}</td></tr>
  </table>
  <div style="background:#1a1d27;border-radius:8px;padding:16px;margin-top:20px;">
    <p style="color:#aaa;margin:0 0 8px;font-size:12px;">MESSAGE</p>
    <p style="margin:0;line-height:1.7;">{body}</p>
  </div>
  <p style="margin-top:20px;font-size:12px;color:#555;">Sent via <strong style="color:#2ecc8f;">Tilak BV Portfolio</strong></p>
</div>
"""

    reply_html = f"""
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#0f1117;color:#fff;border-radius:12px;">
  <h2 style="color:#2ecc8f;">Thanks for reaching out, {name}! &#128075;</h2>
  <p style="color:#ccc;line-height:1.7;">I've received your message and will get back to you as soon as possible — usually within 24 hours.</p>
  <div style="background:#1a1d27;border-radius:8px;padding:16px;margin:20px 0;border-left:3px solid #2ecc8f;">
    <p style="color:#aaa;margin:0 0 6px;font-size:12px;">YOUR MESSAGE</p>
    <p style="margin:0;color:#eee;font-style:italic;">"{body}"</p>
  </div>
  <p style="color:#ccc;">Best regards,<br><strong style="color:#fff;">Tilak BV</strong></p>
  <div style="margin-top:24px;padding-top:16px;border-top:1px solid #222;font-size:12px;color:#555;">
    <a href="https://github.com/Tilak2005-BV" style="color:#2ecc8f;margin-right:16px;">GitHub</a>
    <a href="https://linkedin.com/in/tilakatilaka" style="color:#2ecc8f;">LinkedIn</a>
  </div>
</div>
"""

    def send_emails_background(sender_name, sender_email, sender_subject, sender_body, owner_html_body, reply_html_body):
        try:
            # Email to portfolio owner
            send_email_via_brevo(
                to_email=OWNER_EMAIL,
                to_name="Tilak BV",
                subject=f"[Portfolio] {sender_subject}",
                html_content=owner_html_body,
                reply_to=sender_email,
            )
            # Auto-reply to sender
            send_email_via_brevo(
                to_email=sender_email,
                to_name=sender_name,
                subject="Thanks for reaching out — Tilak BV",
                html_content=reply_html_body,
            )
            app.logger.info(f"Brevo emails sent: owner + auto-reply to {sender_email}")
        except Exception as e:
            app.logger.error(f"Brevo send error: {e}")

    email_thread = threading.Thread(
        target=send_emails_background,
        args=(name, email, subject, body, owner_html, reply_html),
        daemon=True,
    )
    email_thread.start()

    return jsonify({
        "success": True,
        "message": "Message sent! I'll get back to you soon. Check your inbox for a confirmation."
    })


@app.route("/download-cv")
def download_cv():
    """Forces direct attachment download layout for your PDF CV file."""
    path = os.path.join(app.static_folder, "Tilak_BV_CV.pdf")
    try:
        return send_file(path, as_attachment=True, download_name="Tilak_BV_CV.pdf")
    except FileNotFoundError:
        return "CV PDF document file not found inside static directory layout.", 404


@app.route("/view-cv")
def view_cv():
    """Renders the CV file inside the native web browser viewer window without downloading."""
    path = os.path.join(app.static_folder, "Tilak_BV_CV.pdf")
    try:
        return send_file(path, mimetype="application/pdf")
    except FileNotFoundError:
        return "CV PDF file not found inside static directory layout.", 404



# ── Guestbook Routes ────────────────────────────────────────────────────

@app.route("/guestbook", methods=["GET"])
def get_guestbook():
    """Return all guestbook messages (newest first) without delete tokens and emails."""
    with _store_lock:
        safe_messages = [{k: v for k, v in msg.items() if k not in ["delete_token", "email"]} for msg in _guestbook_messages]
        return jsonify({
            "success": True,
            "messages": list(reversed(safe_messages))
        })


@app.route("/guestbook", methods=["POST"])
def post_guestbook():
    """Accept a new guestbook message. Body: { name, message }"""
    global _guestbook_messages
    data = request.get_json(silent=True) or {}

    name    = (data.get("name")    or "").strip()[:40]
    email   = (data.get("email")   or "").strip()
    message = (data.get("message") or "").strip()[:100]
    rating  = data.get("rating", 5)

    try:
        rating = int(rating)
        if rating < 1: rating = 1
        if rating > 5: rating = 5
    except ValueError:
        rating = 5

    if not name or not email or not message:
        return jsonify({"success": False, "error": "Name, email, and message are required."}), 400

    delete_token = str(uuid.uuid4())
    entry = {
        "id":      str(uuid.uuid4()),          # unique ID for frontend
        "delete_token": delete_token,          # hidden token for admin deletion
        "name":    name,
        "email":   email,                      # stored privately
        "message": message,
        "rating":  rating,
        "time":    datetime.now().strftime("%d %b %Y · %I:%M %p")
    }

    with _store_lock:
        _guestbook_messages.append(entry)
        if len(_guestbook_messages) > 100:
            _guestbook_messages.pop(0)  # Keep the last 100 messages
        save_guestbook(_guestbook_messages)
        
    # Send email notification via Brevo (not SMTP — works on Render free tier)
    if app.config.get("BREVO_API_KEY"):
        def send_guestbook_emails(sender_name, sender_email, sender_rating, sender_message, delete_link):
            try:
                stars_html = "".join(["★" if i < sender_rating else "☆" for i in range(5)])

                # 1. Notification to Owner
                owner_html_body = f"""
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#0f1117;color:#fff;border-radius:12px;">
  <div style="border-bottom:2px solid #2ecc8f;padding-bottom:16px;margin-bottom:24px;">
    <h2 style="color:#2ecc8f;margin:0;">&#128221; New Guestbook Entry</h2>
  </div>
  <table style="width:100%;border-collapse:collapse;">
    <tr><td style="padding:8px 0;color:#aaa;width:80px;">Name</td><td style="padding:8px 0;font-weight:bold;">{sender_name}</td></tr>
    <tr><td style="padding:8px 0;color:#aaa;">Email</td><td style="padding:8px 0;"><a href="mailto:{sender_email}" style="color:#2ecc8f;">{sender_email}</a></td></tr>
    <tr><td style="padding:8px 0;color:#aaa;">Rating</td><td style="padding:8px 0;color:#ffd700;">{stars_html}</td></tr>
  </table>
  <div style="background:#1a1d27;border-radius:8px;padding:16px;margin-top:20px;">
    <p style="color:#aaa;margin:0 0 8px;font-size:12px;">MESSAGE</p>
    <p style="margin:0;line-height:1.7;">{sender_message}</p>
  </div>
  <div style="margin-top:24px;">
    <a href="{delete_link}" style="display:inline-block;padding:10px 20px;background:#ef4444;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold;font-size:14px;">Delete This Message</a>
  </div>
  <p style="margin-top:20px;font-size:12px;color:#555;">Sent via <strong style="color:#2ecc8f;">Tilak BV Portfolio</strong></p>
</div>
"""
                send_email_via_brevo(
                    to_email=OWNER_EMAIL,
                    to_name="Tilak BV",
                    subject=f"New Guestbook Entry from {sender_name}",
                    html_content=owner_html_body,
                )

                # 2. Confirmation to sender
                if is_valid_email(sender_email):
                    sender_html_body = f"""
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#0f1117;color:#fff;border-radius:12px;">
  <h2 style="color:#2ecc8f;">Your message is live, {sender_name}! &#127881;</h2>
  <p style="color:#ccc;line-height:1.7;">Thanks for stopping by and leaving a note on my portfolio guestbook.</p>
  <div style="background:#1a1d27;border-radius:8px;padding:16px;margin:20px 0;border-left:3px solid #2ecc8f;">
    <p style="color:#aaa;margin:0 0 6px;font-size:12px;">YOUR MESSAGE</p>
    <p style="margin:0;color:#eee;font-style:italic;">"{sender_message}"</p>
    <p style="margin:10px 0 0 0;color:#ffd700;font-size:16px;">{stars_html}</p>
  </div>
  <p style="color:#ccc;line-height:1.7;margin-bottom:24px;">Want to remove your message? Click below:</p>
  <a href="{delete_link}" style="display:inline-block;padding:12px 24px;background:#ef4444;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold;font-size:14px;">Delete My Message</a>
  <p style="color:#ccc;margin-top:30px;">Best regards,<br><strong style="color:#fff;">Tilak BV</strong></p>
  <div style="margin-top:24px;padding-top:16px;border-top:1px solid #222;font-size:12px;color:#555;">
    <a href="https://github.com/Tilak2005-BV" style="color:#2ecc8f;margin-right:16px;">GitHub</a>
    <a href="https://linkedin.com/in/tilakatilaka" style="color:#2ecc8f;">LinkedIn</a>
  </div>
</div>
"""
                    send_email_via_brevo(
                        to_email=sender_email,
                        to_name=sender_name,
                        subject="Your Guestbook Message is Live! ✨",
                        html_content=sender_html_body,
                    )

                app.logger.info(f"Brevo guestbook emails sent for {sender_name} <{sender_email}>")
            except Exception as e:
                app.logger.error(f"Brevo guestbook email error: {e}")

        delete_link = f"{request.host_url}guestbook/delete/{delete_token}"
        threading.Thread(
            target=send_guestbook_emails,
            args=(name, email, rating, message, delete_link),
            daemon=True
        ).start()

    safe_entry = {k: v for k, v in entry.items() if k not in ["delete_token", "email"]}
    return jsonify({"success": True, "entry": safe_entry}), 201


@app.route("/guestbook/delete/<token>", methods=["GET"])
def delete_guestbook(token):
    """Admin endpoint to delete a specific message via an email link using its hidden token."""
    global _guestbook_messages
    with _store_lock:
        before = len(_guestbook_messages)
        _guestbook_messages = [m for m in _guestbook_messages if m.get("delete_token") != token]
        deleted = len(_guestbook_messages) < before
        if deleted:
            save_guestbook(_guestbook_messages)
            
    if deleted:
        return "<h3>Success! The guestbook message has been deleted.</h3><p>You can close this tab.</p>", 200
    return "<h3>Error: Message not found or already deleted.</h3>", 404
if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)