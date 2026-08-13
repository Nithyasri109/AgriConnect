# Database Architecture - AgriMind AI

AgriMind AI implements a normalized relational database schema. For local sandbox execution and ease of installation, we use an embedded SQLite3 instance (`backend/src/database/agrimind.sqlite`) with standard ANSI SQL queries that are 100% compatible with a production PostgreSQL database.

## Relational Tables

### 1. User Management (`users`)
- `id` (TEXT, PK): Unique identifier.
- `name` (TEXT): Farmer name.
- `email` (TEXT, UNIQUE): Access email.
- `password` (TEXT): Bcrypt-hashed password.
- `created_at` (TIMESTAMP): Date registered.

### 2. Farms (`farms`)
- `id` (TEXT, PK): Farm identifier.
- `user_id` (TEXT, FK): Link to `users.id`.
- `name` (TEXT): Farm name (e.g. Green Valley Farm).
- `location` (TEXT): Coordinates / location.
- `area` (REAL): Total acreage.
- `soil_type` (TEXT): Default clay, sandy loam.
- `irrigation_type` (TEXT): Drip, sprinkler.
- `water_source` (TEXT): Borewell, canal.

### 3. Fields (`fields`)
- `id` (TEXT, PK): Field identifier.
- `farm_id` (TEXT, FK): Link to `farms.id`.
- `name` (TEXT): Field name (e.g. Field A).
- `area` (REAL): Field acreage.

### 4. Crops (`crops`)
- `id` (TEXT, PK): Crop identifier.
- `field_id` (TEXT, FK): Link to `fields.id`.
- `name` (TEXT): Crop name (e.g. Tomato).
- `variety` (TEXT): Plant strain (e.g. Arka Rakshak).
- `planting_date` (TEXT): Date seeded.
- `expected_harvest` (TEXT): Estimated harvest date.
- `growth_stage` (TEXT): Seedling, Vegetative, Flowering, Fruiting, Maturity, Harvest.
- `area` (REAL): Acreage planted.
- `water_requirement` (INTEGER): Baseline water recommendation per day (Liters).

### 5. Telemetry & Ratings
- `soil_readings`: Moisture (%), Nitrogen (N), Phosphorus (P), Potassium (K), pH, temperature, field link.
- `weather_readings`: Temperature, humidity, rain probability, wind speed, condition text, field link.
- `irrigation_records`: Water amount, water saved (Liters), irrigation type, field link.
- `crop_health`: Vigor health score, observations, risk tags.
- `disease_predictions`: Pathogen detection name, severity level, model confidence, symptoms description, mitigation action, crop link.
- `pest_risks`: Pest name, risk level, treatment actions.
- `fertilizer_records`: Nitrogen/Phosphorus/Potassium statuses and recommendations.

### 6. Closed-Loop Engine
- `recommendations`: Aggregated proposal text, reason, confidence, benefit, parameters analyzed, priority level.
- `recommendation_feedback`: Recommendation link, action taken (`Accepted`, `Skipped`, `Modified`), comment.
- `tasks`: Title, type, due date, status (`Pending`, `Completed`, `Skipped`), priority level.
- `alerts`: Category (Irrigation, Weather, etc.), severity, title, content message, read status.
- `farm_health_scores` & `sustainability_scores`: Score values and subweights tracking daily scores.
