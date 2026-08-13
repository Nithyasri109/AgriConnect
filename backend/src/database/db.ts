import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, 'agrimind.sqlite');

export const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error connecting to database:', err);
  } else {
    console.log('Connected to SQLite database at:', DB_PATH);
  }
});

// Helper wrapper to run sqlite queries as promises
export const queryRun = (sql: string, params: any[] = []): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve();
    });
  });
};

export const queryGet = <T>(sql: string, params: any[] = []): Promise<T | undefined> => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row as T);
    });
  });
};

export const queryAll = <T>(sql: string, params: any[] = []): Promise<T[]> => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows as T[]);
    });
  });
};

export const initDb = async () => {
  console.log('Initializing database tables...');
  
  await queryRun(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      remember_login_email TEXT,
      remember_login_password TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await queryRun(`
    CREATE TABLE IF NOT EXISTS farms (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      location TEXT NOT NULL,
      area REAL NOT NULL,
      soil_type TEXT NOT NULL,
      irrigation_type TEXT NOT NULL,
      water_source TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);

  await queryRun(`
    CREATE TABLE IF NOT EXISTS fields (
      id TEXT PRIMARY KEY,
      farm_id TEXT NOT NULL,
      name TEXT NOT NULL,
      area REAL NOT NULL,
      FOREIGN KEY(farm_id) REFERENCES farms(id)
    )
  `);

  await queryRun(`
    CREATE TABLE IF NOT EXISTS crops (
      id TEXT PRIMARY KEY,
      field_id TEXT NOT NULL,
      name TEXT NOT NULL,
      variety TEXT NOT NULL,
      planting_date TEXT NOT NULL,
      expected_harvest TEXT NOT NULL,
      growth_stage TEXT NOT NULL,
      area REAL NOT NULL,
      water_requirement INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(field_id) REFERENCES fields(id)
    )
  `);

  await queryRun(`
    CREATE TABLE IF NOT EXISTS soil_readings (
      id TEXT PRIMARY KEY,
      field_id TEXT NOT NULL,
      moisture REAL NOT NULL,
      nitrogen REAL NOT NULL,
      phosphorus REAL NOT NULL,
      potassium REAL NOT NULL,
      ph REAL NOT NULL,
      temperature REAL NOT NULL,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(field_id) REFERENCES fields(id)
    )
  `);

  await queryRun(`
    CREATE TABLE IF NOT EXISTS weather_readings (
      id TEXT PRIMARY KEY,
      field_id TEXT NOT NULL,
      temperature REAL NOT NULL,
      humidity REAL NOT NULL,
      rain_probability REAL NOT NULL,
      wind_speed REAL NOT NULL,
      conditions TEXT NOT NULL,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(field_id) REFERENCES fields(id)
    )
  `);

  await queryRun(`
    CREATE TABLE IF NOT EXISTS irrigation_records (
      id TEXT PRIMARY KEY,
      field_id TEXT NOT NULL,
      amount_liters REAL NOT NULL,
      water_saved_liters REAL NOT NULL,
      type TEXT NOT NULL,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(field_id) REFERENCES fields(id)
    )
  `);

  await queryRun(`
    CREATE TABLE IF NOT EXISTS crop_health (
      id TEXT PRIMARY KEY,
      crop_id TEXT NOT NULL,
      health_score REAL NOT NULL,
      observation TEXT,
      risk_indicators TEXT,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(crop_id) REFERENCES crops(id)
    )
  `);

  await queryRun(`
    CREATE TABLE IF NOT EXISTS disease_predictions (
      id TEXT PRIMARY KEY,
      crop_id TEXT NOT NULL,
      condition_detected TEXT NOT NULL,
      severity TEXT NOT NULL,
      confidence REAL NOT NULL,
      symptoms TEXT NOT NULL,
      recommended_action TEXT NOT NULL,
      image_url TEXT,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(crop_id) REFERENCES crops(id)
    )
  `);

  await queryRun(`
    CREATE TABLE IF NOT EXISTS pest_risks (
      id TEXT PRIMARY KEY,
      field_id TEXT NOT NULL,
      pest_name TEXT NOT NULL,
      risk_level TEXT NOT NULL,
      mitigation_action TEXT NOT NULL,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(field_id) REFERENCES fields(id)
    )
  `);

  await queryRun(`
    CREATE TABLE IF NOT EXISTS fertilizer_records (
      id TEXT PRIMARY KEY,
      field_id TEXT NOT NULL,
      nutrient TEXT NOT NULL,
      status TEXT NOT NULL,
      amount_recommended TEXT NOT NULL,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(field_id) REFERENCES fields(id)
    )
  `);

  await queryRun(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      farm_id TEXT NOT NULL,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      due_date TEXT NOT NULL,
      status TEXT NOT NULL,
      priority TEXT NOT NULL,
      description TEXT,
      FOREIGN KEY(farm_id) REFERENCES farms(id)
    )
  `);

  await queryRun(`
    CREATE TABLE IF NOT EXISTS recommendations (
      id TEXT PRIMARY KEY,
      field_id TEXT NOT NULL,
      recommendation TEXT NOT NULL,
      reason TEXT NOT NULL,
      data_used TEXT NOT NULL,
      confidence REAL NOT NULL,
      expected_benefit TEXT NOT NULL,
      priority TEXT NOT NULL,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(field_id) REFERENCES fields(id)
    )
  `);

  await queryRun(`
    CREATE TABLE IF NOT EXISTS recommendation_feedback (
      id TEXT PRIMARY KEY,
      recommendation_id TEXT NOT NULL,
      action TEXT NOT NULL,
      comment TEXT,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(recommendation_id) REFERENCES recommendations(id)
    )
  `);

  await queryRun(`
    CREATE TABLE IF NOT EXISTS alerts (
      id TEXT PRIMARY KEY,
      farm_id TEXT NOT NULL,
      type TEXT NOT NULL,
      severity TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(farm_id) REFERENCES farms(id)
    )
  `);

  await queryRun(`
    CREATE TABLE IF NOT EXISTS farm_health_scores (
      id TEXT PRIMARY KEY,
      farm_id TEXT NOT NULL,
      score REAL NOT NULL,
      soil REAL NOT NULL,
      water REAL NOT NULL,
      crop REAL NOT NULL,
      weather REAL NOT NULL,
      disease REAL NOT NULL,
      pest REAL NOT NULL,
      nutrition REAL NOT NULL,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(farm_id) REFERENCES farms(id)
    )
  `);

  await queryRun(`
    CREATE TABLE IF NOT EXISTS sustainability_scores (
      id TEXT PRIMARY KEY,
      farm_id TEXT NOT NULL,
      score REAL NOT NULL,
      water_efficiency REAL NOT NULL,
      soil_health REAL NOT NULL,
      resource_conservation REAL NOT NULL,
      crop_diversity REAL NOT NULL,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(farm_id) REFERENCES farms(id)
    )
  `);

  // New Marketplace, Orders, and Advisor tables
  await queryRun(`
    CREATE TABLE IF NOT EXISTS marketplace_products (
      id TEXT PRIMARY KEY,
      farmer_id TEXT NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      crop TEXT NOT NULL,
      variety TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit TEXT NOT NULL,
      price REAL NOT NULL,
      harvest_date TEXT NOT NULL,
      quality TEXT NOT NULL,
      description TEXT,
      image_url TEXT,
      status TEXT DEFAULT 'ACTIVE',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(farmer_id) REFERENCES users(id)
    )
  `);

  await queryRun(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL,
      farmer_id TEXT NOT NULL,
      total_amount REAL NOT NULL,
      status TEXT NOT NULL,
      shipping_name TEXT NOT NULL,
      shipping_phone TEXT NOT NULL,
      shipping_address TEXT NOT NULL,
      delivery_preference TEXT NOT NULL,
      order_notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(customer_id) REFERENCES users(id),
      FOREIGN KEY(farmer_id) REFERENCES users(id)
    )
  `);

  await queryRun(`
    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      quantity REAL NOT NULL,
      price REAL NOT NULL,
      FOREIGN KEY(order_id) REFERENCES orders(id),
      FOREIGN KEY(product_id) REFERENCES marketplace_products(id)
    )
  `);

  await queryRun(`
    CREATE TABLE IF NOT EXISTS soil_tests (
      id TEXT PRIMARY KEY,
      advisor_id TEXT NOT NULL,
      ph REAL NOT NULL,
      nitrogen TEXT NOT NULL,
      phosphorus TEXT NOT NULL,
      potassium TEXT NOT NULL,
      moisture TEXT NOT NULL,
      organic_carbon REAL NOT NULL,
      soil_type TEXT NOT NULL,
      temperature REAL,
      location TEXT,
      suitability_results TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(advisor_id) REFERENCES users(id)
    )
  `);

  await queryRun(`
    CREATE TABLE IF NOT EXISTS delivery_partners (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      vehicle_type TEXT NOT NULL,
      vehicle_number TEXT NOT NULL,
      avatar_url TEXT,
      status TEXT DEFAULT 'Available'
    )
  `);

  await queryRun(`
    CREATE TABLE IF NOT EXISTS deliveries (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      delivery_partner_id TEXT NOT NULL,
      status TEXT NOT NULL,
      assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      picked_up_at TEXT,
      delivered_at TEXT,
      estimated_arrival_minutes INTEGER,
      remaining_distance_km REAL,
      FOREIGN KEY(order_id) REFERENCES orders(id),
      FOREIGN KEY(delivery_partner_id) REFERENCES delivery_partners(id)
    )
  `);

  await queryRun(`
    CREATE TABLE IF NOT EXISTS delivery_locations (
      id TEXT PRIMARY KEY,
      delivery_id TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      speed REAL,
      heading REAL,
      accuracy REAL,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(delivery_id) REFERENCES deliveries(id)
    )
  `);

  try {
    await queryRun('ALTER TABLE delivery_locations ADD COLUMN accuracy REAL');
  } catch (e) {}

  // Ensure cancellation & coordinates columns exist in orders table
  try {
    await queryRun('ALTER TABLE orders ADD COLUMN cancelled_by TEXT');
  } catch (e) {}
  try {
    await queryRun('ALTER TABLE orders ADD COLUMN cancelled_at TEXT');
  } catch (e) {}
  try {
    await queryRun('ALTER TABLE orders ADD COLUMN cancellation_reason TEXT');
  } catch (e) {}
  try {
    await queryRun('ALTER TABLE orders ADD COLUMN latitude REAL');
  } catch (e) {}
  try {
    await queryRun('ALTER TABLE orders ADD COLUMN longitude REAL');
  } catch (e) {}
  try {
    await queryRun('ALTER TABLE orders ADD COLUMN city TEXT');
  } catch (e) {}
  try {
    await queryRun('ALTER TABLE orders ADD COLUMN state TEXT');
  } catch (e) {}
  try {
    await queryRun('ALTER TABLE orders ADD COLUMN pincode TEXT');
  } catch (e) {}
  try {
    await queryRun('ALTER TABLE orders ADD COLUMN accuracy REAL');
  } catch (e) {}
  try {
    await queryRun('ALTER TABLE orders ADD COLUMN location_source TEXT');
  } catch (e) {}

  // New columns for secure ordering and protection system
  try {
    await queryRun('ALTER TABLE users ADD COLUMN reliability_score INTEGER DEFAULT 100');
  } catch (e) {}
  try {
    await queryRun('ALTER TABLE users ADD COLUMN is_restricted INTEGER DEFAULT 0');
  } catch (e) {}
  try {
    await queryRun('ALTER TABLE marketplace_products ADD COLUMN reserved_quantity REAL DEFAULT 0');
  } catch (e) {}
  try {
    await queryRun('ALTER TABLE orders ADD COLUMN vegetable_id TEXT');
  } catch (e) {}
  try {
    await queryRun('ALTER TABLE orders ADD COLUMN quantity REAL');
  } catch (e) {}
  try {
    await queryRun('ALTER TABLE orders ADD COLUMN payment_status TEXT DEFAULT \'PENDING\'');
  } catch (e) {}
  try {
    await queryRun('ALTER TABLE orders ADD COLUMN delivery_otp TEXT');
  } catch (e) {}
  try {
    await queryRun('ALTER TABLE orders ADD COLUMN delivery_deadline TEXT');
  } catch (e) {}
  try {
    await queryRun('ALTER TABLE orders ADD COLUMN delivered_date TEXT');
  } catch (e) {}
  try {
    await queryRun('ALTER TABLE orders ADD COLUMN dispute_reason TEXT');
  } catch (e) {}
  try {
    await queryRun('ALTER TABLE orders ADD COLUMN dispute_status TEXT');
  } catch (e) {}
  try {
    await queryRun('ALTER TABLE orders ADD COLUMN otp_attempts INTEGER DEFAULT 0');
  } catch (e) {}

  await queryRun(`
    CREATE TABLE IF NOT EXISTS plant_health_analyses (
      id TEXT PRIMARY KEY,
      farmer_id TEXT NOT NULL,
      image_url TEXT NOT NULL,
      plant_name TEXT NOT NULL,
      disease_name TEXT NOT NULL,
      confidence REAL NOT NULL,
      status TEXT NOT NULL,
      symptoms TEXT,
      recommendations TEXT,
      prevention_suggestions TEXT,
      model_version TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(farmer_id) REFERENCES users(id)
    )
  `);
  await queryRun(`
    CREATE TABLE IF NOT EXISTS farmer_profiles (
      user_id TEXT PRIMARY KEY,
      farmer_name TEXT NOT NULL,
      phone TEXT,
      address TEXT,
      farm_location TEXT,
      crop_details TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await queryRun(`
    CREATE TABLE IF NOT EXISTS delivery_profiles (
      user_id TEXT PRIMARY KEY,
      delivery_person_name TEXT NOT NULL,
      phone TEXT,
      vehicle_type TEXT NOT NULL,
      availability TEXT DEFAULT 'Available',
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await seedData();
};

const seedData = async () => {
  const userCheck = await queryGet<{ count: number }>('SELECT count(*) as count FROM users');
  if (userCheck && userCheck.count > 0) {
    console.log('Database already populated, skipping seed.');
    return;
  }

  console.log('Seeding initial demo data with role separation...');
  
  // Seed System Administrator
  const adminId = 'usr_admin';
  const hashedAdminPw = await bcrypt.hash('admin123', 10);
  
  await queryRun(
    'INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)',
    [adminId, 'System Administrator', 'admin@agrimind.ai', hashedAdminPw, 'admin']
  );

  console.log('Seeding completed successfully!');
};

