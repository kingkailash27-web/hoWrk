from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from models import UserRole

class UserBase(BaseModel):
    username: str
    email: EmailStr
    role: UserRole = UserRole.CITIZEN

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class IncidentBase(BaseModel):
    type: str
    lat: float
    lng: float
    status: str = "Active"

class IncidentCreate(IncidentBase):
    pass

class IncidentUpdate(BaseModel):
    status: str

class IncidentResponse(IncidentBase):
    id: str
    timestamp: datetime
    reporter_id: str
    responder_id: Optional[str] = None
    responder_name: Optional[str] = None

class ResourceBase(BaseModel):
    type: str
    lat: float
    lng: float
    description: Optional[str] = None

class ResourceCreate(ResourceBase):
    pass

class ResourceResponse(ResourceBase):
    id: str
    created_at: datetime

class NavigationRequest(BaseModel):
    destination: str
    current_lat: float
    current_lng: float
    dest_lat: Optional[float] = None
    dest_lng: Optional[float] = None

class NavigationResponse(BaseModel):
    path: List[List[float]]
    safety_score: float
    warnings: List[str]

class GuardianRegister(BaseModel):
    address: str
    lat: float
    lng: float
    phone: str

class GuardianResponse(GuardianRegister):
    id: str
    user_id: str
    is_active: bool = True

class EmergencyContact(BaseModel):
    name: str
    relationship: str
    phone: str

class EmergencyContactResponse(EmergencyContact):
    id: str
    user_id: str
