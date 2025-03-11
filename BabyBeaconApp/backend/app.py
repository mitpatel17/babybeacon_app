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

### 🔐 CHANGE PASSWORD API ###
@app.route("/change_password", methods=["POST"])
def change_password():
    data = request.json
    username = data.get("username")
    old_password = data.get("old_password")
    new_password = data.get("new_password")

    if not username or not old_password or not new_password:
        return jsonify({"status": "fail", "message": "Missing required fields."}), 400

    try:
        user_ref = db.collection("users").document(username)
        user_doc = user_ref.get()

        if not user_doc.exists:
            return jsonify({"status": "fail", "message": "User not found."}), 404

        user_data = user_doc.to_dict()

        # ✅ Check if old password matches
        if user_data.get("password") != old_password:
            return jsonify({"status": "fail", "message": "Incorrect old password."}), 401

        # ✅ Update the password
        user_ref.update({"password": new_password})

        return jsonify({"status": "success", "message": "Password changed successfully."}), 200

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

### 1️⃣ LOGIN API ###
@app.route("/login", methods=["POST"])
def login_user():
    data = request.json
    username = data.get("username")
    password = data.get("password")

    try:
        user_ref = db.collection("users").document(username)
        user_doc = user_ref.get()

        if not user_doc.exists:
            return jsonify({"status": "fail", "message": "User not found."}), 404

        user_data = user_doc.to_dict()
        stored_password = user_data.get("password")

        if password == stored_password:
            return jsonify({"status": "success", "message": "Login successful.", "user_data": user_data}), 200
        else:
            return jsonify({"status": "fail", "message": "Incorrect password."}), 401

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


### 2️⃣ SIGN-UP API ###
@app.route("/signup", methods=["POST"])
def sign_up_user():
    data = request.json
    device_id = data.get("device_id", "").strip()
    name = data.get("name", "").strip()
    email = data.get("email", "").strip()
    phone_number = data.get("phone_number", "").strip()
    username = data.get("username", "").strip()
    password = data.get("password", "").strip()
    babies = data.get("babies", [])

    # Validate inputs
    if not all(isinstance(field, str) and field for field in [device_id, name, email, phone_number, username, password]):
        return jsonify({"status": "error", "message": "One or more components is not a string or is empty."}), 400

    if not isinstance(babies, list) or not all(isinstance(baby, str) and baby for baby in babies):
        return jsonify({"status": "error", "message": "Invalid baby names. Each baby must be a non-empty string."}), 400

    try:
        user_ref = db.collection("users").document(username)
        if user_ref.get().exists:  # ✅ Corrected `.exists` usage
            return jsonify({"status": "fail", "message": f"Username '{username}' already exists."}), 400

        device_ref = db.collection("devices").document(device_id)
        device_doc = device_ref.get()

        if not device_doc.exists:  # ✅ Corrected `.exists` usage
            return jsonify({"status": "fail", "message": f"Device ID '{device_id}' does not exist."}), 404

        # Create user document
        user_data = {
            "device_id": device_id,
            "name": name,
            "email": email,
            "phone_number": phone_number,
            "username": username,
            "password": password,
            "last_ride_Id": 0,
            "scanning_baby": babies[0] if babies else None  # Set first baby as active
        }
        user_ref.set(user_data)

        # Create babies as a subcollection
        for baby_name in babies:
            baby_ref = user_ref.collection("babies").document(baby_name)
            baby_ref.set({
                "responses": {},  # Empty response map
                "rides": []       # Empty rides array
            })

        # Update device to link the user
        device_ref.update({"username": username, "status": "idle"})

        return jsonify({"status": "success", "message": f"User '{username}' signed up successfully with {len(babies)} babies."}), 201

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

