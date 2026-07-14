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

mail = Mail(app) 

OWNER_EMAIL = "tilakatilakachary@gmail.com"

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
    if not app.config["MAIL_USERNAME"] or not app.config["MAIL_PASSWORD"]:
        app.logger.error("SMTP Configuration variables are missing inside your .env configuration.")
        return jsonify({
            "success": False,
            "message": "Server configuration missing. Please reach out directly to tilakatilakachary@gmail.com.",
            "errors": {}
        }), 500

    # ── Send email in background thread (prevents gunicorn worker timeout) ──
    def send_emails_background(app_ctx, owner_name, owner_email_addr, sender_email, sender_subject, sender_body, sent_at):
        with app_ctx:
            try:
                msg_to_owner = Message(
                    subject=f"[Portfolio] {sender_subject}",
                    recipients=[OWNER_EMAIL],
                    reply_to=sender_email,
                    body=f"""
New message from your portfolio contact form
============================================
Name    : {owner_name}
Email   : {sender_email}
Subject : {sender_subject}
Date    : {sent_at}

Message:
--------
{sender_body}

---
Sent via Tilak BV Portfolio
""",
                    html=f"""
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#0f1117;color:#fff;border-radius:12px;">
  <div style="border-bottom:2px solid #2ecc8f;padding-bottom:16px;margin-bottom:24px;">
    <h2 style="color:#2ecc8f;margin:0;">📬 New Portfolio Message</h2>
  </div>
  <table style="width:100%;border-collapse:collapse;">
    <tr><td style="padding:8px 0;color:#aaa;width:80px;">Name</td><td style="padding:8px 0;font-weight:bold;">{owner_name}</td></tr>
    <tr><td style="padding:8px 0;color:#aaa;">Email</td><td style="padding:8px 0;"><a href="mailto:{sender_email}" style="color:#2ecc8f;">{sender_email}</a></td></tr>
    <tr><td style="padding:8px 0;color:#aaa;">Subject</td><td style="padding:8px 0;">{sender_subject}</td></tr>
    <tr><td style="padding:8px 0;color:#aaa;">Date</td><td style="padding:8px 0;">{sent_at}</td></tr>
  </table>
  <div style="background:#1a1d27;border-radius:8px;padding:16px;margin-top:20px;">
    <p style="color:#aaa;margin:0 0 8px;font-size:12px;">MESSAGE</p>
    <p style="margin:0;line-height:1.7;">{sender_body}</p>
  </div>
  <p style="margin-top:20px;font-size:12px;color:#555;">Sent via <strong style="color:#2ecc8f;">Tilak BV Portfolio</strong></p>
</div>
"""
                )
                mail.send(msg_to_owner)

                msg_auto_reply = Message(
                    subject="Thanks for reaching out — Tilak BV",
                    recipients=[sender_email],
                    body=f"""
Hi {owner_name},

Thanks for getting in touch! I've received your message and will get back to you as soon as possible.

Your message:
"{sender_body}"

Best regards,
Tilak BV
Computer Science Student | Full-Stack Developer
GitHub : github.com/tilakchary05
LinkedIn: linkedin.com/in/tilakatilaka
""",
                    html=f"""
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#0f1117;color:#fff;border-radius:12px;">
  <h2 style="color:#2ecc8f;">Thanks for reaching out, {owner_name}! 👋</h2>
  <p style="color:#ccc;line-height:1.7;">
    I've received your message and will get back to you as soon as possible — usually within 24 hours.
  </p>
  <div style="background:#1a1d27;border-radius:8px;padding:16px;margin:20px 0;border-left:3px solid #2ecc8f;">
    <p style="color:#aaa;margin:0 0 6px;font-size:12px;">YOUR MESSAGE</p>
    <p style="margin:0;color:#eee;font-style:italic;">"{sender_body}"</p>
  </div>
  <p style="color:#ccc;">Best regards,<br><strong style="color:#fff;">Tilak BV</strong></p>
  <div style="margin-top:24px;padding-top:16px;border-top:1px solid #222;font-size:12px;color:#555;">
    <a href="https://github.com/tilakchary05" style="color:#2ecc8f;margin-right:16px;">GitHub</a>
    <a href="https://linkedin.com/in/tilakatilaka" style="color:#2ecc8f;">LinkedIn</a>
  </div>
</div>
"""
                )
                mail.send(msg_auto_reply)
                app.logger.info(f"Emails sent successfully to {sender_email} and {OWNER_EMAIL}")

            except Exception as e:
                app.logger.error(f"Background mail exception: {e}")

    sent_at = datetime.now().strftime('%d %b %Y, %I:%M %p')
    email_thread = threading.Thread(
        target=send_emails_background,
        args=(app.app_context(), name, email, email, subject, body, sent_at),
        daemon=True
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
        
    # Send email notification to owner and sender asynchronously
    if app.config["MAIL_USERNAME"] and app.config["MAIL_PASSWORD"]:
        def send_async_emails(app, name, email, rating, message, delete_link):
            with app.app_context():
                try:
                    # 1. Notification to Owner
                    msg_obj = Message(
                        subject=f"New Guestbook Entry from {name}",
                        recipients=[OWNER_EMAIL],
                        body=f"New message on your portfolio guestbook:\n\nName: {name}\nEmail: {email}\nRating: {rating}/5\nMessage:\n{message}\n\nTo delete this message, click the link below:\n{delete_link}"
                    )
                    mail.send(msg_obj)

                    # 2. Notification to Sender
                    if is_valid_email(email):
                        stars_html = "".join(["★" if i < rating else "☆" for i in range(5)])
                        sender_msg = Message(
                            subject="Your Guestbook Message is Live! ✨",
                            recipients=[email],
                            body=f"Hi {name},\n\nYour message has been posted on the guestbook!\n\nMessage: {message}\nRating: {stars_html}\n\nIf you ever want to delete your message, use this link: {delete_link}\n\nThanks,\nTilak BV",
                            html=f"""
                            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#0f1117;color:#fff;border-radius:12px;">
                              <h2 style="color:#2ecc8f;">Your message is live, {name}! 🎉</h2>
                              <p style="color:#ccc;line-height:1.7;">
                                Thanks for stopping by and leaving a note on my portfolio guestbook.
                              </p>
                              <div style="background:#1a1d27;border-radius:8px;padding:16px;margin:20px 0;border-left:3px solid #2ecc8f;">
                                <p style="color:#aaa;margin:0 0 6px;font-size:12px;">YOUR MESSAGE</p>
                                <p style="margin:0;color:#eee;font-style:italic;">"{message}"</p>
                                <p style="margin:10px 0 0 0;color:#ffd700;font-size:16px;">{stars_html}</p>
                              </div>
                              <p style="color:#ccc;line-height:1.7;margin-bottom:24px;">
                                If you ever change your mind and want to remove this message, you can do so by clicking the button below:
                              </p>
                              <a href="{delete_link}" style="display:inline-block;padding:12px 24px;background:#ef4444;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold;font-size:14px;">Delete My Message</a>
                              <p style="color:#ccc;margin-top:30px;">Best regards,<br><strong style="color:#fff;">Tilak BV</strong></p>
                              <div style="margin-top:24px;padding-top:16px;border-top:1px solid #222;font-size:12px;color:#555;">
                                <a href="https://github.com/tilakchary05" style="color:#2ecc8f;margin-right:16px;">GitHub</a>
                                <a href="https://linkedin.com/in/tilakatilaka" style="color:#2ecc8f;">LinkedIn</a>
                              </div>
                            </div>
                            """
                        )
                        mail.send(sender_msg)
                except Exception as e:
                    app.logger.error(f"Failed to send guestbook email notification: {e}")

        delete_link = f"{request.host_url}guestbook/delete/{delete_token}"
        threading.Thread(target=send_async_emails, args=(app, name, email, rating, message, delete_link)).start()

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