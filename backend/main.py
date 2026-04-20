from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from datetime import datetime
import database, schemas, auth, models, httpx, math
from dotenv import load_dotenv
import os
from twilio.rest import Client as TwilioClient

load_dotenv()
# Twilio Config
TWILIO_SID = os.getenv("TWILIO_SID")
TWILIO_TOKEN = os.getenv("TWILIO_TOKEN")
TWILIO_FROM = os.getenv("TWILIO_FROM")
ASSISTANCE_TO = os.getenv("ASSISTANCE_TO")

app = FastAPI(title="hoWrk API")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/call/assist")
def trigger_assistance_call(current_user: dict = Depends(auth.get_current_user)):
    """Triggers a real phone call via Twilio to the registered assistance number."""
    try:
        client = TwilioClient(TWILIO_SID, TWILIO_TOKEN)
        call = client.calls.create(
            to=ASSISTANCE_TO,
            from_=TWILIO_FROM,
            twiml='<Response><Say voice="alice" language="en-IN">Alert. This is a Sentinel safety assistance call. A user has triggered the emergency assistance line and requires your attention. Please respond immediately. Stay safe.</Say><Pause length="1"/><Say voice="alice" language="en-IN">This message is from Sentinel Safety Network.</Say></Response>'
        )
        return {"status": "calling", "sid": call.sid, "to": ASSISTANCE_TO}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Call failed: {str(e)}")

@app.post("/contact/save")
def save_emergency_contact(
    contact: schemas.EmergencyContact,
    current_user: dict = Depends(auth.get_current_user)
):
    """Save or update the citizen's personal emergency contact."""
    db = database.get_db()
    contacts_ref = db.collection("emergency_contacts")
    existing = contacts_ref.where("user_id", "==", current_user["id"]).limit(1).get()
    contact_data = {
        "user_id": current_user["id"],
        "name": contact.name,
        "relationship": contact.relationship,
        "phone": contact.phone,
    }
    if existing:
        doc_id = existing[0].id
        contacts_ref.document(doc_id).set(contact_data)
        contact_data["id"] = doc_id
    else:
        _, doc_ref = contacts_ref.add(contact_data)
        contact_data["id"] = doc_ref.id
    return {"status": "saved", **contact_data}

@app.get("/contact/get")
def get_emergency_contact(current_user: dict = Depends(auth.get_current_user)):
    """Get the citizen's saved emergency contact."""
    db = database.get_db()
    docs = db.collection("emergency_contacts").where("user_id", "==", current_user["id"]).limit(1).get()
    if not docs:
        return {"saved": False}
    c = docs[0].to_dict()
    c["id"] = docs[0].id
    c["saved"] = True
    return c

@app.delete("/contact/delete")
def delete_emergency_contact(current_user: dict = Depends(auth.get_current_user)):
    db = database.get_db()
    docs = db.collection("emergency_contacts").where("user_id", "==", current_user["id"]).limit(1).get()
    if docs:
        database.get_db().collection("emergency_contacts").document(docs[0].id).delete()
    return {"status": "deleted"}

@app.post("/auth/register", response_model=schemas.UserResponse)
def register(user: schemas.UserCreate):
    users_ref = database.get_db().collection("users")
    
    # Check if username exists
    existing_user = users_ref.where("username", "==", user.username).limit(1).get()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    hashed_password = auth.get_password_hash(user.password)
    user_data = {
        "username": user.username,
        "email": user.email,
        "hashed_password": hashed_password,
        "role": user.role
    }
    
    update_time, doc_ref = users_ref.add(user_data)
    user_data["id"] = doc_ref.id
    return user_data

