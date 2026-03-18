# Assetra API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication
Most endpoints require JWT token in Authorization header:
```
Authorization: Bearer <token>
```

---

## Authentication Endpoints

### POST /api/auth/signup
Register a new user account.

**Request Body:**
```json
{
  "username": "string",
  "password": "string",
  "full_name": "string",
  "email": "string",
  "role": "Admin | Manager",
  "department": "IT | Operations | Finance | HR | Sales | Marketing",
  "passkey": "assetra2024"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "userId": 1
}
```

### POST /api/auth/login
Login to get JWT token.

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "jwt_token_here",
  "user": {
    "user_id": 1,
    "username": "string",
    "full_name": "string",
    "email": "string",
    "role": "Admin",
    "department": "IT"
  }
}
```

### POST /api/auth/logout
Logout user (client-side token removal).

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

---

## Dashboard Endpoints

### GET /api/dashboard/stats
Get dashboard statistics and metrics.

**Auth Required:** Yes

**Response:**
```json
{
  "totalAssets": 150,
  "totalUsers": 25,
  "missingAssets": 3,
  "maintenanceAssets": 8,
  "assetsByStatus": {
    "Available": 89,
    "Allocated": 50,
    "Maintenance": 8,
    "Missing": 3
  },
  "department": "IT"
}
```

**Notes:**
- Admins see all departments
- Managers see only their department

---

## Asset Endpoints

### GET /api/assets
Get list of all assets.

**Auth Required:** Yes

**Response:**
```json
[
  {
    "asset_id": 1,
    "asset_tag": "LAP001",
    "asset_name": "HP Laptop",
    "category": "Electronics",
    "description": "HP EliteBook 840",
    "purchase_date": "2024-01-15",
    "purchase_cost": 75000.00,
    "status": "Allocated",
    "location": "Office Floor 2",
    "department": "IT",
    "created_at": "2024-01-15T10:30:00",
    "maintenance_cost": 0.00,
    "salvage_value": 15000.00,
    "useful_life_years": 5
  }
]
```

**Notes:**
- Admins see all assets
- Managers see only their department's assets

### POST /api/assets
Create a new asset.

**Auth Required:** Yes

**Request Body:**
```json
{
  "asset_tag": "LAP001",
  "asset_name": "HP Laptop",
  "category": "Electronics",
  "description": "HP EliteBook 840",
  "purchase_date": "2024-01-15",
  "purchase_cost": 75000.00,
  "status": "Available",
  "location": "Office Floor 2",
  "department": "IT"
}
```

**Response:**
```json
{
  "message": "Asset created successfully",
  "assetId": 1
}
```

### PATCH /api/assets/:id/status
Update asset status.

**Auth Required:** Yes

**Request Body:**
```json
{
  "status": "Available | Allocated | Maintenance | Missing"
}
```

**Response:**
```json
{
  "message": "Asset status updated successfully"
}
```

---

## Role-Based Access

### Admin Role
- Can view all departments
- Can manage all assets
- Can access Settings page
- Full system access

### Manager Role
- Can view only their department
- Can manage only their department's assets
- Cannot access Settings page
- Department-restricted access

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Validation error message"
}
```

### 401 Unauthorized
```json
{
  "error": "No token provided" | "Invalid token"
}
```

### 403 Forbidden
```json
{
  "error": "Access denied"
}
```

### 500 Internal Server Error
```json
{
  "error": "Error message with details"
}
```
