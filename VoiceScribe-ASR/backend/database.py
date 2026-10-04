import os, sqlite3
from contextlib import contextmanager

DB = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "database.db")

@contextmanager
def conn():
    c = sqlite3.connect(DB)
    c.row_factory = sqlite3.Row
    try:
        yield c
        c.commit()
    finally:
        c.close()

def init():
    with conn() as c:
        c.executescript("""
        CREATE TABLE IF NOT EXISTS transcripts(
            id INTEGER PRIMARY KEY AUTOINCREMENT, transcript TEXT NOT NULL, language TEXT,
            duration INTEGER DEFAULT 0, word_count INTEGER, character_count INTEGER,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP);
        CREATE TABLE IF NOT EXISTS recognition_sessions(
            id INTEGER PRIMARY KEY AUTOINCREMENT, language TEXT, start_time TEXT, end_time TEXT,
            duration INTEGER, word_count INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
        """)
