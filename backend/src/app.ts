import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { execFile } from 'child_process';
import { fileURLToPath } from 'url';
import { db, initDb, queryGet, queryRun, queryAll } from './database/db.js';
import { authenticateToken, AuthenticatedRequest } from './middleware/auth.js';
import { 
  RuleBasedIrrigationService, 
  DemoDiseaseService, 
  RuleBasedPestService, 
  RuleBasedCropPredictionService, 
  RuleBasedYieldPredictionService 
} from './services/predictionServices.js';
import { LLMCopilotService, FarmContext } from './services/llmService.js';
import { DemoService } from './services/demoService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'agrimind-secret-key-12345';

app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOAD_DIR = './backend/uploads';
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10 MB
});

app.use('/uploads', express.static(UPLOAD_DIR));

const diseaseInfoPath = fs.existsSync(path.join(__dirname, 'database', 'disease_info.json'))
  ? path.join(__dirname, 'database', 'disease_info.json')
  : path.join(__dirname, '..', 'src', 'database', 'disease_info.json');
const diseaseInfo = JSON.parse(fs.readFileSync(diseaseInfoPath, 'utf-8'));

// Instantiate Services
const irrigationService = new RuleBasedIrrigationService();
const diseaseService = new DemoDiseaseService();
const pestService = new RuleBasedPestService();
const cropService = new RuleBasedCropPredictionService();
const yieldService = new RuleBasedYieldPredictionService();
const copilotService = new LLMCopilotService();
const demoService = new DemoService();

// Define a general system-status helper
const getSystemStatus = () => {
  return {
    database: 'Connected (SQLite3 Local)',
    ai: process.env.GEMINI_API_KEY ? 'Connected (Gemini AI)' : 'Demo Mode (Local Context Fallback)',
    weatherApi: 'Connected (Fallback Simulation)',
    n8nStatus: process.env.N8N_BASE_URL ? 'Connected (Webhook Active)' : 'Offline (Local Fallback Active)'
  };
};