@app.post("/auth/login", response_model=schemas.Token)
def login(user_data: schemas.UserCreate):
    users_ref = database.get_db().collection("users")
    docs = users_ref.where("username", "==", user_data.username).limit(1).get()
    
    if not docs:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_doc = docs[0]
    user_info = user_doc.to_dict()
    
    if not auth.verify_password(user_data.password, user_info["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    access_token = auth.create_access_token(data={"sub": user_info["username"]})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/incidents/report", response_model=schemas.IncidentResponse)
def report_incident(
    incident: schemas.IncidentCreate,
    current_user: dict = Depends(auth.get_current_user)
):
    incidents_ref = database.get_db().collection("incidents")
    incident_data = incident.dict()
    incident_data["timestamp"] = datetime.utcnow()
    incident_data["reporter_id"] = current_user["id"]
    
    update_time, doc_ref = incidents_ref.add(incident_data)
    incident_data["id"] = doc_ref.id

    # --- Notify nearby guardians via Twilio ---
    if incident.type == "SOS_SIGNAL":
        try:
            guardians_ref = database.get_db().collection("guardians")
            all_guardians = guardians_ref.where("is_active", "==", True).get()
            nearby_phones = []
            for g_doc in all_guardians:
                g = g_doc.to_dict()
                dist = _haversine(incident.lat, incident.lng, g["lat"], g["lng"])
                if dist <= 5.0:  # within 5 km
                    nearby_phones.append(g["phone"])
            if nearby_phones:
                twilio_client = TwilioClient(TWILIO_SID, TWILIO_TOKEN)
                msg = (f'<Response><Say voice="alice" language="en-IN">'
                       f'ALERT. This is Sentinel Safety Network. '
                       f'A citizen in your area has triggered an emergency SOS signal. '
                       f'Please respond immediately. Open the Sentinel app to view their live location.'
                       f'</Say></Response>')
                for phone in nearby_phones:
                    twilio_client.calls.create(to=phone, from_=TWILIO_FROM, twiml=msg)
        except Exception as e:
            print(f"Guardian alert error: {e}")

    # --- Also call the citizen's personal emergency contact ---
    try:
        ec_docs = database.get_db().collection("emergency_contacts").where("user_id", "==", current_user["id"]).limit(1).get()
        if ec_docs:
            ec = ec_docs[0].to_dict()
            ec_phone = ec.get("phone")
            ec_name = ec.get("name", "Contact")
            if ec_phone:
                twilio_client = TwilioClient(TWILIO_SID, TWILIO_TOKEN)
                ec_msg = (f'<Response><Say voice="alice" language="en-IN">'
                          f'Emergency Alert. This is Sentinel Safety Network. '
                          f'Your contact has triggered an SOS emergency signal. '
                          f'Please check on them immediately.'
                          f'</Say></Response>')
                twilio_client.calls.create(to=ec_phone, from_=TWILIO_FROM, twiml=ec_msg)
                print(f"Emergency contact called: {ec_name} at {ec_phone}")
    except Exception as e:
        print(f"Emergency contact call error: {e}")

    return incident_data

def _haversine(lat1, lng1, lat2, lng2) -> float:
    """Returns distance in km between two coordinates."""
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng/2)**2
    return R * 2 * math.asin(math.sqrt(a))

@app.post("/guardian/register")
def register_guardian(
    data: schemas.GuardianRegister,
    current_user: dict = Depends(auth.get_current_user)
):
    """Register or update current user as a guardian with their location."""
    db = database.get_db()
    guardians_ref = db.collection("guardians")
    # Check if already registered, update if so
    existing = guardians_ref.where("user_id", "==", current_user["id"]).limit(1).get()
    guardian_data = {
        "user_id": current_user["id"],
        "address": data.address,
        "lat": data.lat,
        "lng": data.lng,
        "phone": data.phone,
        "is_active": True,
    }
    if existing:
        doc_id = existing[0].id
        guardians_ref.document(doc_id).set(guardian_data)
        guardian_data["id"] = doc_id
    else:
        _, doc_ref = guardians_ref.add(guardian_data)
        guardian_data["id"] = doc_ref.id
    return {"status": "registered", **guardian_data}

@app.get("/guardian/profile")
def get_guardian_profile(current_user: dict = Depends(auth.get_current_user)):
    """Get the current guardian's registered profile."""
    db = database.get_db()
    docs = db.collection("guardians").where("user_id", "==", current_user["id"]).limit(1).get()
    if not docs:
        return {"registered": False}
    g = docs[0].to_dict()
    g["id"] = docs[0].id
    g["registered"] = True
    return g

@app.patch("/guardian/deactivate")
def deactivate_guardian(current_user: dict = Depends(auth.get_current_user)):
    """Go off-duty — stop receiving proximity alerts."""
    db = database.get_db()
    docs = db.collection("guardians").where("user_id", "==", current_user["id"]).limit(1).get()
    if docs:
        db.collection("guardians").document(docs[0].id).update({"is_active": False})
    return {"status": "deactivated"}

@app.patch("/incidents/{incident_id}", response_model=schemas.IncidentResponse)
def update_incident_status(
    incident_id: str,
    incident_update: schemas.IncidentUpdate,
    current_user: dict = Depends(auth.get_current_user)
):
    if current_user["role"] != models.UserRole.AUTHORITY:
        raise HTTPException(status_code=403, detail="Only authorities can resolve incidents")
    
    incident_ref = database.get_db().collection("incidents").document(incident_id)
    doc = incident_ref.get()
    
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    incident_ref.update({"status": incident_update.status})
    updated_data = doc.to_dict()
    updated_data["status"] = incident_update.status
    updated_data["id"] = doc.id
    return updated_data

@app.post("/incidents/{incident_id}/acknowledge", response_model=schemas.IncidentResponse)
def acknowledge_incident(
    incident_id: str,
    current_user: dict = Depends(auth.get_current_user)
):
    if current_user["role"] not in [models.UserRole.GUARDIAN, models.UserRole.AUTHORITY]:
        raise HTTPException(status_code=403, detail="Only Guardians or Authorities can respond")
    
    incident_ref = database.get_db().collection("incidents").document(incident_id)
    doc = incident_ref.get()
    
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    incident_data = doc.to_dict()
    if incident_data.get("status") != "Active":
        raise HTTPException(status_code=400, detail="Incident is already being handled or resolved")

    update_payload = {
        "status": "Responding",
        "responder_id": current_user["id"],
        "responder_name": current_user["username"]
    }
    
    incident_ref.update(update_payload)
    
    incident_data.update(update_payload)
    incident_data["id"] = doc.id
    return incident_data

