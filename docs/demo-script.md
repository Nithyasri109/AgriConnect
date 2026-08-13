# Judges Presentation Script - AgriMind AI

Follow this exact walkthrough during the hackathon/judging session to showcase the unique decision support workflows of AgriMind AI.

## STEP 1: Overview Dashboard
- **Action**: Open `http://localhost:5174` (or `5173`). On the landing page, click **Explore Demo Platform**.
- **Demonstrate**: 
  - Show the **Farm Health Index (84/100)** card. Click the link *"Why is my score 84?"* to explain how low soil moisture in Field A and active whitefly alerts are pulling it down.
  - Highlight the **Smart Water Saved (4,250 Liters)** card demonstrating resource conservation.

---

## STEP 2: What Should I Do Today?
- **Action**: Click the **"What Should I Do Today?"** tab in the left sidebar.
- **Demonstrate**:
  - Show the ranked cards:
    1. 🔴 **Water Field A** (Tomatoes) - moisture is at 28%.
    2. 🟠 **Inspect Tomato Leaves** - high temperature and humidity raise Whitefly risk.
    3. 🟡 **Phosphorus Fertilizer Review** - scheduled for tomorrow.
  - Point out that each card lists the **Why**, the **expected benefit**, and **engine confidence** (87%+).

---

## STEP 3: Smart Farm Demo Simulation (Rain Delay & Water Saving)
- **Action**: Click on **Settings & Webhooks** tab in the sidebar. Click on the **1. Smart Farm Demo** button. An alert pops up; click OK to confirm.
- **Action**: Go back to the **Dashboard** tab.
- **Demonstrate**:
  - Point out the weather reads: rain probability is now **85%**.
  - Show that the main recommendation has updated dynamically from *"Irrigate Field A"* to **"Delay Irrigation (Tomatoes)"**.
  - Read the explainable reason: *"Soil moisture is low, but rain is expected. Conserving water."*
  - Look at **Water Saved**: It increased by 1,200 Liters, and Farm Health rose to **86%**.
  - Open **Alert Center**: A new alert tracks the rain override delay.

---

## STEP 4: AI Copilot Contextual Check
- **Action**: Click the floating green chat bubble in the bottom right corner to open the Copilot.
- **Action**: Click the first suggestion chip: *"Should I water my crop today?"*
- **Demonstrate**:
  - Show that the Copilot parses the live weather and moisture.
  - It advises to **delay irrigation** since rain probability is 85%, explaining why directly from the DB telemetry.
- **Action**: Click the **"தமிழ்"** language toggle at the top of the chat panel. Click the Tamil chip: *"இன்று நான் தண்ணீர் பாய்ச்ச வேண்டுமா?"*.
- **Demonstrate**:
  - The AI Copilot translates the advice into clear, actionable, and friendly Tamil.

---

## STEP 5: Closed-Loop Loopback
- **Action**: On the Dashboard, find the active recommendation card. Click the **Accept** button.
- **Demonstrate**:
  - The feedback state is recorded.
  - Open **Closed-Loop History** tab: Show that the pie chart has logged the acceptance rate, illustrating the platform's self-improvement loop metrics.
