import sqlite3
from flask import Blueprint, jsonify, request
from .database import conn
from .models import analyze

api = Blueprint("api", __name__, url_prefix="/api")

def err(msg, code=400):
    return jsonify(error=msg), code

def body_text(d):
    t = d.get("transcript") if isinstance(d, dict) else None
    if not isinstance(t, str) or not t.strip():
        return None, "Transcript is empty or invalid."
    if len(t) > 100000:
        return None, "Transcript is too long."
    return t.strip(), None

@api.errorhandler(sqlite3.Error)
def db_error(e):
    return err("Database error. Please try again.", 500)

@api.get("/health")
def health():
    return jsonify(status="ok")

@api.post("/transcripts")
def add():
    d = request.get_json(silent=True)
    t, e = body_text(d)
    if e:
        return err(e)
    try:
        dur = max(0, int(d.get("duration", 0)))
    except (TypeError, ValueError):
        return err("Duration must be a number.")
    lang = str(d.get("language", "en-US"))[:10]
    s = analyze(t)
    with conn() as c:
        cur = c.execute("INSERT INTO transcripts(transcript,language,duration,word_count,character_count) VALUES(?,?,?,?,?)",
                        (t, lang, dur, s["words"], s["characters"]))
        c.execute("INSERT INTO recognition_sessions(language,start_time,end_time,duration,word_count) VALUES(?,?,?,?,?)",
                  (lang, str(d.get("start_time", ""))[:40], str(d.get("end_time", ""))[:40], dur, s["words"]))
    return jsonify(id=cur.lastrowid), 201

@api.get("/transcripts")
def list_all():
    with conn() as c:
        rows = c.execute("SELECT * FROM transcripts ORDER BY id DESC").fetchall()
    return jsonify([dict(r) for r in rows])

@api.get("/transcripts/<int:tid>")
def one(tid):
    with conn() as c:
        r = c.execute("SELECT * FROM transcripts WHERE id=?", (tid,)).fetchone()
    return jsonify(dict(r)) if r else err("Transcript not found.", 404)

@api.delete("/transcripts/<int:tid>")
def delete(tid):
    with conn() as c:
        n = c.execute("DELETE FROM transcripts WHERE id=?", (tid,)).rowcount
    return jsonify(deleted=n) if n else err("Transcript not found.", 404)

@api.delete("/transcripts")
def clear():
    with conn() as c:
        c.execute("DELETE FROM transcripts")
    return jsonify(deleted="all")

@api.post("/analyze")
def analyze_route():
    t, e = body_text(request.get_json(silent=True))
    return err(e) if e else jsonify(analyze(t))

@api.get("/summary")
def summary():
    with conn() as c:
        sessions = c.execute("SELECT COUNT(*), COALESCE(SUM(word_count),0) FROM recognition_sessions").fetchone()
        total = c.execute("SELECT COUNT(*) FROM transcripts").fetchone()[0]
        top = c.execute("SELECT language FROM recognition_sessions GROUP BY language ORDER BY COUNT(*) DESC LIMIT 1").fetchone()
    return jsonify(total_sessions=sessions[0], total_words=sessions[1], total_transcripts=total, top_language=top[0] if top else None)