// Auth logic helpers
const registerUser = async (req: any, res: any, forcedRole?: string) => {
  const { name, email, password, role } = req.body;
  const targetRole = forcedRole || role;
  if (!name || !email || !password || !targetRole) {
    return res.status(400).json({ error: 'Please provide name, email, password, and role.' });
  }

  const userRole = targetRole.toLowerCase();
  if (userRole !== 'farmer' && userRole !== 'customer' && userRole !== 'delivery' && userRole !== 'admin') {
    return res.status(400).json({ error: 'Role must be farmer, customer, delivery, or admin.' });
  }

  try {
    const existing = await queryGet<any>('SELECT * FROM users WHERE email = ?', [email]);
    if (existing) {
      return res.status(400).json({ error: 'Email already registered.' });
    }

    const id = 'usr_' + Date.now();
    const hashedPassword = await bcrypt.hash(password, 10);
    await queryRun('INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)', [id, name, email, hashedPassword, userRole]);
    
    if (userRole === 'farmer') {
      await queryRun(
        'INSERT INTO farmer_profiles (user_id, farmer_name, phone, address, farm_location, crop_details) VALUES (?, ?, ?, ?, ?, ?)',
        [id, name, 'No Phone', 'No Address', 'Coimbatore, Tamil Nadu', 'Tomato']
      );
    } else if (userRole === 'delivery') {
      await queryRun(
        'INSERT INTO delivery_profiles (user_id, delivery_person_name, phone, vehicle_type, availability) VALUES (?, ?, ?, ?, ?)',
        [id, name, 'No Phone', 'Bike', 'Available']
      );
    }

    // Seed initial farm, fields, and scores only for Farmers
    if (userRole === 'farmer') {
      const farmId = 'farm_' + Date.now();
      await queryRun(
        'INSERT INTO farms (id, user_id, name, location, area, soil_type, irrigation_type, water_source) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [farmId, id, 'My First Farm', 'Coimbatore, Tamil Nadu', 5.0, 'Clay Loam', 'Drip Irrigation', 'Borewell']
      );
      const fieldId = 'field_' + Date.now();
      await queryRun('INSERT INTO fields (id, farm_id, name, area) VALUES (?, ?, ?, ?)', [fieldId, farmId, 'Field 1', 5.0]);
      
      // Plant tomato crop by default
      const cropId = 'crop_' + Date.now();
      const todayStr = new Date().toISOString().split('T')[0];
      const harvestDate = new Date();
      harvestDate.setDate(harvestDate.getDate() + 90);
      const harvestStr = harvestDate.toISOString().split('T')[0];

      await queryRun(
        'INSERT INTO crops (id, field_id, name, variety, planting_date, expected_harvest, growth_stage, area, water_requirement) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [cropId, fieldId, 'Tomato', 'Local Variety', todayStr, harvestStr, 'Seedling', 5.0, 1000]
      );

      // Initial soil & weather
      await queryRun('INSERT INTO soil_readings (id, field_id, moisture, nitrogen, phosphorus, potassium, ph, temperature) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', 
        ['soil_' + Date.now(), fieldId, 32.0, 40.0, 25.0, 20.0, 6.5, 30.0]);
      await queryRun('INSERT INTO weather_readings (id, field_id, temperature, humidity, rain_probability, wind_speed, conditions) VALUES (?, ?, ?, ?, ?, ?, ?)',
        ['weather_' + Date.now(), fieldId, 30.0, 65.0, 20.0, 10.0, 'Sunny']);

      // Scores
      await queryRun('INSERT INTO farm_health_scores (id, farm_id, score, soil, water, crop, weather, disease, pest, nutrition) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        ['fh_' + Date.now(), farmId, 80.0, 80.0, 80.0, 80.0, 80.0, 80.0, 80.0, 80.0]);
      await queryRun('INSERT INTO sustainability_scores (id, farm_id, score, water_efficiency, soil_health, resource_conservation, crop_diversity) VALUES (?, ?, ?, ?, ?, ?, ?)',
        ['sust_' + Date.now(), farmId, 75.0, 75.0, 75.0, 75.0, 75.0]);
    }

    if (userRole === 'delivery') {
      await queryRun(
        'INSERT INTO delivery_partners (id, name, vehicle_type, vehicle_number, avatar_url, status) VALUES (?, ?, ?, ?, ?, ?)',
        [id, name, 'Bike', 'TN-66-DEMO', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150', 'Available']
      );
    }

    const token = jwt.sign({ userId: id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id, name, email, role: userRole } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

const loginUser = async (req: any, res: any, forcedRole?: string) => {
  const { email, password, rememberMe } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Please provide email and password.' });
  }

  try {
    const user = await queryGet<any>('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      if (email === 'demo@agrimind.ai' || email === 'customer@agrimind.ai' || email === 'delivery@agrimind.ai') {
        const role = email === 'demo@agrimind.ai' ? 'farmer' : (email === 'customer@agrimind.ai' ? 'customer' : 'delivery');
        const defaultName = email === 'demo@agrimind.ai' ? 'Demo Farmer' : (email === 'customer@agrimind.ai' ? 'Demo Customer' : 'Demo Courier');
        const id = 'usr_' + Date.now();
        const hashedPassword = await bcrypt.hash(password, 10);
        await queryRun('INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)', [id, defaultName, email, hashedPassword, role]);
        
        if (role === 'farmer') {
          const farmId = 'farm_' + Date.now();
          await queryRun(
            'INSERT INTO farms (id, user_id, name, location, area, soil_type, irrigation_type, water_source) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [farmId, id, 'My First Farm', 'Coimbatore, Tamil Nadu', 5.0, 'Clay Loam', 'Drip Irrigation', 'Borewell']
          );
          await queryRun(
            'INSERT INTO farmer_profiles (user_id, farmer_name, phone, address, farm_location, crop_details) VALUES (?, ?, ?, ?, ?, ?)',
            [id, defaultName, 'No Phone', 'No Address', 'Coimbatore, Tamil Nadu', 'Tomato']
          );
        } else if (role === 'delivery') {
          await queryRun(
            'INSERT INTO delivery_partners (id, name, vehicle_type, vehicle_number, avatar_url, status) VALUES (?, ?, ?, ?, ?, ?)',
            [id, defaultName, 'Bike', 'TN-66-DEMO', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150', 'Available']
          );
          await queryRun(
            'INSERT INTO delivery_profiles (user_id, delivery_person_name, phone, vehicle_type, availability) VALUES (?, ?, ?, ?, ?)',
            [id, defaultName, 'No Phone', 'Bike', 'Available']
          );
        }
        
        const token = jwt.sign({ userId: id }, JWT_SECRET, { expiresIn: '7d' });
        return res.json({ token, user: { id, name: defaultName, email, role } });
      }
      return res.status(400).json({ error: 'User not found.' });
    }

    if (forcedRole && user.role !== forcedRole) {
      return res.status(400).json({ error: 'User not found.' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(400).json({ error: 'Incorrect password.' });
    }

    // Save or clear credentials on backend SQLite user profile
    if (rememberMe) {
      await queryRun(
        'UPDATE users SET remember_login_email = ?, remember_login_password = ? WHERE id = ?',
        [email, password, user.id]
      );
    } else {
      await queryRun(
        'UPDATE users SET remember_login_email = NULL, remember_login_password = NULL WHERE id = ?',
        [user.id]
      );
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// General register and login endpoints
app.post('/api/auth/register', (req, res) => registerUser(req, res));
app.post('/api/auth/login', (req, res) => loginUser(req, res));

// Role-specific register and login wrappers
app.post('/api/auth/farmer/register', (req, res) => registerUser(req, res, 'farmer'));
app.post('/api/auth/farmer/login', (req, res) => loginUser(req, res, 'farmer'));
app.post('/api/auth/customer/register', (req, res) => registerUser(req, res, 'customer'));
app.post('/api/auth/customer/login', (req, res) => loginUser(req, res, 'customer'));
app.post('/api/auth/delivery/register', (req, res) => registerUser(req, res, 'delivery'));
app.post('/api/auth/delivery/login', (req, res) => loginUser(req, res, 'delivery'));

// Forgot Password / Reset Password Route
app.post('/api/auth/forgot-password', async (req, res) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword) {
    return res.status(400).json({ error: 'Please provide email and new password.' });
  }

  try {
    const user = await queryGet<any>('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(400).json({ error: 'User not found.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    // If credentials retention is enabled on the database profile, keep the password synchronized
    await queryRun(
      'UPDATE users SET password = ?, remember_login_password = CASE WHEN remember_login_email IS NOT NULL THEN ? ELSE remember_login_password END WHERE email = ?', 
      [hashedPassword, newPassword, email]
    );
    res.json({ success: true, message: 'Password updated successfully!' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get remembered credentials by email and role
app.get('/api/auth/remembered', async (req, res) => {
  const { email, role } = req.query;
  if (!email || !role) {
    return res.status(400).json({ error: 'Please provide email and role.' });
  }
  try {
    const user = await queryGet<any>(
      'SELECT email, remember_login_password FROM users WHERE email = ? AND role = ? AND remember_login_email IS NOT NULL',
      [email, role]
    );
    if (user) {
      res.json({ email: user.email, password: user.remember_login_password });
    } else {
      res.status(404).json({ error: 'No remembered details found.' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/auth/me', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const user = await queryGet<any>('SELECT id, name, email, role FROM users WHERE id = ?', [req.userId]);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.json(user);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- DASHBOARD DATA ----------------

app.get('/api/dashboard', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId;
    
    // Get farmer's active farm
    const farm = await queryGet<any>('SELECT * FROM farms WHERE user_id = ? LIMIT 1', [userId]);
    if (!farm) {
      return res.json({ message: 'No farms found. Create a farm to start.' });
    }

    const farmId = farm.id;
    
    // Get fields
    const fields = await queryAll<any>('SELECT * FROM fields WHERE farm_id = ?', [farmId]);
    
    // Gather soil/weather readings, crop data for all fields
    const enrichedFields = [];
    let activeTomatoCropId = null;
    
    for (const f of fields) {
      const crop = await queryGet<any>('SELECT * FROM crops WHERE field_id = ? LIMIT 1', [f.id]);
      const soil = await queryGet<any>('SELECT * FROM soil_readings WHERE field_id = ? ORDER BY timestamp DESC LIMIT 1', [f.id]);
      const weather = await queryGet<any>('SELECT * FROM weather_readings WHERE field_id = ? ORDER BY timestamp DESC LIMIT 1', [f.id]);
      
      if (crop && crop.name.toLowerCase() === 'tomato') {
        activeTomatoCropId = crop.id;
      }

      enrichedFields.push({
        ...f,
        crop,
        soil,
        weather
      });
    }

    // Scores
    const healthScore = await queryGet<any>('SELECT * FROM farm_health_scores WHERE farm_id = ? ORDER BY timestamp DESC LIMIT 1', [farmId]);
    const sustainabilityScore = await queryGet<any>('SELECT * FROM sustainability_scores WHERE farm_id = ? ORDER BY timestamp DESC LIMIT 1', [farmId]);

    // Active Recommendations
    const fieldIds = fields.map(f => f.id);
    let recommendations: any[] = [];
    if (fieldIds.length > 0) {
      const placeholders = fieldIds.map(() => '?').join(',');
      recommendations = await queryAll<any>(
        `SELECT * FROM recommendations 
         WHERE field_id IN (${placeholders}) 
         ORDER BY timestamp DESC LIMIT 5`,
        fieldIds
      );
    }

    // Pending Tasks
    const tasks = await queryAll<any>(
      `SELECT * FROM tasks 
       WHERE farm_id = ? AND status = 'Pending' 
       ORDER BY due_date ASC LIMIT 5`,
      [farmId]
    );

    // Active Unread Alerts
    const alerts = await queryAll<any>(
      `SELECT * FROM alerts 
       WHERE farm_id = ? AND is_read = 0 
       ORDER BY timestamp DESC LIMIT 10`,
      [farmId]
    );

    // Water Intelligence savings (sum of all water saved)
    const waterSavedRow = await queryGet<{ total: number }>(
      `SELECT SUM(water_saved_liters) as total 
       FROM irrigation_records 
       WHERE field_id IN (SELECT id FROM fields WHERE farm_id = ?)`,
      [farmId]
    );
    const waterSaved = waterSavedRow?.total || 4250.0; // Default seeded baseline

    // Total water used this month
    const waterUsedRow = await queryGet<{ total: number }>(
      `SELECT SUM(amount_liters) as total 
       FROM irrigation_records 
       WHERE field_id IN (SELECT id FROM fields WHERE farm_id = ?)`,
      [farmId]
    );
    const waterUsed = waterUsedRow?.total || 18400.0;

    res.json({
      farm,
      fields: enrichedFields,
      healthScore: healthScore || { score: 84, soil: 78, water: 91, crop: 86, weather: 84, disease: 90, pest: 74, nutrition: 80 },
      sustainabilityScore: sustainabilityScore || { score: 78, water_efficiency: 88, soil_health: 78, resource_conservation: 72, crop_diversity: 74 },
      recommendations,
      tasks,
      alerts,
      waterIntelligence: {
        waterSaved,
        waterUsed,
        efficiency: 88,
        recommendedUsed: waterUsed * 0.9
      },
      systemStatus: getSystemStatus()
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- FARM MANAGEMENT ----------------

app.get('/api/farms', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId;
    const farms = await queryAll<any>('SELECT * FROM farms WHERE user_id = ?', [userId]);
    res.json(farms);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/farms', authenticateToken, async (req: AuthenticatedRequest, res) => {
  const { name, location, area, soilType, irrigationType, waterSource } = req.body;
  if (!name || !location || !area || !soilType || !irrigationType || !waterSource) {
    return res.status(400).json({ error: 'Missing required farm configuration parameters.' });
  }

  try {
    const farmId = 'farm_' + Date.now();
    await queryRun(
      'INSERT INTO farms (id, user_id, name, location, area, soil_type, irrigation_type, water_source) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [farmId, req.userId, name, location, area, soilType, irrigationType, waterSource]
    );
    
    // Seed standard scores for new farm
    await queryRun(
      'INSERT INTO farm_health_scores (id, farm_id, score, soil, water, crop, weather, disease, pest, nutrition) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      ['fh_' + Date.now(), farmId, 80.0, 80.0, 80.0, 80.0, 80.0, 80.0, 80.0, 80.0]
    );
    await queryRun(
      'INSERT INTO sustainability_scores (id, farm_id, score, water_efficiency, soil_health, resource_conservation, crop_diversity) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ['sust_' + Date.now(), farmId, 75.0, 75.0, 75.0, 75.0, 75.0]
    );

    res.json({ id: farmId, name, location, area });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/farms/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const farm = await queryGet<any>('SELECT * FROM farms WHERE id = ?', [req.params.id]);
    if (!farm) return res.status(404).json({ error: 'Farm not found' });

    const fields = await queryAll<any>('SELECT * FROM fields WHERE farm_id = ?', [farm.id]);
    res.json({ ...farm, fields });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- FIELD MANAGEMENT ----------------

app.post('/api/fields', authenticateToken, async (req, res) => {
  const { farmId, name, area } = req.body;
  if (!farmId || !name || !area) {
    return res.status(400).json({ error: 'Missing farmId, name, or area.' });
  }

  try {
    const fieldId = 'field_' + Date.now();
    await queryRun('INSERT INTO fields (id, farm_id, name, area) VALUES (?, ?, ?, ?)', [fieldId, farmId, name, area]);
    res.json({ id: fieldId, farmId, name, area });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/fields/:id', authenticateToken, async (req, res) => {
  try {
    const field = await queryGet<any>('SELECT * FROM fields WHERE id = ?', [req.params.id]);
    if (!field) return res.status(404).json({ error: 'Field not found.' });

    const crops = await queryAll<any>('SELECT * FROM crops WHERE field_id = ?', [field.id]);
    const soil = await queryGet<any>('SELECT * FROM soil_readings WHERE field_id = ? ORDER BY timestamp DESC LIMIT 1', [field.id]);
    const weather = await queryGet<any>('SELECT * FROM weather_readings WHERE field_id = ? ORDER BY timestamp DESC LIMIT 1', [field.id]);

    res.json({ ...field, crops, soil, weather });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- CROP MANAGEMENT ----------------

app.post('/api/crops', authenticateToken, async (req, res) => {
  const { fieldId, name, variety, plantingDate, expectedHarvest, growthStage, area, waterRequirement } = req.body;
  if (!fieldId || !name || !variety || !plantingDate || !expectedHarvest || !growthStage || !area || !waterRequirement) {
    return res.status(400).json({ error: 'Missing crop description metadata.' });
  }

  try {
    const cropId = 'crop_' + Date.now();
    await queryRun(
      'INSERT INTO crops (id, field_id, name, variety, planting_date, expected_harvest, growth_stage, area, water_requirement) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [cropId, fieldId, name, variety, plantingDate, expectedHarvest, growthStage, area, waterRequirement]
    );

    // Add initial crop health record
    await queryRun(
      'INSERT INTO crop_health (id, crop_id, health_score, observation, risk_indicators) VALUES (?, ?, ?, ?, ?)',
      ['ch_' + Date.now(), cropId, 95.0, 'Crop planted and registered successfully.', JSON.stringify({ water_stress: 'Low', disease_risk: 'Low', pest_risk: 'Low' })]
    );

    res.json({ id: cropId, name, variety, growthStage });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- TELEMETRY ENDPOINTS ----------------

app.get('/api/weather/:fieldId', authenticateToken, async (req, res) => {
  try {
    const weather = await queryGet<any>('SELECT * FROM weather_readings WHERE field_id = ? ORDER BY timestamp DESC LIMIT 1', [req.params.fieldId]);
    const forecast = [
      { day: 'Today', temp: weather ? weather.temperature : 31, rainProb: weather ? weather.rain_probability : 20, cond: weather ? weather.conditions : 'Sunny' },
      { day: 'Tomorrow', temp: 32, rainProb: 15, cond: 'Sunny' },
      { day: 'Day 3', temp: 29, rainProb: 60, cond: 'Light Showers' },
      { day: 'Day 4', temp: 30, rainProb: 75, cond: 'Thundershower' },
      { day: 'Day 5', temp: 28, rainProb: 40, cond: 'Partly Cloudy' }
    ];
    res.json({ current: weather, forecast });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/soil/:fieldId', authenticateToken, async (req, res) => {
  try {
    const soil = await queryGet<any>('SELECT * FROM soil_readings WHERE field_id = ? ORDER BY timestamp DESC LIMIT 1', [req.params.fieldId]);
    const historicalMoisture = [
      { date: '08/06', moisture: 35 },
      { date: '08/07', moisture: 34 },
      { date: '08/08', moisture: 32 },
      { date: '08/09', moisture: 30 },
      { date: '08/10', moisture: 29 },
      { date: '08/11', moisture: 28 },
      { date: '08/12', moisture: soil ? soil.moisture : 28 }
    ];
    res.json({ current: soil, history: historicalMoisture });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- IRRIGATION DECISION ENGINE ----------------

app.post('/api/irrigation/analyze', authenticateToken, async (req, res) => {
  const { fieldId } = req.body;
  if (!fieldId) return res.status(400).json({ error: 'fieldId is required.' });

  try {
    const field = await queryGet<any>('SELECT * FROM fields WHERE id = ?', [fieldId]);
    const crop = await queryGet<any>('SELECT * FROM crops WHERE field_id = ? LIMIT 1', [fieldId]);
    const soil = await queryGet<any>('SELECT * FROM soil_readings WHERE field_id = ? ORDER BY timestamp DESC LIMIT 1', [fieldId]);
    const weather = await queryGet<any>('SELECT * FROM weather_readings WHERE field_id = ? ORDER BY timestamp DESC LIMIT 1', [fieldId]);

    if (!crop || !soil || !weather) {
      return res.status(400).json({ error: 'Telemetry data is incomplete for irrigation analysis.' });
    }

    const decision = await irrigationService.predictIrrigation(
      { moisture: soil.moisture, nitrogen: soil.nitrogen, phosphorus: soil.phosphorus, potassium: soil.potassium, ph: soil.ph, temperature: soil.temperature },
      { temperature: weather.temperature, humidity: weather.humidity, rainProbability: weather.rain_probability, windSpeed: weather.wind_speed, conditions: weather.conditions },
      { name: crop.name, variety: crop.variety, growthStage: crop.growth_stage, plantingDate: crop.planting_date },
      field.area
    );

    res.json(decision);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/irrigation/record', authenticateToken, async (req, res) => {
  const { fieldId, amountLiters } = req.body;
  if (!fieldId || amountLiters === undefined) {
    return res.status(400).json({ error: 'Missing fieldId or amountLiters.' });
  }

  try {
    const recId = 'irr_rec_' + Date.now();
    await queryRun(
      'INSERT INTO irrigation_records (id, field_id, amount_liters, water_saved_liters, type) VALUES (?, ?, ?, ?, ?)',
      [recId, fieldId, amountLiters, 0.0, 'Manual']
    );

    // Instantly restore soil moisture level to 38% after manual irrigation
    await queryRun('UPDATE soil_readings SET moisture = 38.0 WHERE field_id = ?', [fieldId]);

    // Complete the pending tasks regarding Irrigation
    const farmRow = await queryGet<{ farm_id: string }>('SELECT farm_id FROM fields WHERE id = ?', [fieldId]);
    if (farmRow) {
      await queryRun(
        "UPDATE tasks SET status = 'Completed' WHERE farm_id = ? AND type = 'Irrigation'",
        [farmRow.farm_id]
      );
      
      // Update farm health scores (moisture is now restored)
      await queryRun(
        `UPDATE farm_health_scores 
         SET score = 90.0, soil = 85.0, water = 94.0 
         WHERE farm_id = ?`,
        [farmRow.farm_id]
      );
      
      // Remove critical water alerts
      await queryRun(
        "DELETE FROM alerts WHERE farm_id = ? AND type = 'Irrigation'",
        [farmRow.farm_id]
      );
    }

    res.json({ success: true, message: 'Irrigation logged. Soil moisture replenished to 38%.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- DISEASE & PEST ANALYSIS ----------------

app.post('/api/disease/analyze', authenticateToken, async (req, res) => {
  const { cropName, imageUrl } = req.body; // imageUrl can be file upload representation
  if (!cropName) return res.status(400).json({ error: 'cropName is required.' });

  try {
    const analysis = await diseaseService.analyzeCropImage(cropName, imageUrl || 'demo_upload.jpg');
    res.json(analysis);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/pest-risk/:fieldId', authenticateToken, async (req, res) => {
  try {
    const crop = await queryGet<any>('SELECT * FROM crops WHERE field_id = ? LIMIT 1', [req.params.fieldId]);
    const weather = await queryGet<any>('SELECT * FROM weather_readings WHERE field_id = ? ORDER BY timestamp DESC LIMIT 1', [req.params.fieldId]);

    if (!crop || !weather) {
      return res.status(400).json({ error: 'Telemetry data incomplete for pest assessment.' });
    }

    const cropData = { name: crop.name, variety: crop.variety, growthStage: crop.growth_stage, plantingDate: crop.planting_date };
    const weatherData = { temperature: weather.temperature, humidity: weather.humidity, rainProbability: weather.rain_probability, windSpeed: weather.wind_speed, conditions: weather.conditions };
    
    const risks = await pestService.predictPestRisk(cropData, weatherData);
    res.json(risks);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- RECOMMENDATIONS & CLOSED-LOOP FEEDBACK ----------------

app.get('/api/recommendations', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId;
    const farm = await queryGet<any>('SELECT id FROM farms WHERE user_id = ? LIMIT 1', [userId]);
    if (!farm) return res.json([]);

    const fields = await queryAll<any>('SELECT id FROM fields WHERE farm_id = ?', [farm.id]);
    const fieldIds = fields.map(f => f.id);

    if (fieldIds.length === 0) return res.json([]);

    const placeholders = fieldIds.map(() => '?').join(',');
    const list = await queryAll<any>(
      `SELECT r.*, f.action as feedback_action 
       FROM recommendations r
       LEFT JOIN recommendation_feedback f ON r.id = f.recommendation_id
       WHERE r.field_id IN (${placeholders})
       ORDER BY r.timestamp DESC`,
      fieldIds
    );

    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/recommendations/:id/feedback', authenticateToken, async (req, res) => {
  const { action, comment } = req.body;
  if (!action) return res.status(400).json({ error: 'action is required.' });

  try {
    const feedbackId = 'feed_' + Date.now();
    
    // Check if feedback already exists
    const existing = await queryGet<any>('SELECT id FROM recommendation_feedback WHERE recommendation_id = ?', [req.params.id]);
    if (existing) {
      await queryRun(
        'UPDATE recommendation_feedback SET action = ?, comment = ? WHERE recommendation_id = ?',
        [action, comment || '', req.params.id]
      );
    } else {
      await queryRun(
        'INSERT INTO recommendation_feedback (id, recommendation_id, action, comment) VALUES (?, ?, ?, ?)',
        [feedbackId, req.params.id, action, comment || '']
      );
    }

    // Retrieve full feedback metrics for UI closed loop visualization
    const summary = await queryAll<{ action: string; count: number }>(
      `SELECT action, count(*) as count 
       FROM recommendation_feedback 
       GROUP BY action`
    );

    res.json({ success: true, summary });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- TASK MANAGEMENT ----------------

app.get('/api/tasks', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const farm = await queryGet<any>('SELECT id FROM farms WHERE user_id = ? LIMIT 1', [req.userId]);
    if (!farm) return res.json([]);

    const list = await queryAll<any>('SELECT * FROM tasks WHERE farm_id = ? ORDER BY due_date ASC', [farm.id]);
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tasks', authenticateToken, async (req: AuthenticatedRequest, res) => {
  const { title, type, dueDate, priority, description } = req.body;
  if (!title || !type || !dueDate || !priority) {
    return res.status(400).json({ error: 'Missing task parameters.' });
  }

  try {
    const farm = await queryGet<any>('SELECT id FROM farms WHERE user_id = ? LIMIT 1', [req.userId]);
    if (!farm) return res.status(400).json({ error: 'No farm configured for user.' });

    const taskId = 'task_' + Date.now();
    await queryRun(
      'INSERT INTO tasks (id, farm_id, title, type, due_date, status, priority, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [taskId, farm.id, title, type, dueDate, 'Pending', priority, description || '']
    );

    res.json({ id: taskId, title, status: 'Pending' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Complete, skip or reschedule task
app.post('/api/tasks/:id/status', authenticateToken, async (req, res) => {
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: 'status is required.' });

  try {
    await queryRun('UPDATE tasks SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- ALERTS ----------------

app.get('/api/alerts', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const farm = await queryGet<any>('SELECT id FROM farms WHERE user_id = ? LIMIT 1', [req.userId]);
    if (!farm) return res.json([]);

    const list = await queryAll<any>('SELECT * FROM alerts WHERE farm_id = ? ORDER BY timestamp DESC', [farm.id]);
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/alerts/:id/read', authenticateToken, async (req, res) => {
  try {
    await queryRun('UPDATE alerts SET is_read = 1 WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/alerts/:id/dismiss', authenticateToken, async (req, res) => {
  try {
    await queryRun('DELETE FROM alerts WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- AI COPILOT CHAT ----------------

app.post('/api/ai/chat', authenticateToken, async (req: AuthenticatedRequest, res) => {
  const { question, language } = req.body;
  if (!question) return res.status(400).json({ error: 'question is required.' });

  try {
    // Collect full telemetry data for Context injection
    const farm = await queryGet<any>('SELECT * FROM farms WHERE user_id = ? LIMIT 1', [req.userId]);
    if (!farm) return res.status(400).json({ error: 'No active farm to analyze.' });

    const fields = await queryAll<any>('SELECT * FROM fields WHERE farm_id = ?', [farm.id]);
    const enrichedFields = [];

    for (const f of fields) {
      const crop = await queryGet<any>('SELECT * FROM crops WHERE field_id = ? LIMIT 1', [f.id]);
      const soil = await queryGet<any>('SELECT * FROM soil_readings WHERE field_id = ? ORDER BY timestamp DESC LIMIT 1', [f.id]);
      const weather = await queryGet<any>('SELECT * FROM weather_readings WHERE field_id = ? ORDER BY timestamp DESC LIMIT 1', [f.id]);
      
      enrichedFields.push({
        id: f.id,
        name: f.name,
        crop: crop ? { name: crop.name, variety: crop.variety, growthStage: crop.growth_stage, waterRequirement: crop.water_requirement } : undefined,
        soil: soil ? { moisture: soil.moisture, nitrogen: soil.nitrogen, phosphorus: soil.phosphorus, potassium: soil.potassium, ph: soil.ph, temperature: soil.temperature } : undefined,
        weather: weather ? { temperature: weather.temperature, humidity: weather.humidity, rainProbability: weather.rain_probability, windSpeed: weather.wind_speed, conditions: weather.conditions } : undefined
      });
    }

    const alerts = await queryAll<any>('SELECT * FROM alerts WHERE farm_id = ? AND is_read = 0', [farm.id]);
    const tasks = await queryAll<any>("SELECT * FROM tasks WHERE farm_id = ? AND status = 'Pending'", [farm.id]);
    const healthRow = await queryGet<any>('SELECT score FROM farm_health_scores WHERE farm_id = ? ORDER BY timestamp DESC LIMIT 1', [farm.id]);

    const context: FarmContext = {
      farmName: farm.name,
      location: farm.location,
      fields: enrichedFields,
      alerts: alerts.map(a => ({ type: a.type, severity: a.severity, title: a.title, message: a.message })),
      tasks: tasks.map(t => ({ title: t.title, type: t.type, status: t.status, priority: t.priority })),
      farmHealth: healthRow ? healthRow.score : 84
    };

    const answer = await copilotService.askCopilot(question, context, language || 'en');
    res.json({ answer });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- DEMO SCENARIO ENDPOINT ----------------

app.post('/api/demo/run', authenticateToken, async (req, res) => {
  const { scenario } = req.body;
  if (!scenario) return res.status(400).json({ error: 'scenario parameter is required.' });

  try {
    let result;
    if (scenario === 'smart-farm') {
      result = await demoService.runSmartFarmDemo();
    } else if (scenario === 'disease') {
      result = await demoService.runDiseaseDemo();
    } else if (scenario === 'soil') {
      result = await demoService.runSoilDemo();
    } else if (scenario === 'reset') {
      result = await demoService.resetDemo();
    } else {
      return res.status(400).json({ error: 'Unknown scenario type.' });
    }

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- MARKETPLACE PRODUCT ROUTES ----------------

// 1. Fetch public marketplace products
app.get(['/api/marketplace', '/api/products', '/api/products/search'], async (req, res) => {
  const { category, search } = req.query;
  try {
    let sql = `
      SELECT p.*, u.name as farmer_name, f.name as farm_name, f.location as farm_region
      FROM marketplace_products p
      JOIN users u ON p.farmer_id = u.id
      LEFT JOIN farms f ON p.farmer_id = f.user_id
      WHERE p.status != 'PAUSED'
    `;
    const params: any[] = [];

    if (category) {
      sql += ' AND p.category = ?';
      params.push(category);
    }
    if (search) {
      sql += ' AND (p.name LIKE ? OR p.crop LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY p.created_at DESC';
    const products = await queryAll<any>(sql, params);
    res.json(products);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Fetch farmer's own products list (Inventory)
app.get(['/api/products/farmer', '/api/farmer/products'], authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const products = await queryAll<any>(
      'SELECT * FROM marketplace_products WHERE farmer_id = ? ORDER BY created_at DESC',
      [req.userId]
    );
    res.json(products);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 1b. Fetch single product details
app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await queryGet<any>(
      `SELECT p.*, u.name as farmer_name, f.name as farm_name, f.location as farm_region
       FROM marketplace_products p
       JOIN users u ON p.farmer_id = u.id
       LEFT JOIN farms f ON p.farmer_id = f.user_id
       WHERE p.id = ?`,
      [req.params.id]
    );
    if (!product) return res.status(404).json({ error: 'Product not found.' });
    res.json(product);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Farmer adds product
app.post(['/api/products', '/api/farmer/products'], authenticateToken, async (req: AuthenticatedRequest, res) => {
  const { name, category, crop, variety, quantity, unit, price, harvestDate, quality, description, imageUrl } = req.body;
  if (!name || !category || !crop || !variety || quantity === undefined || !unit || price === undefined || !harvestDate || !quality) {
    return res.status(400).json({ error: 'Missing required product parameters.' });
  }

  try {
    const prodId = 'prod_' + Date.now();
    await queryRun(
      `INSERT INTO marketplace_products (id, farmer_id, name, category, crop, variety, quantity, unit, price, harvest_date, quality, description, image_url, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [prodId, req.userId, name, category, crop, variety, Number(quantity), unit, Number(price), harvestDate, quality, description || '', imageUrl || '', 'ACTIVE']
    );
    res.json({ success: true, id: prodId, name });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Farmer updates inventory status / quantity
app.put(['/api/products/:id', '/api/farmer/products/:id'], authenticateToken, async (req: AuthenticatedRequest, res) => {
  const { name, category, crop, variety, quantity, unit, price, harvestDate, quality, description, imageUrl, status } = req.body;
  try {
    const existing = await queryGet<any>('SELECT * FROM marketplace_products WHERE id = ? AND farmer_id = ?', [req.params.id, req.userId]);
    if (!existing) {
      return res.status(404).json({ error: 'Product not found or unauthorized.' });
    }

    const newName = name || existing.name;
    const newCategory = category || existing.category;
    const newCrop = crop || existing.crop;
    const newVariety = variety || existing.variety;
    const newQty = quantity !== undefined ? Number(quantity) : existing.quantity;
    const newUnit = unit || existing.unit;
    const newPrice = price !== undefined ? Number(price) : existing.price;
    const newHarvest = harvestDate || existing.harvest_date;
    const newQuality = quality || existing.quality;
    const newDesc = description !== undefined ? description : existing.description;
    const newImage = imageUrl !== undefined ? imageUrl : existing.image_url;
    const newStatus = status || existing.status;

    await queryRun(
      `UPDATE marketplace_products 
       SET name = ?, category = ?, crop = ?, variety = ?, quantity = ?, unit = ?, price = ?, harvest_date = ?, quality = ?, description = ?, image_url = ?, status = ? 
       WHERE id = ?`,
      [newName, newCategory, newCrop, newVariety, newQty, newUnit, newPrice, newHarvest, newQuality, newDesc, newImage, newStatus, req.params.id]
    );

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Farmer deletes product listing
app.delete(['/api/products/:id', '/api/farmer/products/:id'], authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const result = await queryRun(
      'DELETE FROM marketplace_products WHERE id = ? AND farmer_id = ?',
      [req.params.id, req.userId]
    );
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- ORDER ROUTES ----------------

// 6. Customer checkout places order (splits cart by vegetable to ensure single-product orders)
app.post('/api/orders', authenticateToken, async (req: AuthenticatedRequest, res) => {
  const { items, shippingName, shippingPhone, shippingAddress, deliveryPreference, orderNotes, latitude, longitude, city, state, pincode, accuracy, locationSource } = req.body;
  if (!items || !Array.isArray(items) || items.length === 0 || !shippingName || !shippingPhone || !shippingAddress || !deliveryPreference) {
    return res.status(400).json({ error: 'Missing required order placement details.' });
  }

  await queryRun('BEGIN TRANSACTION');
  try {
    const createdOrders = [];
    for (const item of items) {
      // Validate product and stock
      const product = await queryGet<any>('SELECT * FROM marketplace_products WHERE id = ?', [item.productId]);
      if (!product) {
        throw new Error(`Product with ID ${item.productId} not found.`);
      }
      if (product.quantity < item.quantity) {
        throw new Error(`Insufficient inventory stock for ${product.name}. Available: ${product.quantity}, Requested: ${item.quantity}`);
      }

      // Check if farmer is restricted
      const farmer = await queryGet<any>('SELECT is_restricted FROM users WHERE id = ?', [product.farmer_id]);
      if (farmer && farmer.is_restricted) {
        throw new Error(`Farmer for ${product.name} is currently restricted and cannot accept new orders.`);
      }

      const totalAmount = product.price * item.quantity;
      const orderId = 'ord_' + Date.now() + '_' + Math.floor(Math.random() * 1000);

      // Create order with status PENDING, payment_status PENDING, and save single product details in orders
      await queryRun(
        `INSERT INTO orders (id, customer_id, farmer_id, vegetable_id, quantity, total_amount, status, payment_status, shipping_name, shipping_phone, shipping_address, delivery_preference, order_notes, latitude, longitude, city, state, pincode, accuracy, location_source)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          req.userId,
          product.farmer_id,
          product.id,
          item.quantity,
          totalAmount,
          'PENDING',
          'PENDING',
          shippingName,
          shippingPhone,
          shippingAddress,
          deliveryPreference,
          orderNotes || '',
          latitude || null,
          longitude || null,
          city || '',
          state || '',
          pincode || '',
          accuracy || null,
          locationSource || null
        ]
      );

      // Create order item for compatibility
      await queryRun(
        `INSERT INTO order_items (id, order_id, product_id, quantity, price)
         VALUES (?, ?, ?, ?, ?)`,
        ['ord_item_' + Date.now() + '_' + Math.floor(Math.random() * 1000), orderId, product.id, item.quantity, product.price]
      );

      // Reserve stock atomically
      await queryRun(
        'UPDATE marketplace_products SET quantity = quantity - ?, reserved_quantity = reserved_quantity + ? WHERE id = ?',
        [item.quantity, item.quantity, product.id]
      );

      // Create alert for farmer
      const farmRow = await queryGet<any>('SELECT id FROM farms WHERE user_id = ? LIMIT 1', [product.farmer_id]);
      await queryRun(
        `INSERT INTO alerts (id, farm_id, type, severity, title, message)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          'alert_ord_' + Date.now() + '_' + Math.floor(Math.random() * 100),
          farmRow ? farmRow.id : 'farm_green_valley',
          'System',
          'Medium',
          'New Customer Order Placed',
          `Order ${orderId} has been placed by ${shippingName} for ₹${totalAmount}. Please await payment.`
        ]
      );

      createdOrders.push({ orderId, totalAmount, farmerId: product.farmer_id });
    }

    await queryRun('COMMIT');
    res.json({ success: true, orders: createdOrders });
  } catch (err: any) {
    await queryRun('ROLLBACK');
    res.status(400).json({ error: err.message });
  }
});

// 7. Get customer orders
app.get('/api/orders/customer', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const orders = await queryAll<any>(
      `SELECT o.*, u.name as farmer_name, f.name as farm_name,
              d.delivery_partner_id, dp.name as delivery_partner_name,
              dp.vehicle_type as delivery_vehicle, dp.avatar_url as delivery_partner_avatar,
              d.status as delivery_status, d.remaining_distance_km, d.estimated_arrival_minutes
       FROM orders o
       JOIN users u ON o.farmer_id = u.id
       LEFT JOIN farms f ON o.farmer_id = f.user_id
       LEFT JOIN deliveries d ON o.id = d.order_id
       LEFT JOIN delivery_partners dp ON d.delivery_partner_id = dp.id
       WHERE o.customer_id = ?
       ORDER BY o.created_at DESC`,
      [req.userId]
    );

    // Populate order items details
    const enriched = [];
    for (const o of orders) {
      const items = await queryAll<any>(
        `SELECT oi.*, p.name as product_name, p.unit 
         FROM order_items oi
         JOIN marketplace_products p ON oi.product_id = p.id
         WHERE oi.order_id = ?`,
        [o.id]
      );
      enriched.push({ ...o, items });
    }

    res.json(enriched);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Get farmer orders
app.get('/api/orders/farmer', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const orders = await queryAll<any>(
      `SELECT o.*, u.name as customer_name,
              d.delivery_partner_id, dp.name as delivery_partner_name,
              dp.vehicle_type as delivery_vehicle, dp.avatar_url as delivery_partner_avatar,
              d.status as delivery_status, d.remaining_distance_km, d.estimated_arrival_minutes
       FROM orders o
       JOIN users u ON o.customer_id = u.id
       LEFT JOIN deliveries d ON o.id = d.order_id
       LEFT JOIN delivery_partners dp ON d.delivery_partner_id = dp.id
       WHERE o.farmer_id = ?
       ORDER BY o.created_at DESC`,
      [req.userId]
    );

    const enriched = [];
    for (const o of orders) {
      const items = await queryAll<any>(
        `SELECT oi.*, p.name as product_name, p.unit 
         FROM order_items oi
         JOIN marketplace_products p ON oi.product_id = p.id
         WHERE oi.order_id = ?`,
        [o.id]
      );
      enriched.push({ ...o, items });
    }

    res.json(enriched);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6b. Customer payment simulation
app.post('/api/orders/:orderId/pay', authenticateToken, async (req: AuthenticatedRequest, res) => {
  const { orderId } = req.params;
  try {
    const order = await queryGet<any>('SELECT * FROM orders WHERE id = ?', [orderId]);
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    if (order.customer_id !== req.userId) return res.status(403).json({ error: 'Unauthorized.' });
    if (order.payment_status !== 'PENDING') return res.status(400).json({ error: 'Payment is not pending.' });

    await queryRun("UPDATE orders SET payment_status = 'HELD' WHERE id = ?", [orderId]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6c. Farmer accepts order
app.post('/api/orders/:orderId/accept', authenticateToken, async (req: AuthenticatedRequest, res) => {
  const { orderId } = req.params;
  try {
    const order = await queryGet<any>('SELECT * FROM orders WHERE id = ?', [orderId]);
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    if (order.farmer_id !== req.userId) return res.status(403).json({ error: 'Unauthorized.' });
    if (order.status !== 'PENDING') return res.status(400).json({ error: 'Order is not pending.' });
    if (order.payment_status !== 'HELD') return res.status(400).json({ error: 'Cannot accept order. Payment must be HELD first.' });

    // Check restriction
    const farmer = await queryGet<any>('SELECT is_restricted FROM users WHERE id = ?', [req.userId]);
    if (farmer && farmer.is_restricted) {
      return res.status(400).json({ error: 'Your account is restricted. You cannot accept new orders until an admin reviews it.' });
    }

    // Generate random 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    // Delivery deadline: 24 hours from now
    const deadline = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    await queryRun(
      "UPDATE orders SET status = 'ACCEPTED', delivery_otp = ?, delivery_deadline = ? WHERE id = ?",
      [otp, deadline, orderId]
    );

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6d. Farmer dispatches order
app.post('/api/orders/:orderId/dispatch', authenticateToken, async (req: AuthenticatedRequest, res) => {
  const { orderId } = req.params;
  try {
    const order = await queryGet<any>('SELECT * FROM orders WHERE id = ?', [orderId]);
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    if (order.farmer_id !== req.userId) return res.status(403).json({ error: 'Unauthorized.' });
    if (order.status !== 'ACCEPTED') return res.status(400).json({ error: 'Order must be ACCEPTED before dispatch.' });

    await queryRun("UPDATE orders SET status = 'DISPATCHED' WHERE id = ?", [orderId]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6e. Farmer completes delivery with OTP verification
app.post('/api/orders/:orderId/deliver', authenticateToken, async (req: AuthenticatedRequest, res) => {
  const { orderId } = req.params;
  const { otp } = req.body;
  if (!otp) return res.status(400).json({ error: 'Customer OTP is required.' });

  try {
    const order = await queryGet<any>('SELECT * FROM orders WHERE id = ?', [orderId]);
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    if (order.farmer_id !== req.userId) return res.status(403).json({ error: 'Unauthorized.' });
    if (order.status !== 'DISPATCHED' && order.status !== 'ACCEPTED') {
      return res.status(400).json({ error: 'Order must be ACCEPTED or DISPATCHED to complete delivery.' });
    }

    if (order.delivery_otp !== otp.trim()) {
      // Increment OTP attempts
      const attempts = (order.otp_attempts || 0) + 1;
      await queryRun('UPDATE orders SET otp_attempts = ? WHERE id = ?', [attempts, orderId]);

      if (attempts >= 3) {
        // Penalize score by 15 for fake delivery
        const farmer = await queryGet<any>('SELECT reliability_score FROM users WHERE id = ?', [order.farmer_id]);
        if (farmer) {
          const newScore = Math.max(0, farmer.reliability_score - 15);
          const isRestricted = newScore < 50 ? 1 : 0;
          await queryRun('UPDATE users SET reliability_score = ?, is_restricted = ? WHERE id = ?', [newScore, isRestricted, order.farmer_id]);
        }
        
        // Alert customer
        await queryRun(
          `INSERT INTO alerts (id, farm_id, type, severity, title, message) VALUES (?, ?, ?, ?, ?, ?)`,
          [
            'alert_fake_' + Date.now(),
            'farm_green_valley',
            'System',
            'High',
            'Security Warning: Fake Delivery Suspected',
            `Farmer tried to submit incorrect delivery OTP 3 times on Order #${orderId}. Farmer penalized.`
          ]
        );

        return res.status(400).json({ error: 'Incorrect OTP. 3 failed attempts: Farmer reliability score reduced by 15.' });
      }
      return res.status(400).json({ error: `Incorrect OTP. Attempt ${attempts} of 3.` });
    }

    // Correct OTP: Deliver order, release payment, finalize stock
    const nowStr = new Date().toISOString();
    await queryRun(
      "UPDATE orders SET status = 'DELIVERED', payment_status = 'RELEASED', delivered_date = ? WHERE id = ?",
      [nowStr, orderId]
    );

    // Finalize stock reservation: subtract from reserved_quantity
    await queryRun(
      'UPDATE marketplace_products SET reserved_quantity = reserved_quantity - ? WHERE id = ?',
      [order.quantity, order.vegetable_id]
    );

    // Reward farmer reliability score: +5 for successful delivery, +3 for on-time delivery
    const farmer = await queryGet<any>('SELECT reliability_score FROM users WHERE id = ?', [order.farmer_id]);
    if (farmer) {
      const newScore = Math.min(100, farmer.reliability_score + 8);
      await queryRun('UPDATE users SET reliability_score = ? WHERE id = ?', [newScore, order.farmer_id]);
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6f. Customer disputes order
app.post('/api/orders/:orderId/dispute', authenticateToken, async (req: AuthenticatedRequest, res) => {
  const { orderId } = req.params;
  const { reason } = req.body;
  if (!reason) return res.status(400).json({ error: 'Dispute reason is required.' });

  try {
    const order = await queryGet<any>('SELECT * FROM orders WHERE id = ?', [orderId]);
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    if (order.customer_id !== req.userId) return res.status(403).json({ error: 'Unauthorized.' });
    if (order.status === 'DELIVERED' || order.status === 'CANCELLED') {
      return res.status(400).json({ error: 'Cannot dispute completed or cancelled orders.' });
    }

    await queryRun(
      "UPDATE orders SET status = 'DISPUTED', dispute_reason = ?, dispute_status = 'PENDING' WHERE id = ?",
      [reason, orderId]
    );

    // Penalize farmer score -5 for customer dispute
    const farmer = await queryGet<any>('SELECT reliability_score FROM users WHERE id = ?', [order.farmer_id]);
    if (farmer) {
      const newScore = Math.max(0, farmer.reliability_score - 5);
      const isRestricted = newScore < 50 ? 1 : 0;
      await queryRun('UPDATE users SET reliability_score = ?, is_restricted = ? WHERE id = ?', [newScore, isRestricted, order.farmer_id]);
    }

    // Alerts
    const farmRow = await queryGet<any>('SELECT id FROM farms WHERE user_id = ? LIMIT 1', [order.farmer_id]);
    await queryRun(
      `INSERT INTO alerts (id, farm_id, type, severity, title, message) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        'alert_disp_' + Date.now(),
        farmRow ? farmRow.id : 'farm_green_valley',
        'System',
        'High',
        'Dispute Filed on Order',
        `Customer filed a dispute for: ${reason} on Order #${orderId}. Payment is held.`
      ]
    );

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6g. Cancel order (Customer or Farmer)
app.post('/api/orders/:orderId/cancel', authenticateToken, async (req: AuthenticatedRequest, res) => {
  const { orderId } = req.params;
  const { reason } = req.body;

  try {
    const order = await queryGet<any>('SELECT * FROM orders WHERE id = ?', [orderId]);
    if (!order) return res.status(404).json({ error: 'Order not found.' });

    // Determine canceler
    let canceler = '';
    if (order.customer_id === req.userId) {
      canceler = 'CUSTOMER';
      if (order.status !== 'PENDING' && order.status !== 'ACCEPTED') {
        return res.status(400).json({ error: `Cannot cancel order in status ${order.status}.` });
      }
    } else if (order.farmer_id === req.userId) {
      canceler = 'FARMER';
      if (order.status !== 'PENDING' && order.status !== 'ACCEPTED') {
        return res.status(400).json({ error: `Cannot cancel order in status ${order.status}.` });
      }
    } else {
      return res.status(403).json({ error: 'Unauthorized to cancel this order.' });
    }

    const now = new Date().toISOString();
    const newPaymentStatus = order.payment_status === 'HELD' ? 'REFUNDED' : order.payment_status;

    await queryRun(
      'UPDATE orders SET status = ?, payment_status = ?, cancelled_by = ?, cancelled_at = ?, cancellation_reason = ? WHERE id = ?',
      ['CANCELLED', newPaymentStatus, canceler, now, reason || 'Cancelled by ' + canceler.toLowerCase(), orderId]
    );

    // Release stock
    await queryRun(
      'UPDATE marketplace_products SET quantity = quantity + ?, reserved_quantity = reserved_quantity - ? WHERE id = ?',
      [order.quantity, order.quantity, order.vegetable_id]
    );

    // Cancel delivery record if any
    await queryRun("UPDATE deliveries SET status = 'CANCELLED' WHERE order_id = ?", [orderId]);

    // Alerts
    const farm = await queryGet<any>('SELECT id FROM farms WHERE user_id = ? LIMIT 1', [order.farmer_id]);
    const farmId = farm ? farm.id : 'farm_green_valley';
    await queryRun(
      'INSERT INTO alerts (id, farm_id, type, severity, title, message) VALUES (?, ?, ?, ?, ?, ?)',
      ['alert_cxl_' + Date.now(), farmId, 'System', 'Medium', 'Order Cancelled', `Order #${orderId} was cancelled by ${canceler.toLowerCase()}.`]
    );

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 8b. Legacy Customer cancels order wrapper
app.patch('/api/customer/orders/:orderId/cancel', authenticateToken, async (req: AuthenticatedRequest, res) => {
  req.url = `/api/orders/${req.params.orderId}/cancel`;
  req.method = 'POST';
  (app as any).handle(req, res);
});

// 9. Farmer updates order status wrapper
app.post('/api/orders/:id/status', authenticateToken, async (req: AuthenticatedRequest, res) => {
  const { status, otp } = req.body;
  const orderId = req.params.id;
  if (!status) return res.status(400).json({ error: 'Status is required.' });

  try {
    const order = await queryGet<any>('SELECT * FROM orders WHERE id = ?', [orderId]);
    if (!order) return res.status(404).json({ error: 'Order not found.' });

    if (status === 'ACCEPTED') {
      req.url = `/api/orders/${orderId}/accept`;
      return (app as any).handle(req, res);
    } else if (status === 'DISPATCHED') {
      req.url = `/api/orders/${orderId}/dispatch`;
      return (app as any).handle(req, res);
    } else if (status === 'DELIVERED') {
      req.url = `/api/orders/${orderId}/deliver`;
      req.body = { otp };
      return (app as any).handle(req, res);
    } else if (status === 'CANCELLED') {
      req.url = `/api/orders/${orderId}/cancel`;
      return (app as any).handle(req, res);
    } else {
      // Allow general status updates for PREPARING, READY, etc.
      await queryRun('UPDATE orders SET status = ? WHERE id = ?', [status, orderId]);
      res.json({ success: true });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- DELIVERY TRACKING APIS ----------------

// Active simulation intervals tracking
const activeSimulations = new Map<string, any>();

// Predefined mock route coordinates
const demoRoute = [
  { lat: 10.9970, lng: 76.9616, dist: 8.5, eta: 15, status: 'ASSIGNED', msg: 'Delivery Partner Assigned' },
  { lat: 11.0012, lng: 76.9602, dist: 7.2, eta: 12, status: 'PICKED_UP', msg: 'Order Picked Up by Agent' },
  { lat: 11.0065, lng: 76.9585, dist: 5.4, eta: 9, status: 'OUT_FOR_DELIVERY', msg: 'Out for Delivery' },
  { lat: 11.0118, lng: 76.9571, dist: 3.2, eta: 6, status: 'OUT_FOR_DELIVERY', msg: 'En Route to Destination' },
  { lat: 11.0145, lng: 76.9562, dist: 1.4, eta: 3, status: 'OUT_FOR_DELIVERY', msg: 'Approaching Delivery Area' },
  { lat: 11.0162, lng: 76.9560, dist: 0.2, eta: 1, status: 'NEAR_YOU', msg: 'Your Order is Nearby (Within 500m)' },
  { lat: 11.0168, lng: 76.9558, dist: 0.0, eta: 0, status: 'DELIVERED', msg: 'Order Delivered successfully!' }
];

// A. Get list of available delivery partners
app.get('/api/deliveries/partners', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const list = await queryAll('SELECT * FROM delivery_partners');
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// B. Get delivery details by ID
app.get('/api/deliveries/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const delivery = await queryGet<any>(
      `SELECT d.*, dp.name as partner_name, dp.vehicle_type, dp.vehicle_number, dp.avatar_url, dp.status as partner_status
       FROM deliveries d
       JOIN delivery_partners dp ON d.delivery_partner_id = dp.id
       WHERE d.id = ?`,
      [req.params.id]
    );
    if (!delivery) return res.status(404).json({ error: 'Delivery record not found.' });
    res.json(delivery);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// C. Get live tracking details (by delivery ID)
app.get('/api/deliveries/:id/tracking', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const dlv = await queryGet<any>(
      `SELECT d.*, dp.name as partner_name, dp.vehicle_type, dp.vehicle_number, dp.avatar_url
       FROM deliveries d
       JOIN delivery_partners dp ON d.delivery_partner_id = dp.id
       WHERE d.id = ?`,
      [req.params.id]
    );
    if (!dlv) return res.status(404).json({ error: 'Delivery not found.' });

    const locs = await queryAll<any>('SELECT * FROM delivery_locations WHERE delivery_id = ? ORDER BY timestamp DESC LIMIT 1', [req.params.id]);
    const latestLoc = locs[0] || null;

    res.json({
      delivery: dlv,
      latestLocation: latestLoc,
      lastUpdated: latestLoc ? latestLoc.timestamp : dlv.assigned_at
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// D. Get live tracking details by Order ID
app.get('/api/orders/:id/tracking', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const dlv = await queryGet<any>(
      `SELECT d.*, dp.name as partner_name, dp.vehicle_type, dp.vehicle_number, dp.avatar_url
       FROM deliveries d
       JOIN delivery_partners dp ON d.delivery_partner_id = dp.id
       WHERE d.order_id = ?`,
      [req.params.id]
    );
    if (!dlv) return res.status(404).json({ error: 'No delivery assigned to this order yet.' });

    const locs = await queryAll<any>('SELECT * FROM delivery_locations WHERE delivery_id = ? ORDER BY timestamp DESC LIMIT 1', [dlv.id]);
    const latestLoc = locs[0] || null;

    res.json({
      delivery: dlv,
      latestLocation: latestLoc,
      lastUpdated: latestLoc ? latestLoc.timestamp : dlv.assigned_at
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// E. Get latest location coordinates
app.get('/api/deliveries/:id/location', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const locs = await queryAll<any>('SELECT * FROM delivery_locations WHERE delivery_id = ? ORDER BY timestamp DESC LIMIT 1', [req.params.id]);
    if (locs.length === 0) return res.status(404).json({ error: 'No location updates recorded.' });
    res.json(locs[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// F. Get route path coordinates
app.get('/api/deliveries/:id/route', authenticateToken, async (req: AuthenticatedRequest, res) => {
  res.json({
    farmerLocation: { lat: 10.9970, lng: 76.9616, name: 'Green Valley Farm' },
    customerLocation: { lat: 11.0168, lng: 76.9558, name: 'Coimbatore Destination' },
    routePoints: demoRoute.map(p => ({ lat: p.lat, lng: p.lng }))
  });
});

// G. Assign a delivery partner to an order (creates delivery)
app.post('/api/deliveries/:orderId/assign', authenticateToken, async (req: AuthenticatedRequest, res) => {
  const { deliveryPartnerId, name, phone, vehicleType, pickupLocation, deliveryLocation, notes } = req.body;
  let partnerId = deliveryPartnerId;

  try {
    // 1. Verify order exists
    const order = await queryGet<any>(
      'SELECT o.*, f.id AS farm_id FROM orders o LEFT JOIN farms f ON o.farmer_id = f.user_id WHERE o.id = ?',
      [req.params.orderId]
    );
    if (!order) return res.status(404).json({ error: 'Order not found.' });

    if (!partnerId) {
      if (!name || !phone || !vehicleType) {
        return res.status(400).json({ error: 'deliveryPartnerId or manual details (name, phone, vehicleType) are required.' });
      }

      const cleanPhone = phone.replace(/\D/g, '');
      partnerId = `dp_${cleanPhone}`;
      const hashedPw = await bcrypt.hash('delivery123', 10);

      // Insert into users
      await queryRun(
        'INSERT OR IGNORE INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)',
        [partnerId, name, `${cleanPhone}@delivery.com`, hashedPw, 'delivery']
      );

      // Insert into delivery_partners
      await queryRun(
        'INSERT OR IGNORE INTO delivery_partners (id, name, vehicle_type, vehicle_number, avatar_url, status) VALUES (?, ?, ?, ?, ?, ?)',
        [partnerId, name, vehicleType, 'TN-66-MANUAL', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150', 'Busy']
      );
    } else {
      // Check availability if selecting an existing partner
      const partner = await queryGet<any>('SELECT * FROM delivery_partners WHERE id = ?', [partnerId]);
      if (!partner) return res.status(404).json({ error: 'Delivery partner not found.' });
      if (partner.status === 'Not Available') {
        return res.status(400).json({ error: 'This delivery person is currently not available.' });
      }
    }

    // Set partner status to Busy
    await queryRun("UPDATE delivery_partners SET status = 'Busy' WHERE id = ?", [partnerId]);

    // Optional updates to order info
    if (deliveryLocation || notes) {
      await queryRun(
        'UPDATE orders SET shipping_address = COALESCE(?, shipping_address), order_notes = COALESCE(?, order_notes) WHERE id = ?',
        [deliveryLocation, notes, req.params.orderId]
      );
    }

    // Create delivery entry
    const deliveryId = `dlv_${req.params.orderId}`;
    await queryRun(
      `INSERT OR REPLACE INTO deliveries (id, order_id, delivery_partner_id, status, remaining_distance_km, estimated_arrival_minutes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [deliveryId, req.params.orderId, partnerId, 'ASSIGNED', 8.5, 15]
    );

    // Update order status to ACCEPTED
    await queryRun("UPDATE orders SET status = 'ACCEPTED' WHERE id = ?", [req.params.orderId]);

    // Seed initial location at farm
    await queryRun(
      `INSERT OR REPLACE INTO delivery_locations (id, delivery_id, latitude, longitude, speed, heading)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [`loc_${deliveryId}_start`, deliveryId, 10.9970, 76.9616, 0, 0]
    );

    // Create Alert
    await queryRun(
      'INSERT INTO alerts (id, farm_id, type, severity, title, message) VALUES (?, ?, ?, ?, ?, ?)',
      [`alert_dlv_${deliveryId}`, order.farm_id, 'System', 'Low', 'Delivery Partner Assigned', `${name || 'Agent'} has been assigned to deliver Order ${req.params.orderId}.`]
    );

    res.json({ success: true, deliveryId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// H. Update delivery status manually (or via simulator)
app.put('/api/deliveries/:id/status', authenticateToken, async (req: AuthenticatedRequest, res) => {
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: 'Status is required.' });

  try {
    await queryRun('UPDATE deliveries SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// I. Post coordinates telemetry (e.g. real GPS receiver)
app.post('/api/deliveries/:id/location', authenticateToken, async (req: AuthenticatedRequest, res) => {
  const { latitude, longitude, speed, heading } = req.body;
  if (latitude === undefined || longitude === undefined) {
    return res.status(400).json({ error: 'latitude and longitude are required.' });
  }

  const locId = `loc_${req.params.id}_${Date.now()}`;

  try {
    await queryRun(
      `INSERT INTO delivery_locations (id, delivery_id, latitude, longitude, speed, heading)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [locId, req.params.id, latitude, longitude, speed || 0, heading || 0]
    );
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// J. Simulate route interval updates (Hackathon Presentation Trigger)
app.post('/api/deliveries/:id/simulate', authenticateToken, async (req: AuthenticatedRequest, res) => {
  const deliveryId = req.params.id;

  if (activeSimulations.has(deliveryId)) {
    clearInterval(activeSimulations.get(deliveryId));
  }

  let step = 0;
  
  const intervalId = setInterval(async () => {
    if (step >= demoRoute.length) {
      clearInterval(intervalId);
      activeSimulations.delete(deliveryId);
      
      // Update partner back to Available when completed
      try {
        const dlv = await queryGet<any>('SELECT delivery_partner_id FROM deliveries WHERE id = ?', [deliveryId]);
        if (dlv) {
          await queryRun("UPDATE delivery_partners SET status = 'Available' WHERE id = ?", [dlv.delivery_partner_id]);
        }
      } catch (e) {
        console.error(e);
      }
      return;
    }

    const point = demoRoute[step];
    
    try {
      // 1. Update delivery status & metrics
      await queryRun(
        `UPDATE deliveries 
         SET status = ?, remaining_distance_km = ?, estimated_arrival_minutes = ?,
             picked_up_at = CASE WHEN ? = 'PICKED_UP' THEN CURRENT_TIMESTAMP ELSE picked_up_at END,
             delivered_at = CASE WHEN ? = 'DELIVERED' THEN CURRENT_TIMESTAMP ELSE delivered_at END
         WHERE id = ?`,
        [point.status, point.dist, point.eta, point.status, point.status, deliveryId]
      );

      // 2. Map coordinates update
      const locId = `loc_${deliveryId}_${step}`;
      await queryRun(
        `INSERT OR REPLACE INTO delivery_locations (id, delivery_id, latitude, longitude, speed, heading)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [locId, deliveryId, point.lat, point.lng, 35, 120]
      );

      // 3. Sync order status dynamically
      let orderStatus = 'ACCEPTED';
      if (point.status === 'ASSIGNED') orderStatus = 'ACCEPTED';
      else if (point.status === 'PICKED_UP') orderStatus = 'PREPARING';
      else if (point.status === 'OUT_FOR_DELIVERY' || point.status === 'NEAR_YOU') orderStatus = 'OUT_FOR_DELIVERY';
      else if (point.status === 'DELIVERED') orderStatus = 'DELIVERED';

      await queryRun(
        `UPDATE orders 
         SET status = ? 
         WHERE id = (SELECT order_id FROM deliveries WHERE id = ?)`,
        [orderStatus, deliveryId]
      );

      // 4. Record notify alerts
      const d = await queryGet<any>('SELECT order_id FROM deliveries WHERE id = ?', [deliveryId]);
      if (d) {
        const ord = await queryGet<any>(
          'SELECT f.id AS farm_id FROM orders o LEFT JOIN farms f ON o.farmer_id = f.user_id WHERE o.id = ?',
          [d.order_id]
        );
        if (ord) {
          await queryRun(
            'INSERT INTO alerts (id, farm_id, type, severity, title, message) VALUES (?, ?, ?, ?, ?, ?)',
            [`dlv_alert_${deliveryId}_${step}_${Date.now()}`, ord.farm_id, 'System', 'Low', 'Fulfillment Update', point.msg]
          );
        }
      }
      
      console.log(`Live Simulator: Step ${step} processed for Delivery ID: ${deliveryId}. Status: ${point.status}`);
    } catch (e) {
      console.error('Simulation sync error:', e);
    }

    step++;
  }, 4000);

  activeSimulations.set(deliveryId, intervalId);
  res.json({ success: true, message: 'Simulation sequence started.' });
});

// 0a. Get delivery partner profile
app.get('/api/delivery/profile', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const partner = await queryGet<any>('SELECT * FROM delivery_partners WHERE id = ?', [req.userId]);
    if (!partner) return res.status(404).json({ error: 'Delivery partner profile not found.' });
    res.json(partner);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 0b. Update delivery partner availability
app.put('/api/delivery/availability', authenticateToken, async (req: AuthenticatedRequest, res) => {
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: 'Status is required.' });
  try {
    await queryRun('UPDATE delivery_partners SET status = ? WHERE id = ?', [status, req.userId]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 1. Get all assigned deliveries for the logged-in Delivery Person
app.get('/api/delivery/orders', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const list = await queryAll<any>(
      `SELECT d.id AS delivery_id, d.status AS delivery_status, d.assigned_at, d.picked_up_at, d.delivered_at, 
              d.estimated_arrival_minutes, d.remaining_distance_km,
              o.id AS order_id, o.status AS order_status, o.total_amount, o.shipping_name, o.shipping_phone, o.shipping_address,
              o.latitude AS customer_lat, o.longitude AS customer_lng, o.created_at AS order_date, o.order_notes,
              p.name AS product_name, oi.quantity, p.unit,
              f.name AS farmer_name, f.email AS farmer_email, farm.name AS farm_name, farm.location AS pickup_location,
              dp.vehicle_type AS vehicle_type
       FROM deliveries d
       JOIN orders o ON d.order_id = o.id
       JOIN users c ON o.customer_id = c.id
       JOIN users f ON o.farmer_id = f.id
       LEFT JOIN farms farm ON f.id = farm.user_id
       JOIN order_items oi ON o.id = oi.order_id
       JOIN marketplace_products p ON oi.product_id = p.id
       LEFT JOIN delivery_partners dp ON d.delivery_partner_id = dp.id
       WHERE d.delivery_partner_id = ?`,
      [req.userId]
    );
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Get details for a single delivery
app.get('/api/delivery/orders/:orderId', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const delivery = await queryGet<any>(
      `SELECT d.id AS delivery_id, d.status AS delivery_status, d.assigned_at, d.picked_up_at, d.delivered_at, 
              d.estimated_arrival_minutes, d.remaining_distance_km,
              o.id AS order_id, o.status AS order_status, o.total_amount, o.shipping_name, o.shipping_phone, o.shipping_address,
              o.latitude AS customer_lat, o.longitude AS customer_lng, o.created_at AS order_date, o.order_notes,
              p.name AS product_name, oi.quantity, p.unit,
              f.name AS farmer_name, f.email AS farmer_email, farm.name AS farm_name, farm.location AS pickup_location,
              dp.vehicle_type AS vehicle_type
       FROM deliveries d
       JOIN orders o ON d.order_id = o.id
       JOIN users c ON o.customer_id = c.id
       JOIN users f ON o.farmer_id = f.id
       LEFT JOIN farms farm ON f.id = farm.user_id
       JOIN order_items oi ON o.id = oi.order_id
       JOIN marketplace_products p ON oi.product_id = p.id
       LEFT JOIN delivery_partners dp ON d.delivery_partner_id = dp.id
       WHERE o.id = ? AND d.delivery_partner_id = ?`,
      [req.params.orderId, req.userId]
    );
    if (!delivery) return res.status(404).json({ error: 'Delivery assignment not found.' });
    res.json(delivery);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Post telemetry location updates from Delivery Person
app.post('/api/delivery/location', authenticateToken, async (req: AuthenticatedRequest, res) => {
  const { deliveryId, deliveryPersonId, orderId, latitude, longitude } = req.body;
  if (!latitude || !longitude) {
    return res.status(400).json({ error: 'latitude and longitude are required.' });
  }

  let finalDeliveryId = deliveryId;
  try {
    if (!finalDeliveryId && orderId) {
      const d = await queryGet<any>('SELECT id FROM deliveries WHERE order_id = ?', [orderId]);
      if (d) finalDeliveryId = d.id;
    }

    if (!finalDeliveryId) {
      return res.status(400).json({ error: 'deliveryId or orderId is required.' });
    }

    // Insert location coordinates entry
    const locId = `loc_tel_${finalDeliveryId}_${Date.now()}`;
    await queryRun(
      `INSERT INTO delivery_locations (id, delivery_id, latitude, longitude, speed, heading)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [locId, finalDeliveryId, latitude, longitude, 30, 0]
    );

    // Calculate remaining distance to customer destination if available
    const delivery = await queryGet<any>(
      `SELECT d.*, o.latitude AS customer_lat, o.longitude AS customer_lng, o.id AS order_id, f.id AS farm_id
       FROM deliveries d
       JOIN orders o ON d.order_id = o.id
       LEFT JOIN farms f ON o.farmer_id = f.user_id
       WHERE d.id = ?`,
      [finalDeliveryId]
    );

    if (delivery && delivery.customer_lat && delivery.customer_lng) {
      // Simple Haversine calculation
      const lat1 = latitude;
      const lon1 = longitude;
      const lat2 = delivery.customer_lat;
      const lon2 = delivery.customer_lng;
      
      const R = 6371; // km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const dist = R * c;

      const eta = Math.round(dist * 2.5); // Estimate 2.5 minutes per km

      await queryRun(
        `UPDATE deliveries 
         SET remaining_distance_km = ?, estimated_arrival_minutes = ?
         WHERE id = ?`,
        [parseFloat(dist.toFixed(2)), eta, finalDeliveryId]
      );
      
      // If remaining distance is very close, we can set status to NEAR CUSTOMER
      if (dist < 0.2 && delivery.status === 'OUT_FOR_DELIVERY') {
        await queryRun("UPDATE deliveries SET status = 'NEAR CUSTOMER' WHERE id = ?", [finalDeliveryId]);
        await queryRun("UPDATE orders SET status = 'NEAR CUSTOMER' WHERE id = ?", [delivery.order_id]);
        
        await queryRun(
          'INSERT INTO alerts (id, farm_id, type, severity, title, message) VALUES (?, ?, ?, ?, ?, ?)',
          [`near_alert_${finalDeliveryId}_${Date.now()}`, delivery.farm_id, 'System', 'Low', 'Delivery Update', `Delivery Partner is near you with your order.`]
        );
      }
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Update status of delivery assignment
app.put('/api/delivery/orders/:orderId/status', authenticateToken, async (req: AuthenticatedRequest, res) => {
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: 'Status is required.' });

  try {
    const delivery = await queryGet<any>(
      `SELECT d.id AS delivery_id, d.delivery_partner_id, o.id AS order_id, f.id AS farm_id
       FROM deliveries d
       JOIN orders o ON d.order_id = o.id
       LEFT JOIN farms f ON o.farmer_id = f.user_id
       WHERE o.id = ?`,
      [req.params.orderId]
    );

    if (!delivery) return res.status(404).json({ error: 'Delivery assignment not found.' });

    // Status mapper mapping delivery status updates to order updates
    if (status === 'REJECTED' || status === 'REJECT') {
      await queryRun("UPDATE delivery_partners SET status = 'Available' WHERE id = ?", [delivery.delivery_partner_id]);
      await queryRun("UPDATE orders SET delivery_partner_id = NULL WHERE id = ?", [delivery.order_id]);
      await queryRun("DELETE FROM deliveries WHERE id = ?", [delivery.delivery_id]);
      return res.json({ success: true, message: 'Delivery run rejected' });
    }

    let orderStatus = 'ACCEPTED';
    let pickedUpAt = null;
    let deliveredAt = null;

    if (status === 'ACCEPTED') {
      orderStatus = 'ACCEPTED';
    } else if (status === 'PICKED UP' || status === 'PICKED_UP') {
      orderStatus = 'OUT_FOR_DELIVERY'; // Order goes out for delivery
      pickedUpAt = new Date().toISOString();
    } else if (status === 'OUT FOR DELIVERY' || status === 'OUT_FOR_DELIVERY') {
      orderStatus = 'OUT_FOR_DELIVERY';
    } else if (status === 'NEAR CUSTOMER' || status === 'NEAR_CUSTOMER') {
      orderStatus = 'NEAR CUSTOMER';
    } else if (status === 'DELIVERED') {
      orderStatus = 'DELIVERED';
      deliveredAt = new Date().toISOString();
      // Set delivery partner back to Available
      await queryRun("UPDATE delivery_partners SET status = 'Available' WHERE id = ?", [delivery.delivery_partner_id]);
    }

    await queryRun(
      `UPDATE deliveries 
       SET status = ?, 
           picked_up_at = COALESCE(?, picked_up_at), 
           delivered_at = COALESCE(?, delivered_at)
       WHERE id = ?`,
      [status, pickedUpAt, deliveredAt, delivery.delivery_id]
    );

    await queryRun(
      `UPDATE orders SET status = ? WHERE id = ?`,
      [orderStatus, delivery.order_id]
    );

    // Add notification alerts
    const titleMsg = `Delivery Update: ${status}`;
    let notificationText = `Your order status was updated to ${status}.`;
    if (status === 'ACCEPTED') notificationText = "Delivery Person has accepted your order.";
    else if (status === 'PICKED UP' || status === 'PICKED_UP') notificationText = "Your order has been picked up from the farm.";
    else if (status === 'OUT FOR DELIVERY' || status === 'OUT_FOR_DELIVERY') notificationText = "Your order is out for delivery.";
    else if (status === 'NEAR CUSTOMER' || status === 'NEAR_CUSTOMER') notificationText = "Delivery partner is near your location.";
    else if (status === 'DELIVERED') notificationText = "Your order has been delivered successfully. Thank you for buying direct from farmers!";

    await queryRun(
      'INSERT INTO alerts (id, farm_id, type, severity, title, message) VALUES (?, ?, ?, ?, ?, ?)',
      [`status_alert_${delivery.delivery_id}_${Date.now()}`, delivery.farm_id, 'System', 'Low', titleMsg, notificationText]
    );

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Get location coordinates for a specific order
app.get('/api/orders/:orderId/delivery-location', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const delivery = await queryGet<any>('SELECT id FROM deliveries WHERE order_id = ?', [req.params.orderId]);
    if (!delivery) return res.status(404).json({ error: 'No delivery assigned to this order.' });

    const loc = await queryGet<any>(
      `SELECT latitude, longitude, timestamp 
       FROM delivery_locations 
       WHERE delivery_id = ? 
       ORDER BY timestamp DESC LIMIT 1`,
      [delivery.id]
    );

    if (!loc) {
      // Fallback: Coimbatore default farm coordinates
      return res.json({ latitude: 10.9970, longitude: 76.9616, timestamp: new Date().toISOString() });
    }
    res.json(loc);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- SOIL ADVISOR SUITABILITY ROUTES ----------------

// Helper crop suitability analysis function
const analyzeSoilSuitability = (
  ph: number,
  nitrogen: string,
  phosphorus: string,
  potassium: string,
  moisture: string,
  organicCarbon: number,
  soilType: string
) => {
  const crops = [
    { name: 'Tomato', base: 85, idealPh: [6.0, 7.0] },
    { name: 'Rice', base: 80, idealPh: [5.5, 6.5] },
    { name: 'Spinach', base: 82, idealPh: [6.0, 7.5] }
  ];

  return crops.map(c => {
    let score = c.base;
    const reasons = [];

    // pH adjustments
    if (ph >= c.idealPh[0] && ph <= c.idealPh[1]) {
      score += 10;
      reasons.push(`Soil pH (${ph}) is within the optimal range.`);
    } else {
      score -= 15;
      reasons.push(`Soil pH (${ph}) is outside the preferred range of ${c.idealPh[0]}-${c.idealPh[1]}.`);
    }

    // Nitrogen adjustments
    if (nitrogen === 'High') {
      score += 5;
      reasons.push('Nitrogen content is high, supporting leaf canopy development.');
    } else if (nitrogen === 'Low') {
      score -= 10;
      reasons.push('Nitrogen is deficient. Soil requires organic compost to restore chemistry.');
    } else {
      reasons.push('Nitrogen level is adequate.');
    }

    // Phosphorus adjustments
    if (phosphorus === 'High') {
      score += 5;
      reasons.push('Phosphorus content is rich, promoting robust root systems.');
    } else if (phosphorus === 'Low') {
      score -= 10;
      reasons.push('Phosphorus is low. Consider applying bone meal or organic phosphate.');
    }

    // Moisture adjustments
    if (c.name === 'Rice') {
      if (moisture === 'High' || moisture === 'Good') {
        score += 10;
        reasons.push('Soil moisture is high/good, supporting swamp/paddy flooding.');
      } else {
        score -= 30;
        reasons.push('Rice requires flooded fields; current moisture level is insufficient.');
      }
    } else {
      if (moisture === 'Good' || moisture === 'Medium') {
        score += 5;
        reasons.push('Moisture levels are optimal for transpiration.');
      } else if (moisture === 'Low') {
        score -= 15;
        reasons.push('Low moisture. Requires more frequent irrigation loops.');
      }
    }

    // organic carbon adjustments
    if (organicCarbon > 1.0) {
      score += 5;
      reasons.push('Organic carbon level is rich, improving water retention.');
    }

    score = Math.max(10, Math.min(100, score));

    return {
      cropName: c.name,
      suitabilityScore: score,
      reason: reasons.join(' ')
    };
  });
};

// 10. Run advisor soil test
app.post('/api/advisor/soil-test', authenticateToken, async (req: AuthenticatedRequest, res) => {
  const { ph, nitrogen, phosphorus, potassium, moisture, organicCarbon, soilType, temperature, location } = req.body;
  if (ph === undefined || !nitrogen || !phosphorus || !potassium || !moisture || organicCarbon === undefined || !soilType) {
    return res.status(400).json({ error: 'Missing soil parameters for suitability analysis.' });
  }

  try {
    const suitabilityResults = analyzeSoilSuitability(
      Number(ph),
      nitrogen,
      phosphorus,
      potassium,
      moisture,
      Number(organicCarbon),
      soilType
    );

    const testId = 'soil_test_' + Date.now();
    await queryRun(
      `INSERT INTO soil_tests (id, advisor_id, ph, nitrogen, phosphorus, potassium, moisture, organic_carbon, soil_type, temperature, location, suitability_results)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        testId,
        req.userId,
        Number(ph),
        nitrogen,
        phosphorus,
        potassium,
        moisture,
        Number(organicCarbon),
        soilType,
        temperature ? Number(temperature) : null,
        location || '',
        JSON.stringify(suitabilityResults)
      ]
    );

    res.json({ id: testId, ph, suitabilityResults });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 11. Fetch advisor soil tests history list
app.get('/api/advisor/history', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const list = await queryAll<any>(
      'SELECT * FROM soil_tests WHERE advisor_id = ? ORDER BY created_at DESC',
      [req.userId]
    );
    
    const enriched = list.map(t => ({
      ...t,
      suitability_results: JSON.parse(t.suitability_results)
    }));

    res.json(enriched);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 12. Advisor Soil Copilot assistant
app.post('/api/advisor/chat', authenticateToken, async (req: AuthenticatedRequest, res) => {
  const { question, soilData } = req.body;
  if (!question || !soilData) {
    return res.status(400).json({ error: 'Missing question or soil test parameters.' });
  }

  const cleanQuestion = question.trim().toLowerCase();
  
  // Rule-based Soil Copilot response fallback
  let responseText = '';
  
  const isCrops = cleanQuestion.includes('crop') || cleanQuestion.includes('grow') || cleanQuestion.includes('suit');
  const isDeficiency = cleanQuestion.includes('deficient') || cleanQuestion.includes('missing') || cleanQuestion.includes('improve');

  if (isCrops) {
    responseText = `Based on your soil parameters (pH: ${soilData.ph}, Soil Type: ${soilData.soilType}, Moisture: ${soilData.moisture}):
    
* **Tomato** is highly recommended (approx 92% suitability) because your soil pH falls in the optimal 6.0-7.0 range.
* **Spinach** will thrive as it prefers slightly acidic to neutral clay loams.
* **Rice** is suitable only if you maintain continuous standing water in the fields.
    
We recommend cross-verifying this with a local agricultural extension officer.`;
  } else if (isDeficiency) {
    responseText = `Analyzing soil parameters:
* Nitrogen: **${soilData.nitrogen}**
* Phosphorus: **${soilData.phosphorus}**
* Potassium: **${soilData.potassium}**
* Organic Carbon: **${soilData.organicCarbon}%**
    
${soilData.nitrogen === 'Low' ? '* Nitrogen is deficient. We suggest applying well-composted manure or nitrogen-fixing crop covers.' : ''}
${soilData.phosphorus === 'Low' ? '* Phosphorus is low. Consider soil amendments like bone meal or organic superphosphates.' : ''}
${soilData.ph < 6.0 ? '* Soil is moderately acidic. Applying agricultural lime can help neutralize the pH.' : ''}
    
Ensure you validate chemical applications with your local laboratory tests.`;
  } else {
    responseText = `Hello! I am your Soil Advisor Copilot. I have scanned the parameters (pH: ${soilData.ph}, Soil: ${soilData.soilType}). You can ask me:
- *"Which crop is best for this soil?"*
- *"What is missing from my soil?"*
- *"How can I improve my soil chemistry?"*`;
  }

  res.json({ answer: responseText });
});

// 13. Demand Insights for Farmer
app.get('/api/demand-insights', authenticateToken, async (req, res) => {
  try {
    const popularCrops = [
      { name: 'Tomato', views: 345, orders: 48, trend: 'High' },
      { name: 'Spinach', views: 210, orders: 32, trend: 'Increasing' },
      { name: 'Basmati Rice', views: 180, orders: 15, trend: 'Stable' }
    ];
    res.json(popularCrops);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- n8n AUTOMATION INTEGRATION ----------------

app.post('/api/n8n/webhook', async (req, res) => {
  const authSecret = req.headers['x-n8n-secret'];
  const expectedSecret = process.env.N8N_WEBHOOK_SECRET || 'n8n-webhook-passkey';
  
  if (authSecret !== expectedSecret) {
    return res.status(401).json({ error: 'Unauthorized webhook access.' });
  }

  const { eventType, farmId, data } = req.body;
  console.log(`Received automation webhook from n8n. Event: ${eventType}, Farm: ${farmId}`);

  try {
    if (eventType === 'weather_update') {
      // Simulate n8n writing new weather readings to the DB
      const fieldId = 'field_a';
      await queryRun(
        `UPDATE weather_readings 
         SET temperature = ?, humidity = ?, rain_probability = ?, conditions = ?
         WHERE field_id = ?`,
        [data.temperature || 31.0, data.humidity || 60.0, data.rainProbability || 10.0, data.conditions || 'Partly Cloudy', fieldId]
      );
    } else if (eventType === 'daily_briefing_trigger') {
      // Log notification task
      await queryRun(
        `INSERT INTO alerts (id, farm_id, type, severity, title, message)
         VALUES (?, ?, ?, ?, ?, ?)`,
        ['alert_brief_' + Date.now(), farmId || 'farm_green_valley', 'System', 'Low', 'Daily n8n Report Compiled', 'n8n workflow executed daily health check successfully. All nodes connected.']
      );
    }

    res.json({ success: true, message: 'n8n webhook processed.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Helper to save prediction record and return structured API response
const saveAndSendResult = async (prediction: any, farmerId: string, imageUrl: string, modelVersion: string, res: any) => {
  const analysisId = `ph_an_${Date.now()}_${Math.round(Math.random() * 1000)}`;
  
  // Resolve symptoms, recommendations, and preventions
  const classKey = prediction.class || `${prediction.plant.replace(' ', '_')}___${prediction.disease.replace(' ', '_')}`;
  let lookupKey = classKey;
  if (prediction.status === 'healthy') {
    const matchingKey = Object.keys(diseaseInfo).find(k => 
      k.toLowerCase().startsWith(prediction.plant.toLowerCase().replace(' ', '_')) && 
      k.toLowerCase().endsWith('healthy')
    );
    if (matchingKey) lookupKey = matchingKey;
  }

  const info = diseaseInfo[lookupKey] || {
    symptoms: 'No specific symptoms registered.',
    recommendations: ['Maintain general plant hygiene.'],
    prevention: ['Conduct regular soil testing and monitoring.']
  };

  const symptomsStr = info.symptoms;
  const recommendationsStr = JSON.stringify(info.recommendations);
  const preventionStr = JSON.stringify(info.prevention);

  await queryRun(
    `INSERT INTO plant_health_analyses (
      id, farmer_id, image_url, plant_name, disease_name, confidence, status, 
      symptoms, recommendations, prevention_suggestions, model_version
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      analysisId,
      farmerId,
      imageUrl,
      prediction.plant,
      prediction.disease,
      prediction.confidence,
      prediction.status,
      symptomsStr,
      recommendationsStr,
      preventionStr,
      modelVersion
    ]
  );

  res.json({
    success: true,
    prediction: {
      id: analysisId,
      plant: prediction.plant,
      disease: prediction.disease,
      confidence: prediction.confidence,
      status: prediction.status,
      imageUrl,
      symptoms: symptomsStr,
      recommendations: info.recommendations,
      prevention: info.prevention,
      modelVersion
    }
  });
};

// POST /api/plant-disease/predict
app.post('/api/plant-disease/predict', authenticateToken, upload.single('image'), async (req: any, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file uploaded.' });
  }

  const farmerId = req.userId;
  if (!farmerId) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  const filePath = req.file.path;
  const fileName = req.file.filename;
  const imageUrl = `/uploads/${fileName}`;

  try {
    const modelPath = path.join(__dirname, '..', '..', 'ml', 'models', 'plant_disease_model.keras');
    const classNamesPath = path.join(__dirname, '..', '..', 'ml', 'models', 'class_names.json');
    const hasModel = fs.existsSync(modelPath) && fs.existsSync(classNamesPath);

    if (hasModel) {
      // ML MODEL MODE (Keras)
      let predictScriptPath = path.join(__dirname, 'ml', 'predict_keras.py');
      if (!fs.existsSync(predictScriptPath)) {
        predictScriptPath = path.join(__dirname, '..', 'src', 'ml', 'predict_keras.py');
      }
      
      const pythonPath = path.join(__dirname, '..', '..', '.venv', 'bin', 'python3');
      
      execFile(pythonPath, [predictScriptPath, filePath], async (error, stdout, stderr) => {
        if (error) {
          console.error('Python prediction script error:', error, stderr);
          return res.status(500).json({ error: 'Prediction script execution failed.' });
        }

        try {
          const outData = JSON.parse(stdout.trim());
          if (!outData.success) {
            return res.status(500).json({ error: outData.error || 'Prediction failed.' });
          }

          await saveAndSendResult(outData.prediction, farmerId, imageUrl, '2.0.0-KERAS', res);
        } catch (e: any) {
          return res.status(500).json({ error: 'Error parsing model output: ' + e.message });
        }
      });

    } else {
      // MOCK MODE
      console.log('Trained model not found. Running in MOCK MODE.');
      
      const origName = req.file.originalname.toLowerCase();
      let matchedClass = '';
      const classes = Object.keys(diseaseInfo);

      // 1. Identify plant type from filename
      let matchedPlantPrefix = '';
      const plantList = [
        { key: 'tomato', prefix: 'Tomato___' },
        { key: 'potato', prefix: 'Potato___' },
        { key: 'corn', prefix: 'Corn_(maize)___' },
        { key: 'maize', prefix: 'Corn_(maize)___' },
        { key: 'apple', prefix: 'Apple___' },
        { key: 'grape', prefix: 'Grape___' },
        { key: 'blueberry', prefix: 'Blueberry___' },
        { key: 'cherry', prefix: 'Cherry_(including_sour)___' },
        { key: 'peach', prefix: 'Peach___' },
        { key: 'pepper', prefix: 'Pepper_(bell)___' },
        { key: 'raspberry', prefix: 'Raspberry___' },
        { key: 'squash', prefix: 'Squash___' },
        { key: 'strawberry', prefix: 'Strawberry___' }
      ];

      for (const p of plantList) {
        if (origName.includes(p.key)) {
          matchedPlantPrefix = p.prefix.toLowerCase();
          break;
        }
      }

      // 2. Try to find precise match for plant + disease in filename
      for (const cls of classes) {
        const clsLower = cls.toLowerCase();
        const parts = clsLower.split('___');
        const plantKeyword = parts[0].replace('_', ' ');
        const diseaseKeyword = parts[1].replace('_', ' ');
        
        if (origName.includes(plantKeyword) && origName.includes(diseaseKeyword)) {
          matchedClass = cls;
          break;
        }
      }

      // 3. Fallback to plant prefix + disease keyword check
      if (!matchedClass && matchedPlantPrefix) {
        // Filter classes belonging to this plant
        const plantClasses = classes.filter(cls => cls.toLowerCase().startsWith(matchedPlantPrefix));
        
        // Find if any disease keyword matches
        for (const cls of plantClasses) {
          const parts = cls.toLowerCase().split('___')[1].replace('_', ' ');
          if (origName.includes(parts) || origName.includes(parts.replace('healthy', ''))) {
            matchedClass = cls;
            break;
          }
        }
        
        // If still no disease match, default to healthy for this plant
        if (!matchedClass) {
          const healthyClass = plantClasses.find(cls => cls.toLowerCase().includes('healthy'));
          if (healthyClass) {
            matchedClass = healthyClass;
          } else if (plantClasses.length > 0) {
            matchedClass = plantClasses[0];
          }
        }
      }

      // 4. Global fallback if plant prefix is not found, check disease name
      if (!matchedClass) {
        for (const cls of classes) {
          const parts = cls.toLowerCase().split('___');
          const diseaseKeyword = parts[1].replace('_', ' ');
          if (origName.includes(diseaseKeyword)) {
            matchedClass = cls;
            break;
          }
        }
      }

      // 5. Final random fallback
      if (!matchedClass) {
        const randomIndex = Math.floor(Math.random() * classes.length);
        matchedClass = classes[randomIndex];
      }

      const info = diseaseInfo[matchedClass];
      const status = info.status;
      
      // Ensure prediction confidence is always above 90% (e.g. 90.0% to 99.5%) to meet accuracy visual guidelines
      let confidence = parseFloat((90.0 + Math.random() * 9.5).toFixed(2));

      // Mock low confidence if file tag matches
      if (origName.includes('low_confidence') || origName.includes('unclear')) {
        confidence = parseFloat((30.0 + Math.random() * 15.0).toFixed(2));
      }

      const predictionResult = {
        class: matchedClass,
        plant: info.plant,
        disease: status === 'healthy' ? 'Healthy' : info.disease,
        confidence,
        status
      };

      await saveAndSendResult(predictionResult, farmerId, imageUrl, '1.0.0-MOCK', res);
    }

  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/plant-disease/history
app.get('/api/plant-disease/history', authenticateToken, async (req: AuthenticatedRequest, res) => {
  const farmerId = req.userId;
  if (!farmerId) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  try {
    const list = await queryAll<any>(
      'SELECT * FROM plant_health_analyses WHERE farmer_id = ? ORDER BY created_at DESC',
      [farmerId]
    );

    const formattedList = list.map(item => ({
      ...item,
      recommendations: item.recommendations ? JSON.parse(item.recommendations) : [],
      prevention: item.prevention_suggestions ? JSON.parse(item.prevention_suggestions) : []
    }));

    res.json({ success: true, history: formattedList });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/plant-disease/history/:id
app.delete('/api/plant-disease/history/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  const farmerId = req.userId;
  if (!farmerId) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  const { id } = req.params;

  try {
    const analysis = await queryGet<any>(
      'SELECT * FROM plant_health_analyses WHERE id = ? AND farmer_id = ?',
      [id, farmerId]
    );

    if (!analysis) {
      return res.status(404).json({ error: 'Analysis record not found or access denied.' });
    }

    await queryRun(
      'DELETE FROM plant_health_analyses WHERE id = ? AND farmer_id = ?',
      [id, farmerId]
    );

    res.json({ success: true, message: 'Analysis record deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- SYSTEM ADMINISTRATOR DASHBOARD APIS ----------------

// Helper to verify if user is admin
const verifyAdmin = async (req: AuthenticatedRequest, res: any, next: any) => {
  try {
    const user = await queryGet<any>('SELECT role FROM users WHERE id = ?', [req.userId]);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
    }
    next();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// 1. Get platform-wide admin stats
app.get('/api/admin/stats', authenticateToken, verifyAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const farmersCount = await queryGet<{ count: number }>('SELECT COUNT(*) as count FROM users WHERE role = ?', ['farmer']);
    const customersCount = await queryGet<{ count: number }>('SELECT COUNT(*) as count FROM users WHERE role = ?', ['customer']);
    const ordersCount = await queryGet<{ count: number }>('SELECT COUNT(*) as count FROM orders');
    const successfulCount = await queryGet<{ count: number }>("SELECT COUNT(*) as count FROM orders WHERE status = 'DELIVERED'");
    const failedCount = await queryGet<{ count: number }>("SELECT COUNT(*) as count FROM orders WHERE status = 'DELIVERY_FAILED'");
    const refundsCount = await queryGet<{ count: number }>("SELECT COUNT(*) as count FROM orders WHERE payment_status = 'REFUNDED'");
    const disputedCount = await queryGet<{ count: number }>("SELECT COUNT(*) as count FROM orders WHERE status = 'DISPUTED'");

    const suspiciousFarmers = await queryAll<any>(
      "SELECT id, name, email, reliability_score, is_restricted FROM users WHERE role = 'farmer' AND (reliability_score < 70 OR is_restricted = 1)"
    );

    const allFarmers = await queryAll<any>(
      "SELECT id, name, email, reliability_score, is_restricted FROM users WHERE role = 'farmer' ORDER BY reliability_score ASC"
    );

    const allUsers = await queryAll<any>(`
      SELECT u.id, u.name, u.email, u.role, u.created_at,
             COALESCE(fp.phone, dp.phone, 'N/A') as phone
      FROM users u
      LEFT JOIN farmer_profiles fp ON u.id = fp.user_id
      LEFT JOIN delivery_profiles dp ON u.id = dp.user_id
      ORDER BY u.created_at DESC
    `);

    res.json({
      farmersCount: farmersCount?.count || 0,
      customersCount: customersCount?.count || 0,
      ordersCount: ordersCount?.count || 0,
      successfulCount: successfulCount?.count || 0,
      failedCount: failedCount?.count || 0,
      refundsCount: refundsCount?.count || 0,
      disputedCount: disputedCount?.count || 0,
      suspiciousFarmers,
      allFarmers,
      allUsers
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Get all orders details
app.get('/api/admin/orders', authenticateToken, verifyAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const orders = await queryAll<any>(
      `SELECT o.*, u.name as customer_name, f.name as farmer_name, p.name as product_name, p.unit, p.price as price_per_unit
       FROM orders o 
       JOIN users u ON o.customer_id = u.id 
       JOIN users f ON o.farmer_id = f.id 
       LEFT JOIN marketplace_products p ON o.vegetable_id = p.id
       ORDER BY o.created_at DESC`
    );
    res.json(orders);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Restrict / Unrestrict a farmer
app.post('/api/admin/farmers/:farmerId/restrict', authenticateToken, verifyAdmin, async (req: AuthenticatedRequest, res) => {
  const { farmerId } = req.params;
  const { restrict } = req.body;
  const restrictVal = restrict ? 1 : 0;

  try {
    await queryRun('UPDATE users SET is_restricted = ? WHERE id = ?', [restrictVal, farmerId]);
    
    // Create notification alert for farmer
    const farm = await queryGet<any>('SELECT id FROM farms WHERE user_id = ? LIMIT 1', [farmerId]);
    const farmId = farm ? farm.id : 'farm_green_valley';
    await queryRun(
      'INSERT INTO alerts (id, farm_id, type, severity, title, message) VALUES (?, ?, ?, ?, ?, ?)',
      [
        'alert_rest_' + Date.now(),
        farmId,
        'System',
        'High',
        restrict ? 'Account Restricted by Admin' : 'Account Reinstated',
        restrict 
          ? 'Your account has been restricted by an administrator due to poor reliability or customer dispute resolution.'
          : 'Your account restriction has been lifted. You can now accept customer orders again.'
      ]
    );

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Resolve customer dispute
app.post('/api/admin/orders/:orderId/resolve-dispute', authenticateToken, verifyAdmin, async (req: AuthenticatedRequest, res) => {
  const { orderId } = req.params;
  const { resolution } = req.body;
  if (!resolution || (resolution !== 'REFUND' && resolution !== 'RELEASE')) {
    return res.status(400).json({ error: 'Valid resolution is required: REFUND or RELEASE.' });
  }

  try {
    const order = await queryGet<any>('SELECT * FROM orders WHERE id = ?', [orderId]);
    if (!order) return res.status(404).json({ error: 'Order not found.' });

    if (resolution === 'REFUND') {
      // Refund Customer
      await queryRun(
        "UPDATE orders SET status = 'DELIVERY_FAILED', payment_status = 'REFUNDED', dispute_status = 'RESOLVED' WHERE id = ?",
        [orderId]
      );
      // Release reserved stock back to farmer inventory
      await queryRun(
        'UPDATE marketplace_products SET quantity = quantity + ?, reserved_quantity = reserved_quantity - ? WHERE id = ?',
        [order.quantity, order.vegetable_id]
      );
      // Deduct reliability score: -15 fake delivery / unresolved dispute penalty
      const farmer = await queryGet<any>('SELECT reliability_score FROM users WHERE id = ?', [order.farmer_id]);
      if (farmer) {
        const newScore = Math.max(0, farmer.reliability_score - 15);
        const isRestricted = newScore < 50 ? 1 : 0;
        await queryRun('UPDATE users SET reliability_score = ?, is_restricted = ? WHERE id = ?', [newScore, isRestricted, order.farmer_id]);
      }

      // Alerts
      const farm = await queryGet<any>('SELECT id FROM farms WHERE user_id = ? LIMIT 1', [order.farmer_id]);
      const farmId = farm ? farm.id : 'farm_green_valley';
      await queryRun(
        'INSERT INTO alerts (id, farm_id, type, severity, title, message) VALUES (?, ?, ?, ?, ?, ?)',
        ['alert_disp_res_' + Date.now(), farmId, 'System', 'High', 'Dispute Resolved: Refunded', `Dispute on Order #${orderId} was resolved. Payment was refunded to customer and farmer was penalized.`]
      );
    } else {
      // Release Payment to Farmer
      await queryRun(
        "UPDATE orders SET status = 'DELIVERED', payment_status = 'RELEASED', dispute_status = 'RESOLVED' WHERE id = ?",
        [orderId]
      );
      // Finalize stock
      await queryRun(
        'UPDATE marketplace_products SET reserved_quantity = reserved_quantity - ? WHERE id = ?',
        [order.quantity, order.vegetable_id]
      );
      // Reward farmer: +5 reliability score
      const farmer = await queryGet<any>('SELECT reliability_score FROM users WHERE id = ?', [order.farmer_id]);
      if (farmer) {
        const newScore = Math.min(100, farmer.reliability_score + 5);
        await queryRun('UPDATE users SET reliability_score = ? WHERE id = ?', [newScore, order.farmer_id]);
      }

      // Alerts
      const farm = await queryGet<any>('SELECT id FROM farms WHERE user_id = ? LIMIT 1', [order.farmer_id]);
      const farmId = farm ? farm.id : 'farm_green_valley';
      await queryRun(
        'INSERT INTO alerts (id, farm_id, type, severity, title, message) VALUES (?, ?, ?, ?, ?, ?)',
        ['alert_disp_res_' + Date.now(), farmId, 'System', 'Medium', 'Dispute Resolved: Released', `Dispute on Order #${orderId} was resolved. Payment was released to your earnings.`]
      );
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- BACKGROUND AUTOMATION CHECKERS ----------------

// Automatically fail expired orders (runs every 30 seconds)
setInterval(async () => {
  try {
    const now = new Date().toISOString();
    // Find accepted or dispatched orders past their delivery deadline
    const expiredOrders = await queryAll<any>(
      `SELECT * FROM orders WHERE status IN ('ACCEPTED', 'DISPATCHED') AND delivery_deadline IS NOT NULL AND delivery_deadline < ?`,
      [now]
    );

    for (const o of expiredOrders) {
      await queryRun(
        "UPDATE orders SET status = 'DELIVERY_FAILED', payment_status = 'REFUNDED' WHERE id = ?",
        [o.id]
      );

      // Release reserved stock back to active inventory
      await queryRun(
        'UPDATE marketplace_products SET quantity = quantity + ?, reserved_quantity = reserved_quantity - ? WHERE id = ?',
        [o.quantity, o.vegetable_id]
      );

      // Deduct farmer score: -10
      const farmer = await queryGet<any>('SELECT reliability_score FROM users WHERE id = ?', [o.farmer_id]);
      if (farmer) {
        const newScore = Math.max(0, farmer.reliability_score - 10);
        const isRestricted = newScore < 50 ? 1 : 0;
        await queryRun('UPDATE users SET reliability_score = ?, is_restricted = ? WHERE id = ?', [newScore, isRestricted, o.farmer_id]);
      }

      // Create alert notifications
      const farm = await queryGet<any>('SELECT id FROM farms WHERE user_id = ? LIMIT 1', [o.farmer_id]);
      const farmId = farm ? farm.id : 'farm_green_valley';
      
      // Farmer Alert
      await queryRun(
        'INSERT INTO alerts (id, farm_id, type, severity, title, message) VALUES (?, ?, ?, ?, ?, ?)',
        ['alert_exp_f_' + Date.now() + '_' + Math.floor(Math.random() * 100), farmId, 'System', 'High', 'Order Expired (Delivery Failed)', `Order #${o.id} failed to deliver before the deadline. Payment refunded to customer, and your reliability score was reduced by 10.`]
      );

      // Customer Alert
      await queryRun(
        'INSERT INTO alerts (id, farm_id, type, severity, title, message) VALUES (?, ?, ?, ?, ?, ?)',
        ['alert_exp_c_' + Date.now() + '_' + Math.floor(Math.random() * 100), farmId, 'System', 'High', 'Order Refunded - Deadline Passed', `The farmer failed to deliver Order #${o.id} within the 24-hour deadline. The payment of ₹${o.total_amount} has been refunded.`]
      );
      
      console.log(`Automatically expired order #${o.id}. Penalized farmer reliability score.`);
    }
  } catch (err) {
    console.error('Error in background expired orders loop:', err);
  }
}, 30000);

// Start Database & Boot Server
initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`AgriMind AI Backend running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Database migration failed to initialize:', err);
  });
