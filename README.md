# 🚀 Tilak BV — Portfolio (Flask + Python Backend)

A full-stack personal portfolio with a **Python Flask backend** that handles the contact form, sends real emails via Gmail SMTP, and serves the CV for download.

---

## 📁 Complete Folder Structure

```
portfolio_flask/
│
├── app.py                        ← Flask backend (all routes)
├── requirements.txt              ← Python dependencies
├── .env.example                  ← Copy this to .env and fill values
├── .env                          ← ⚠️ YOU CREATE THIS (never commit to GitHub)
├── README.md                     ← This file
│
├── templates/
│   └── index.html                ← Jinja2 HTML template (full portfolio)
│
└── static/
    ├── Tilak_BV_CV.docx          ← Resume (served via /download-cv)
    ├── css/
    │   └── style.css             ← All styles + dark/light theme
    ├── js/
    │   └── main.js               ← Animations, form POST to /contact
    └── images/
        ├── profile.jpeg          ← Your photo
        ├── hackathon-cert.png    ← Hackathon certificate
        ├── internship-cert.pdf   ← Internship certificate PDF
        └── industrial-cert.pdf  ← Industrial training certificate PDF
```

---

## ⚙️ Setup & Run (Step by Step)

### Step 1 — Install Python dependencies
```bash
pip install -r requirements.txt
```

### Step 2 — Create your .env file
```bash
cp .env.example .env
```
Then open `.env` and fill in your Gmail credentials (see Gmail App Password section below).

### Step 3 — Run the server
```bash
python app.py
```

Open your browser at: **http://localhost:5000** ✅

---

## 📧 Gmail App Password Setup (Contact Form)

The contact form POSTs to `/contact` → Flask sends email via Gmail SMTP.

> ⚠️ Do NOT use your real Gmail password. Use an **App Password** instead.

**How to get a Gmail App Password:**
1. Go to → https://myaccount.google.com/security
2. Enable **2-Step Verification** (if not already on)
3. Go to **App passwords** (search it in the page)
4. Select app: **Mail** → Generate
5. Copy the 16-character password (e.g. `abcd efgh ijkl mnop`)

**Paste into your `.env`:**
```
MAIL_USERNAME=tilakatilakachary@gmail.com
MAIL_PASSWORD=abcdefghijklmnop
```

That's it! The contact form will now:
- ✅ Send you an email with the visitor's message
- ✅ Auto-reply to the visitor confirming receipt

---

## 🌐 Flask Routes

| Method | URL | What it does |
|--------|-----|--------------|
| `GET` | `/` | Serves the portfolio homepage |
| `POST` | `/contact` | Receives form JSON, validates, sends emails |
| `GET` | `/download-cv` | Downloads `Tilak_BV_CV.docx` |

### Contact API (`POST /contact`)

**Request body (JSON):**
```json
{
  "name": "Ravi Kumar",
  "email": "ravi@gmail.com",
  "subject": "Job Opportunity",
  "message": "Hi Tilak, I came across your portfolio..."
}
```

**Success response:**
```json
{ "success": true, "message": "Message sent! I'll get back to you soon." }
```

**Validation error response (400):**
```json
{ "success": false, "errors": { "email": "Valid email is required." } }
```

**Server error response (500):**
```json
{ "success": false, "message": "Could not send email right now..." }
```

---

## 🚀 Deploying for Free

### Option A: Render.com (Easiest)
1. Push your code to GitHub
2. Go to https://render.com → New Web Service
3. Connect your repo
4. Build command: `pip install -r requirements.txt`
5. Start command: `gunicorn app:app`
6. Add your `.env` variables in Render's Environment tab
7. Deploy! You get a free `*.onrender.com` URL

### Option B: Railway
```bash
railway init
railway up
```
Add env vars in the Railway dashboard.

### Option C: Local network (share with anyone on same WiFi)
```bash
python app.py
# Runs on 0.0.0.0:5000 — share your local IP
```

---

## 🖼️ Swapping Your Profile Photo

Replace `static/images/profile.jpeg` with your new photo using the **same filename**.
No code changes needed.

---

## ✏️ Quick Customizations

| What to change | File | Search for |
|---------------|------|-----------|
| Name | `templates/index.html` | `Tilak BV` |
| GitHub URL | `templates/index.html` | `tilakchary05` |
| LinkedIn URL | `templates/index.html` | `tilakatilaka` |
| Email | `app.py` + `templates/index.html` | `tilakatilakachary@gmail.com` |
| Phone | `templates/index.html` | `+919353056798` |
| Accent color | `static/css/style.css` | `--accent: hsl(158` |
| Add a project | `templates/index.html` | Projects section |

---

## 🔒 Security Notes

- Never commit `.env` to GitHub — add it to `.gitignore`
- The `.env.example` file (no real passwords) is safe to commit
- Flask `SECRET_KEY` should be a long random string in production

**`.gitignore` to add:**
```
.env
__pycache__/
*.pyc
```

---

Built with ❤️ by **Tilak BV** | Flask + Python Backend
