# API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
All endpoints except login/register require JWT token in header:
```
Authorization: Bearer <token>
```

---

## Authentication Endpoints

### 1. User Registration
```
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "fullName": "John Doe",
  "userType": "shipper",
  "phone": "+91-9876543210"
}

Response (201):
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "fullName": "John Doe",
    "userType": "shipper"
  }
}
```

### 2. User Login
```
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}

Response (200):
{
  "success": true,
  "token": "eyJhbGc...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "fullName": "John Doe",
    "userType": "shipper"
  }
}
```

### 3. Password Reset
```
POST /auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}

Response (200):
{
  "success": true,
  "message": "Reset email sent"
}
```

---

## Shipment Endpoints (Shipper)

### 1. Create Shipment
```
POST /shipments
Authorization: Bearer <token>
Content-Type: application/json

{
  "pickupLocation": "Mumbai, Maharashtra",
  "deliveryLocation": "Delhi, Delhi",
  "weight": 500,
  "dimensions": {
    "length": 100,
    "width": 50,
    "height": 50
  },
  "cargoType": "Electronics",
  "specialInstructions": "Handle with care",
  "pickupDate": "2024-04-15",
  "estimatedDeliveryDays": 3
}

Response (201):
{
  "success": true,
  "shipment": {
    "id": 1,
    "shipper_id": 1,
    "status": "pending",
    "price": 2500,
    "createdAt": "2024-04-07T10:30:00Z"
  }
}
```

### 2. Get All Shipments
```
GET /shipments?status=pending&page=1&limit=10
Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "count": 5,
  "shipments": [...]
}
```

### 3. Get Shipment by ID
```
GET /shipments/:id
Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "shipment": { ... }
}
```

### 4. Update Shipment
```
PATCH /shipments/:id
Authorization: Bearer <token>

{
  "specialInstructions": "Updated instructions"
}
```

### 5. Delete Shipment
```
DELETE /shipments/:id
Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "message": "Shipment deleted"
}
```

---

## Booking Endpoints (Carrier)

### 1. Accept Booking
```
POST /bookings/:shipmentId/accept
Authorization: Bearer <token>

Response (201):
{
  "success": true,
  "booking": {
    "id": 1,
    "shipment_id": 1,
    "carrier_id": 2,
    "status": "accepted",
    "createdAt": "2024-04-07T10:35:00Z"
  }
}
```

### 2. Get My Bookings
```
GET /bookings/my-bookings?status=accepted
Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "bookings": [ ... ]
}
```

### 3. Decline Booking
```
POST /bookings/:shipmentId/decline
Authorization: Bearer <token>

{
  "reason": "Vehicle unavailable"
}
```

---

## Tracking Endpoints

### 1. Update Tracking Location
```
POST /tracking/:bookingId/location
Authorization: Bearer <token>
Content-Type: application/json

{
  "latitude": 28.6139,
  "longitude": 77.2090,
  "status": "in_transit"
}

Response (200):
{
  "success": true,
  "tracking": { ... }
}
```

### 2. Get Tracking Information
```
GET /tracking/:bookingId
Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "tracking": {
    "currentLocation": { ... },
    "history": [ ... ],
    "estimatedDelivery": "2024-04-15T18:00:00Z"
  }
}
```

---

## Review Endpoints

### 1. Submit Review
```
POST /reviews
Authorization: Bearer <token>
Content-Type: application/json

{
  "bookingId": 1,
  "rating": 5,
  "comment": "Excellent service and timely delivery"
}

Response (201):
{
  "success": true,
  "review": { ... }
}
```

### 2. Get User Reviews
```
GET /reviews/user/:userId
Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "reviews": [ ... ],
  "averageRating": 4.8
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": {
    "status": 400,
    "message": "Invalid input data"
  }
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": {
    "status": 401,
    "message": "Invalid or expired token"
  }
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": {
    "status": 403,
    "message": "You don't have permission"
  }
}
```

### 500 Server Error
```json
{
  "success": false,
  "error": {
    "status": 500,
    "message": "Internal server error"
  }
}
```

---

## Rate Limiting
- 100 requests per 15 minutes per IP
- 1000 requests per hour per authenticated user

## Pagination
Default limit: 10, Maximum limit: 100
```
GET /shipments?page=1&limit=20
```

---

See Postman collection for interactive testing.