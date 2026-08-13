# n8n Automation Engine Integration - AgriMind AI

AgriMind AI features a dedicated automation integration layer, allowing external workflows to sync weather metrics, schedule tasks, compile daily briefings, and fire SMS notifications.

## Webhook Endpoint

- **Endpoint**: `POST /api/n8n/webhook`
- **Security**: The backend validates signature requests. Workflows must transmit the secret key via headers:
  - Header Name: `x-n8n-secret`
  - Expected Value: Set by environment variable `N8N_WEBHOOK_SECRET` (defaults to `n8n-webhook-passkey` for MVP sandbox).

---

## Supported Event Flows

### 1. Weather Update Sync (`weather_update`)
- Triggered by n8n when pulling current weather from OpenWeatherMap or localized weather APIs.
- **Payload**:
  ```json
  {
    "eventType": "weather_update",
    "farmId": "farm_green_valley",
    "data": {
      "temperature": 32.5,
      "humidity": 65.0,
      "rainProbability": 20.0,
      "conditions": "Partly Cloudy"
    }
  }
  ```
- **Backend Effect**: Updates weather readings inside the database, triggering recalculation of irrigation recommendations on the next dashboard load.

### 2. Daily Health Briefing (`daily_briefing_trigger`)
- Scheduled by n8n (e.g. at 6:00 AM every morning).
- **Payload**:
  ```json
  {
    "eventType": "daily_briefing_trigger",
    "farmId": "farm_green_valley"
  }
  ```
- **Backend Effect**: Generates a system health checklist log, checks tasks for the day, and compiles warning indicators in the Alert Center.

---

## n8n Workflow Template Structure

For production deployment, create a master orchestrator workflow:

```text
[Cron Node (6:00 AM)] ──> [HTTP Request (Weather API)] ──> [AgriMind Webhook (/api/n8n/webhook)]
                                                                  │
                                                                  ▼
                                                      [Send WhatsApp Briefing]
```
If n8n is unavailable or offline, AgriMind AI falls back to its internal scheduler, ensuring the application remains 100% functional.
