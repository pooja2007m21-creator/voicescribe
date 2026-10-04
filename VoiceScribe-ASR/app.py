import os
from flask import Flask, send_from_directory
from backend.database import init
from backend.routes import api

BASE = os.path.dirname(os.path.abspath(__file__))
FE = os.path.join(BASE, "frontend")
app = Flask(__name__, static_folder=FE, static_url_path="")
app.register_blueprint(api)
init()

@app.route("/")
def home():
    return send_from_directory(FE, "index.html")

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
