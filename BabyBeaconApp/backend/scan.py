import threading
import time
from flask import Flask, request, jsonify
from google.cloud import firestore
from google.oauth2 import service_account
import firebase_admin
from firebase_admin import credentials, firestore
import logging
logging.basicConfig(level=logging.DEBUG)

# Initialize Flask App
app = Flask(__name__)

# Firebase Service Account Path
SERVICE_ACCOUNT_PATH = "babybeacon-2025-firebase-adminsdk-fbsvc-63d713583a.json"

# Initialize Firestore
cred = credentials.Certificate(SERVICE_ACCOUNT_PATH)
firebase_admin.initialize_app(cred)
db = firestore.client()

@app.route('/user/device', methods=['GET'])
def get_user_device():
    """Fetch the device ID linked to the username"""
    username = request.args.get('username')

    if not username:
        return jsonify({"error": "Username is required"}), 400

    user_ref = db.collection("users").document(username)
    user_doc = user_ref.get()

    if user_doc.exists and 'device_id' in user_doc.to_dict():
        return jsonify({"device_id": user_doc.to_dict()['device_id']})

    return jsonify({"error": "Device ID not found"}), 404

def listen_for_scans(device_id, ride_id):
    """Waits for the ride object, then listens for new scans under devices/{device_id}/rides/{ride_id}"""
    
    ride_ref = db.collection("devices").document(device_id).collection("rides").document(ride_id)

    # Wait for the ride document to be created
    time.sleep(5)

    def scan_listener(doc_snapshot, changes, read_time):
        """Callback to handle new scan documents"""
        for change in changes:
            if change.type.name == "ADDED":
                scan_data = change.document.to_dict()
                print(f"📌 New Scan Detected: {scan_data}")  # Log scan data

    doc_watch = ride_ref.collection("scans").on_snapshot(scan_listener)

    # Keep listening until scanning is stopped
    while True:
        device_ref = db.collection("devices").document(device_id)
        device_status = device_ref.get().to_dict().get("status", "idle")
        if device_status == "idle":
            print(f"🛑 Stopping scan listener for ride {ride_id}")
            break
        time.sleep(5)

@app.route('/scan', methods=['POST'])
def start_stop_scan():
    """Start or stop scanning"""
    data = request.json
    device_id = data.get('device_id')
    action = data.get('action')
    username = data.get('username')

    if not device_id or action not in ['start', 'stop'] or not username:
        return jsonify({"error": "Invalid request"}), 400

    device_ref = db.collection("devices").document(device_id)

    if action == "start":
        device_ref.update({"status": "scanning"})
        ride_id = f"ride_{int(time.time())}"  # Unique ride ID based on timestamp

        # Start listening for scans in a separate thread
        threading.Thread(target=listen_for_scans, args=(device_id, ride_id), daemon=True).start()

        return jsonify({"message": f"Scan started for {username}, listening on ride ID {ride_id}", "status": "scanning"})

    else:
        device_ref.update({"status": "idle"})
        return jsonify({"message": "Scan stopped", "status": "idle"})

@app.route('/scan/status', methods=['GET'])
def get_scan_status():
    """Check the current scan status"""
    device_id = request.args.get('device_id')

    if not device_id:
        return jsonify({"error": "Device ID is required"}), 400

    device_ref = db.collection("devices").document(device_id)
    doc = device_ref.get()

    if doc.exists and 'status' in doc.to_dict():
        return jsonify({"status": doc.to_dict()['status']})
    
    return jsonify({"status": "idle"})  # Default to idle if no data exists

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5011, debug=True)
