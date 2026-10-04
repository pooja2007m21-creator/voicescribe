# VoiceScribe – Automatic Speech Recognition System

## Description
A web app that captures speech through the browser's SpeechRecognition API, shows an editable transcript, analyzes the text, and stores transcripts in SQLite through a Flask REST API.

## Features
Live and interim transcripts, 8 languages, pause/resume, copy, download, save, text statistics, keyword extraction, recognition-status indicator, history, settings, dark mode, responsive UI.

## Technologies Used
HTML5, CSS3, vanilla JavaScript, Web Speech API, Python, Flask, SQLite.

## Project Structure
`app.py`, `backend/` (database, models, routes), `frontend/` (pages, css, js), `static/exports/`. `database.db` is created automatically on first run.

## Installation
```bash
python -m venv venv
venv\Scripts\activate        # Windows (macOS/Linux: source venv/bin/activate)
pip install -r requirements.txt
python app.py
```
Open http://127.0.0.1:5000

## How It Works
Speech → Microphone → ASR Engine → Transcript → Text Analysis → Storage

## API
`GET /api/health`, `POST|GET /api/transcripts`, `GET|DELETE /api/transcripts/<id>`, `DELETE /api/transcripts` (clear all), `POST /api/analyze`, `GET /api/summary`.

## Browser Compatibility
SpeechRecognition support varies. Chrome and Edge work best; Firefox does not support it. Microphone permission is required, and most browsers use an online recognition service, so an internet connection is needed. Use `localhost` or HTTPS.

## Future Enhancements
AI-powered transcription, speaker identification, automatic punctuation, multilingual transcription, noise reduction, custom vocabulary, cloud ASR integration, advanced text summarization.