@app.get("/incidents", response_model=List[schemas.IncidentResponse])
def get_incidents():
    incidents_ref = database.get_db().collection("incidents")
    docs = incidents_ref.order_by("timestamp", direction="DESCENDING").stream()
    
    incidents = []
    for doc in docs:
        data = doc.to_dict()
        data["id"] = doc.id
        incidents.append(data)
    return incidents

@app.post("/resources", response_model=schemas.ResourceResponse)
def create_resource(
    resource: schemas.ResourceCreate,
    current_user: dict = Depends(auth.get_current_user)
):
    if current_user["role"] != models.UserRole.AUTHORITY:
        raise HTTPException(status_code=403, detail="Only authorities can manage resources")
    
    resources_ref = database.get_db().collection("resources")
    resource_data = resource.dict()
    resource_data["created_at"] = datetime.utcnow()
    
    update_time, doc_ref = resources_ref.add(resource_data)
    resource_data["id"] = doc_ref.id
    return resource_data

@app.get("/resources", response_model=List[schemas.ResourceResponse])
def get_resources():
    resources_ref = database.get_db().collection("resources")
    docs = resources_ref.order_by("created_at", direction="DESCENDING").stream()
    
    resources = []
    for doc in docs:
        data = doc.to_dict()
        data["id"] = doc.id
        resources.append(data)
    return resources

@app.delete("/resources/{resource_id}")
def delete_resource(
    resource_id: str,
    current_user: dict = Depends(auth.get_current_user)
):
    if current_user["role"] != models.UserRole.AUTHORITY:
        raise HTTPException(status_code=403, detail="Only authorities can manage resources")
    
    resource_ref = database.get_db().collection("resources").document(resource_id)
    if not resource_ref.get().exists:
        raise HTTPException(status_code=404, detail="Resource not found")
    
    resource_ref.delete()
    return {"detail": "Resource deleted"}

@app.get("/auth/me", response_model=schemas.UserResponse)
def get_me(current_user: dict = Depends(auth.get_current_user)):
    return current_user

@app.post("/navigation/safest-route", response_model=schemas.NavigationResponse)
def get_safest_route(
    nav: schemas.NavigationRequest,
    current_user: dict = Depends(auth.get_current_user)
):
    # Destination coordinates
    dest_lat = nav.dest_lat if nav.dest_lat is not None else nav.current_lat + 0.01
    dest_lng = nav.dest_lng if nav.dest_lng is not None else nav.current_lng + 0.01

    # Fetch historical incidents to avoid
    incidents_ref = database.get_db().collection("incidents")
    docs = incidents_ref.limit(50).stream()
    
    hazards = []
    for doc in docs:
        data = doc.to_dict()
        hazards.append({"lat": data["lat"], "lng": data["lng"], "type": data.get("type")})

    # Call OSRM Walking API for real-world path
    # Endpoint: http://router.project-osrm.org/route/v1/walking/lng,lat;lng,lat
    path = []
    warnings = []
    try:
        url = f"http://router.project-osrm.org/route/v1/walking/{nav.current_lng},{nav.current_lat};{dest_lng},{dest_lat}?overview=full&geometries=geojson"
        response = httpx.get(url, timeout=5.0)
        if response.status_code == 200:
            data = response.json()
            if data.get("routes"):
                # OSRM returns [lng, lat], we need [lat, lng] for Leaflet
                coords = data["routes"][0]["geometry"]["coordinates"]
                path = [[c[1], c[0]] for c in coords]
    except Exception as e:
        print(f"OSRM Error: {e}")

    # Fallback if OSRM fails or returns nothing
    if not path:
        path = [
            [nav.current_lat, nav.current_lng],
            [(nav.current_lat + dest_lat) / 2, (nav.current_lng + dest_lng) / 2],
            [dest_lat, dest_lng]
        ]
        warnings.append("Using direct line - street data unavailable.")

    # Safety Analysis: Check proximity of Hazards to path points
    min_dist_to_hazard = 1.0 # Large initial value
    detected_types = set()

    for p in path:
        for h in hazards:
            dist = math.sqrt((p[0] - h["lat"])**2 + (p[1] - h["lng"])**2)
            if dist < 0.002: # Proximity threshold (approx 200m)
                detected_types.add(h.get("type", "UNKNOWN"))
            min_dist_to_hazard = min(min_dist_to_hazard, dist)
    
    for t in detected_types:
        warnings.append(f"Historical {t} detected near route. Exercise caution.")

    # Calculate Safety Score
    # Simple logic: 100 base, -15 per hazard type detected, floor at 40
    safety_score = max(40, 100 - (len(detected_types) * 15))
    if not path: safety_score = 0

    return {
        "path": path,
        "safety_score": float(safety_score),
        "warnings": warnings or ["Route verified clean."]
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
