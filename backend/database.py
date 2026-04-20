import firebase_admin
from firebase_admin import credentials, firestore
import os

# Path to your Firebase service account key
KEY_PATH = os.path.join(os.path.dirname(__file__), "firebase-key.json")

# Initialize Firebase
db = None

if os.path.exists(KEY_PATH):
    if not firebase_admin._apps:
        cred = credentials.Certificate(KEY_PATH)
        firebase_admin.initialize_app(cred)
    db = firestore.client()
else:
    print("\n" + "!"*60)
    print("CRITICAL: firebase-key.json NOT FOUND.")
    print("Please place your Firebase service account key in the backend/ directory.")
    print("The server will start but Firestore operations will fail.")
    print("!"*60 + "\n")

def get_db():
    if db is None:
        raise RuntimeError("Firestore client not initialized. check firebase-key.json")
    return db
