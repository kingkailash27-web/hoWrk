import enum

class UserRole(str, enum.Enum):
    CITIZEN = "Citizen"
    GUARDIAN = "Guardian"
    AUTHORITY = "Authority"

# These classes are now just for reference or type hinting
# Firestore will store these as plain documents
class User:
    collection = "users"

class Incident:
    collection = "incidents"

class Resource:
    collection = "resources"
