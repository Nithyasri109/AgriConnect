# API Specification - AgriMind AI

AgriMind AI exposes a RESTful JSON API. All routes require a JWT token in the `Authorization` header (`Bearer <token>`) except for Authentication.

## Authentication Endpoints

### 1. Register User
- **Route**: `POST /api/auth/register`
- **Body**:
  ```json
  {
    "name": "Demo Farmer",
    "email": "demo@agrimind.ai",
    "password": "farmer123"
  }
  ```
- **Response**: `200 OK` with JSON web token and user profile.

### 2. Login User
- **Route**: `POST /api/auth/login`
- **Body**:
  ```json
  {
    "email": "demo@agrimind.ai",
    "password": "farmer123"
  }
  ```

---

## Farm Operations

### 3. Fetch Dashboard Telemetry
- **Route**: `GET /api/dashboard`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: Returns farm metadata, fields, latest soil and weather readings, health scores, pending tasks, alerts, water intelligence, and n8n/database connection statuses.

### 4. Create Farm
- **Route**: `POST /api/farms`
- **Body**:
  ```json
  {
    "name": "Green Valley Farm",
    "location": "Coimbatore, Tamil Nadu",
    "area": 12.5,
    "soilType": "Clay Loam",
    "irrigationType": "Drip Irrigation",
    "waterSource": "Borewell"
  }
  ```

---

## Intelligence & Decisions

### 5. Run Irrigation Analysis
- **Route**: `POST /api/irrigation/analyze`
- **Body**: `{ "fieldId": "field_a" }`
- **Response**:
  ```json
  {
    "irrigationRecommended": true,
    "waterRequiredLiters": 1200,
    "confidence": 0.95,
    "reason": "Soil moisture (25%) is below threshold...",
    "expectedBenefit": "Supports crop transition...",
    "dataUsed": ["soil_moisture", "rain_probability"]
  }
  ```

### 6. Submit Recommendation Feedback (Closed-Loop)
- **Route**: `POST /api/recommendations/:id/feedback`
- **Body**:
  ```json
  {
    "action": "Accepted",
    "comment": "Watering logged."
  }
  ```

### 7. AI Copilot Chat Node
- **Route**: `POST /api/ai/chat`
- **Body**:
  ```json
  {
    "question": "Should I water field A?",
    "language": "en"
  }
  ```
- **Response**: `{ "answer": "Yes, irrigation is recommended..." }`

---

## Simulations

### 8. Run Demo Sequence
- **Route**: `POST /api/demo/run`
- **Body**: `{ "scenario": "smart-farm" }` // Options: 'smart-farm', 'disease', 'soil', 'reset'
- **Response**: `{ "success": true, ... }`
