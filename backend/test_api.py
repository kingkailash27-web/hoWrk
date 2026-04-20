import requests
import json

BASE_URL = "http://localhost:8000"

def test_api():
    # 1. Register
    reg_data = {
        "username": "testuser",
        "email": "test@example.com",
        "password": "password123",
        "role": "Citizen"
    }
    print(f"Registering user: {reg_data['username']}...")
    try:
        r = requests.post(f"{BASE_URL}/auth/register", json=reg_data)
        print(f"Register Status: {r.status_code}")
        print(f"Register Response: {r.text}")
    except Exception as e:
        print(f"Register Error: {e}")

    # 2. Login
    print("Logging in...")
    try:
        r = requests.post(f"{BASE_URL}/auth/login", json=reg_data)
        print(f"Login Status: {r.status_code}")
        login_resp = r.json()
        token = login_resp.get("access_token")
        print(f"Token received: {token[:10]}...")
        return token
    except Exception as e:
        print(f"Login Error: {e}")
    return None

def test_incident(token):
    if not token:
        return
    
    headers = {"Authorization": f"Bearer {token}"}
    incident_data = {
        "type": "TEST_INCIDENT",
        "lat": 12.9716,
        "lng": 77.5946
    }
    print("Reporting incident...")
    try:
        r = requests.post(f"{BASE_URL}/incidents/report", json=incident_data, headers=headers)
        print(f"Incident Status: {r.status_code}")
        print(f"Incident Response: {r.text}")
    except Exception as e:
        print(f"Incident Error: {e}")

if __name__ == "__main__":
    token = test_api()
    test_incident(token)