### 3️⃣ UPDATE PROFILE API ###
@app.route("/update_profile", methods=["POST"])
def update_profile():
    try:
        data = request.json
        username = data.get("username")
        updates = data.get("updates", {})

        if not username or not updates:
            return jsonify({"status": "fail", "message": "Missing required fields"}), 400

        user_ref = db.collection("users").document(username)
        user_doc = user_ref.get()

        if not user_doc.exists:
            return jsonify({"status": "fail", "message": f"User '{username}' not found."}), 404

        # Update device ID if changed
        if "device_id" in updates:
            new_device_id = updates["device_id"]
            old_device_id = user_doc.to_dict().get("device_id")

            if old_device_id:
                old_device_ref = db.collection("devices").document(old_device_id)
                if old_device_ref.get().exists:
                    old_device_ref.update({"username": firestore.DELETE_FIELD})

            new_device_ref = db.collection("devices").document(new_device_id)
            if not new_device_ref.get().exists:
                return jsonify({"status": "fail", "message": f"New device ID '{new_device_id}' does not exist."}), 400

            new_device_ref.update({"username": username})

        # Update user fields in Firestore
        user_ref.update(updates)

        return jsonify({"status": "success", "message": "Profile updated successfully."}), 200

    except Exception as e:
        logging.error(f"Update Profile Error: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route("/update_starred_responses", methods=["POST"])
def update_starred_responses():
    data = request.json
    username = data.get("username")
    baby_name = data.get("baby_name")
    starred_responses = data.get("starred_responses", [])

    user_ref = db.collection("users").document(username).collection("baby").document(baby_name)
    user_ref.update({"starred_responses": starred_responses})

    return jsonify({"status": "success", "message": "Updated starred responses."}), 200

@app.route("/delete_response", methods=["POST"])
def delete_response():
    data = request.json
    username = data.get("username")
    baby_name = data.get("baby_name")
    response = data.get("response")

    baby_ref = db.collection("users").document(username).collection("baby").document(baby_name)
    baby_ref.update({f"responses.{response}": firestore.DELETE_FIELD})

    return jsonify({"status": "success", "message": "Response deleted."}), 200

@app.route("/get_baby_responses", methods=["GET"])
def get_baby_responses():
    try:
        username = request.args.get("username")
        scanning_baby = request.args.get("scanning_baby")

        if not username or not scanning_baby:
            return jsonify({"status": "error", "message": "Missing parameters"}), 400

        user_ref = db.collection("users").document(username)
        baby_ref = user_ref.collection("baby").document(scanning_baby)
        baby_doc = baby_ref.get()

        if not baby_doc.exists:
            return jsonify({"status": "error", "message": "Baby not found"}), 404

        baby_data = baby_doc.to_dict()

        # Convert the 'responses' dict to a list of keys
        responses_dict = baby_data.get("responses", {})
        response_keys = list(responses_dict.keys())

        starred_responses = baby_data.get("starred_responses", [])

        return jsonify({
            "status": "success",
            "responses": response_keys,
            "starred_responses": starred_responses
        }), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/get_response_url', methods=['GET'])
def get_response_url():
    username = request.args.get('username')
    scanning_baby = request.args.get('scanning_baby')
    response_key = request.args.get('response_key')

    if not username or not scanning_baby or not response_key:
        return jsonify({"status": "error", "message": "Missing parameters"}), 400

    try:
        # 🔹 Fetch URL from Firebase (Assuming Firestore usage)
        doc_ref = db.collection("users").document(username).collection("baby").document(scanning_baby)
        doc = doc_ref.get()

        if doc.exists:
            responses = doc.to_dict().get("responses", {})
            response_url = responses.get(response_key)

            if response_url:
                return jsonify({"status": "success", "url": response_url})
            else:
                return jsonify({"status": "error", "message": "Response key not found"}), 404
        else:
            return jsonify({"status": "error", "message": "Document not found"}), 404

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route("/update_device_response", methods=["POST"])
def update_device_response():
    """
    Updates the response URL in Firestore under devices/{device_id}/response.
    If 'None' is selected, it clears the response (stores "") instead of null.
    """
    try:
        data = request.json
        device_id = data.get("device_id")
        response_url = data.get("response", "").strip()  # Default to "" if missing

        if not device_id:
            return jsonify({"status": "error", "message": "Missing device_id"}), 400

        # 🔹 Ensure response is not None, always set to "" if "None" is selected
        response_to_store = response_url if response_url.lower() != "none" else ""

        # 🔹 Update Firestore: Set response URL in devices/{device_id}
        device_ref = db.collection("devices").document(device_id)
        device_ref.update({"response": response_to_store})

        return jsonify({"status": "success", "message": "Response updated successfully."})

    except Exception as e:
        print("Error updating device response:", str(e))
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route("/add_baby", methods=["POST"])
def add_baby():
    try:
        data = request.json
        username = data.get("username")
        baby_name = data.get("baby_name")

        if not username or not baby_name:
            return jsonify({"status": "fail", "message": "Missing required fields"}), 400

        user_ref = db.collection("users").document(username)
        user_doc = user_ref.get()

        if not user_doc.exists:
            return jsonify({"status": "fail", "message": f"User '{username}' not found."}), 404

        # Create baby entry under "babies" subcollection instead of an array
        baby_ref = user_ref.collection("baby").document(baby_name)
        baby_ref.set({
            "responses": {},  # Empty response map
            "rides": [],       # Empty rides array
            "starred_responses" : []
        })

        return jsonify({"status": "success", "message": f"Baby '{baby_name}' added successfully."}), 201

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


### 5️⃣ REMOVE BABY API ###
@app.route("/remove_baby", methods=["POST"])
def remove_baby():
    try:
        data = request.json
        username = data.get("username")
        baby_name = data.get("baby_name")

        if not username or not baby_name:
            return jsonify({"status": "fail", "message": "Missing required fields"}), 400

        user_ref = db.collection("users").document(username)
        baby_ref = user_ref.collection("baby").document(baby_name)

        if not baby_ref.get().exists:
            return jsonify({"status": "fail", "message": f"Baby '{baby_name}' not found."}), 404

        baby_ref.delete()
        return jsonify({"status": "success", "message": f"Baby '{baby_name}' removed successfully."}), 200

    except Exception as e:
        logging.error(f"Remove Baby Error: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route("/get_device_status", methods=["GET"])
def get_device_status():
    device_id = request.args.get("device_id")
    doc = db.collection("devices").document(device_id).get()
    if doc.exists:
        return jsonify({"status": "success", "device_status": doc.to_dict().get("status", "idle")})
    return jsonify({"status": "error", "message": "Device not found"}), 404

@app.route("/get_ride_data", methods=["GET"])
def get_ride_data():
    device_id = request.args.get("device_id")
    ride_id = request.args.get("ride_id")
    doc = db.collection("devices").document(device_id).collection("rides").document(ride_id).get()
    if doc.exists:
        return jsonify({"status": "success", "scans": doc.to_dict()})
    return jsonify({"status": "error", "message": "Ride not found"}), 404

@app.route("/get_profile", methods=["GET"])
def get_profile():
    try:
        username = request.args.get("username")
        if not username:
            return jsonify({"status": "fail", "message": "Username required"}), 400

        user_ref = db.collection("users").document(username)
        user_doc = user_ref.get()

        if not user_doc.exists:
            return jsonify({"status": "fail", "message": f"User '{username}' not found."}), 404

        user_data = user_doc.to_dict()

        # ✅ Fix: Fetch babies from the "baby" subcollection
        babies_ref = user_ref.collection("baby").stream()
        babies = [baby.id for baby in babies_ref]  # Get baby names as a list

        user_data["babies"] = babies  # Attach to user response

        return jsonify({"status": "success", "data": user_data}), 200

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route("/get_device_id", methods=["GET"])
def get_device_id():
    username = request.args.get("username")  # ✅ Extract username
    if not username:
        return jsonify({"error": "Username is required"}), 400

    try:
        user_ref = db.collection("users").document(username)
        user_doc = user_ref.get()

        if user_doc.exists:
            user_data = user_doc.to_dict()
            device_id = user_data.get("device_id")
            if device_id:
                return jsonify({"device_id": device_id}), 200
            else:
                return jsonify({"error": "Device ID not found"}), 404
        else:
            return jsonify({"error": "User not found"}), 404

    except Exception as e:
        return jsonify({"error": str(e)}), 500


### 3️⃣ GET SCAN STATUS API ###
@app.route("/get_scan_status", methods=["GET"])
def get_scan_status():
    device_id = request.args.get("device_id")

    try:
        device_ref = db.collection("devices").document(device_id)
        device_doc = device_ref.get()

        if device_doc.exists:
            device_data = device_doc.to_dict()
            return jsonify({"status": "success", "data": device_data}), 200
        else:
            return jsonify({"status": "fail", "message": "Device not found."}), 404

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


### 4️⃣ START RIDE API ###
@app.route("/start_scan", methods=["POST"])
def start_scan():
    data = request.json
    device_id = data.get("device_id")

    try:
        device_ref = db.collection("devices").document(device_id)
        device_ref.update({"status": "scanning"})

        return jsonify({"status": "success", "message": "Ride started."}), 200

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


### 5️⃣ STOP RIDE API ###
@app.route("/stop_scan", methods=["POST"])
def stop_scan():
    data = request.json
    device_id = data.get("device_id")

    try:
        device_ref = db.collection("devices").document(device_id)
        device_ref.update({"status": "idle"})

        return jsonify({"status": "success", "message": "Ride stopped."}), 200

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route("/add_response", methods=["POST"])
def add_response():
    """
    Adds a response (name + URL) to a specific baby under a user's account.
    """
    try:
        data = request.json
        username = data.get("username")
        baby_name = data.get("baby_name")
        response_name = data.get("response_name")
        response_url = data.get("response_url")

        if not username or not baby_name or not response_name or not response_url:
            return jsonify({"status": "fail", "message": "Missing required fields"}), 400

        user_ref = db.collection("users").document(username)
        baby_ref = user_ref.collection("baby").document(baby_name)
        baby_doc = baby_ref.get()

        if not baby_doc.exists:
            return jsonify({"status": "fail", "message": f"Baby '{baby_name}' not found."}), 404

        # 🔹 Fetch current responses and update with the new one
        baby_data = baby_doc.to_dict()
        responses = baby_data.get("responses", {})

        if response_name in responses:
            return jsonify({"status": "fail", "message": "Response name already exists"}), 400

        responses[response_name] = response_url  # Add response name and URL

        # 🔹 Update Firestore
        baby_ref.update({"responses": responses})

        return jsonify({"status": "success", "message": f"Response '{response_name}' added successfully."}), 201

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route("/get_starred_responses", methods=["GET"])
def get_starred_responses():
    username = request.args.get("username")
    scanning_baby = request.args.get("scanning_baby")

    if not username or not scanning_baby:
        return jsonify({"status": "error", "message": "Missing parameters"}), 400

    try:
        user_ref = db.collection("users").document(username)
        baby_ref = user_ref.collection("baby").document(scanning_baby)
        baby_doc = baby_ref.get()

        if baby_doc.exists:
            baby_data = baby_doc.to_dict()
            starred_responses = baby_data.get("starred_responses", [])

            return jsonify({"status": "success", "starred_responses": starred_responses}), 200
        else:
            return jsonify({"status": "error", "message": "Baby not found"}), 404

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

### 6️⃣ SEND YOUTUBE RESPONSE API ###
@app.route("/send_response", methods=["POST"])
def send_response():
    data = request.json
    device_id = data.get("device_id")
    youtube_url = data.get("youtube_url")

    try:
        device_ref = db.collection("devices").document(device_id)
        device_ref.update({"response": youtube_url})

        return jsonify({"status": "success", "message": "YouTube response sent."}), 200

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)
