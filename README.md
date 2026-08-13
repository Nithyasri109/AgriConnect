# AgriMind AI - Smart Agriculture Decision Support Platform

### Problem Statement ID: PS26SAT013 | Theme: Smart Agriculture | Team: SheCodes

AgriMind AI is an AI-powered agricultural technology platform designed to **convert raw farm telemetry (weather, soil conditions, crop cycles, activity history) into simple, explainable, and actionable decisions for farmers.**

Instead of displaying disconnected charts or simple alerts, AgriMind AI operates as an **AI Farm Decision Engine**, directly answering the core farmer question: **"What should I do on my farm right now?"**

---

## 🚀 Key Unique Features

1. **"What Should I Do Today?" Prioritizer**: An aggregated feed compiling weather forecasts, soil moisture indices, calendar tasks, and active pest models to rank the farmer's top 3-5 daily actions with explicit priorities, reasons, and benefits.
2. **Farm Health Score (0-100)**: A single unified rating tracking overall farm health. The score is fully explainable, breaking down the exact impact of soil chemistry deficits, hydration status, crop vigor, and pest activity.
3. **Explainable AI (XAI)**: Every recommendation documents the *What, Why, When, How, expected benefit, and model confidence*, building transparency and trust.
4. **Closed-Loop Farm Intelligence**: Links recommendations to direct farmer action logs (`[Accepted]`, `[Skipped]`, `[Modified]`, `[Not Needed]`). Feedback history is tracked to optimize future recommendation weights.
5. **Smart Water Saving (Water Intelligence)**: Measures and quantifies total water used, water saved, and irrigation efficiency. Scheduled cycles are suspended automatically if significant rainfall is forecast.
6. **Sustainability Index (0-100)**: Encourages eco-friendly operations, rating water efficiency, nutrient balancing, and crop diversity.

---

## 🛠️ Technology Stack

- **Frontend**: React (v18), TypeScript, Vite, Tailwind CSS (v3), Lucide Icons, Recharts (Data Visualizations).
- **Backend**: Node.js, Express, TypeScript, SQLite3 (embedded SQL engine for local sandbox execution, fully structured for PostgreSQL compatibility).
- **AI/LLM**: Google Gemini API (with robust local rule-based context-aware fallbacks for offline demo safety).
- **Automation**: n8n-ready secure webhook endpoints.

---

## 📂 Project Architecture

```text
/
├── backend/                  # Node.js + Express + TS Backend
│   ├── src/
│   │   ├── controllers/      # Route controllers (Auth, Dashboard, Farms, etc.)
│   │   ├── services/         # Decision Engine, LLM service, ML interfaces
│   │   ├── database/         # SQLite3 setup & seed script
│   │   ├── config/           # App configuration & rule thresholds
│   │   ├── middleware/       # JWT Auth verification
│   │   └── app.ts            # Entrypoint
│   └── tsconfig.json
├── frontend/                 # React + TypeScript + Vite Frontend
│   ├── src/
│   │   ├── components/       # Shared UI (Floating Copilot, Layout, Charts)
│   │   ├── pages/            # 23 functional module views integrated into tabbed portal
│   │   ├── context/          # FarmContext state provider
│   │   ├── App.tsx           # Dashboard tabs container & interactive sliders
│   │   └── index.css         # Glassmorphism visual tokens & Tailwind imports
│   └── tsconfig.json
└── README.md                 # Project README
```

---

## 🏁 How to Run Locally

### 1. Prerequisites
- **Node.js** v20+ or v24+
- **npm** v10+

### 2. Clone and Install Dependencies
Install all package dependencies in root, backend, and frontend folders:
```bash
npm run install:all
```

### 3. Configure Environment Variables (Optional)
Create a `.env` file in the `backend/` directory to customize variables:
```env
PORT=3000
JWT_SECRET=agrimind-secret-key-12345
GEMINI_API_KEY=your_gemini_api_key_here
N8N_WEBHOOK_SECRET=n8n-webhook-passkey
```
*Note: If no `GEMINI_API_KEY` is provided, the platform automatically triggers a rich, context-aware rule-based AI simulation in English/Tamil.*

### 4. Start Development Servers
Run the full-stack system concurrently:
```bash
npm run dev
```
- **Frontend** will be served at: `http://localhost:5174` (or `5173` if unoccupied).
- **Backend API** will listen on: `http://localhost:3000`.

### 5. Demo Credentials
Log in instantly using the seeded demo farmer account:
- **Email**: `demo@agrimind.ai`
- **Password**: `farmer123`
*(Or click **Explore Demo Platform** on the landing page to bypass typing.)*

---

## 🧠 ML-Ready Interface Architecture

AgriMind AI is built to connect predictive Machine Learning models without rewriting frontend logic. In `backend/src/services/predictionServices.ts`, we expose standard TS interfaces:

- `ICropPredictionService`
- `IDiseasePredictionService`
- `IYieldPredictionService`
- `IIrrigationPredictionService`
- `IPestPredictionService`

The application initializes with `RuleBasedPredictionService` or `DemoPredictionService` fallbacks. When training is complete, simply subclass the interfaces (e.g., `TensorFlowPredictionService`) and swap the instantiation:

```typescript
// backend/src/app.ts
// Replace rule fallback with full ML service
// const irrigationService = new RuleBasedIrrigationService();
const irrigationService = new MLIrrigationPredictionService(); 
```
The frontend consumes the exact same JSON format, ensuring clean decoupling.
