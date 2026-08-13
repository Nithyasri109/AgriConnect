import { queryRun, queryGet, queryAll } from '../database/db.js';
import { RuleBasedIrrigationService } from './predictionServices.js';

export class DemoService {
  private irrigationService = new RuleBasedIrrigationService();

  async runSmartFarmDemo(): Promise<any> {
    console.log('Simulating Smart Farm Demo Sequence...');
    const fieldId = 'field_a';
    const farmId = 'farm_green_valley';

    // Step 1: Initial Dry State is already seeded (Moisture 28%, Temp 34C, Rain 10%, Alert: High Stress, Rec: Irrigate)
    
    // Step 2: Simulate rain probability increasing to 85%
    await queryRun(
      `UPDATE weather_readings 
       SET rain_probability = 85.0, conditions = 'Heavy Overcast' 
       WHERE field_id = ?`,
      [fieldId]
    );

    // Get current weather & soil & crop to run decision engine
    const soil = await queryGet<any>('SELECT * FROM soil_readings WHERE field_id = ?', [fieldId]);
    const weather = await queryGet<any>('SELECT * FROM weather_readings WHERE field_id = ?', [fieldId]);
    const crop = await queryGet<any>('SELECT * FROM crops WHERE field_id = ?', [fieldId]);

    const soilData = {
      moisture: soil.moisture,
      nitrogen: soil.nitrogen,
      phosphorus: soil.phosphorus,
      potassium: soil.potassium,
      ph: soil.ph,
      temperature: soil.temperature
    };

    const weatherData = {
      temperature: weather.temperature,
      humidity: weather.humidity,
      rainProbability: weather.rain_probability,
      windSpeed: weather.wind_speed,
      conditions: weather.conditions
    };

    const cropData = {
      name: crop.name,
      variety: crop.variety,
      growthStage: crop.growth_stage,
      plantingDate: crop.planting_date
    };

    // Calculate decision
    const decision = await this.irrigationService.predictIrrigation(soilData, weatherData, cropData, crop.area);

    // Update recommendation in database
    await queryRun('DELETE FROM recommendations WHERE field_id = ? AND priority = ?', [fieldId, 'High']);
    
    const recId = 'rec_irr_a_delayed';
    await queryRun(
      `INSERT INTO recommendations (id, field_id, recommendation, reason, data_used, confidence, expected_benefit, priority)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        recId,
        fieldId,
        'Delay Irrigation (Tomatoes)',
        decision.reason,
        JSON.stringify(decision.dataUsed),
        decision.confidence,
        decision.expectedBenefit,
        'Medium'
      ]
    );

    // Record the water savings (estimated at 1,200 L)
    const recordId = 'irr_saved_' + Date.now();
    await queryRun(
      `INSERT INTO irrigation_records (id, field_id, amount_liters, water_saved_liters, type)
       VALUES (?, ?, ?, ?, ?)`,
      [recordId, fieldId, 0.0, 1200.0, 'Simulated']
    );

    // Generate notification / alert
    const alertId = 'alert_saved_' + Date.now();
    await queryRun(
      `INSERT INTO alerts (id, farm_id, type, severity, title, message)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        alertId,
        farmId,
        'Irrigation',
        'Medium',
        'Irrigation Delayed - Water Saved',
        'Scheduled watering cycle for Field A was suspended because rain probability rose to 85%. Saved 1,200 Liters of borewell water.'
      ]
    );

    // Recalculate farm health score (Water improves from 91 to 96 due to smart saving logic)
    await queryRun(
      `UPDATE farm_health_scores 
       SET score = 86.0, water = 96.0 
       WHERE farm_id = ?`,
      [farmId]
    );

    return {
      success: true,
      moisture: soil.moisture,
      rainProbability: 85.0,
      recommendation: 'Delay Irrigation (Tomatoes)',
      reason: decision.reason,
      waterSavedLiters: 1200,
      newFarmHealth: 86
    };
  }

  async runDiseaseDemo(): Promise<any> {
    console.log('Simulating Disease Risk Alert Sequence...');
    const farmId = 'farm_green_valley';
    const fieldId = 'field_a';
    const cropId = 'crop_tomato';
    const todayStr = new Date().toISOString().split('T')[0];

    // 1. Set crop health down to 65% in database
    await queryRun(
      `INSERT INTO crop_health (id, crop_id, health_score, observation, risk_indicators)
       VALUES (?, ?, ?, ?, ?)`,
      [
        'health_tomato_disease_' + Date.now(),
        cropId,
        65.0,
        'Severe foliage deterioration. Visual yellow spots and mold structures detected on lower leaf margins.',
        JSON.stringify({ water_stress: 'Medium', disease_risk: 'High', pest_risk: 'Medium' })
      ]
    );

    // 2. Create disease prediction record
    const predId = 'pred_mold_' + Date.now();
    await queryRun(
      `INSERT INTO disease_predictions (id, crop_id, condition_detected, severity, confidence, symptoms, recommended_action)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        predId,
        cropId,
        'Tomato Leaf Mold (Passalora fulva)',
        'High',
        0.88,
        'Yellow spots on leaf surface; gray-purple velvety fungal growth on underside.',
        'Immediate reduction of humidity. Prune bottom leaves to enhance aeration. Apply copper-based biological spray.',
        null
      ]
    );

    // 3. Create a high-priority inspection task
    const taskId = 'task_inspect_' + Date.now();
    await queryRun(
      `INSERT INTO tasks (id, farm_id, title, type, due_date, status, priority, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        taskId,
        farmId,
        'Prune & Spray Disease-Affected Leaves',
        'Disease',
        todayStr,
        'Pending',
        'High',
        'Tomato Leaf Mold detected with 88% confidence. Prune affected bottom leaves and apply organic fungicide immediately.'
      ]
    );

    // 4. Generate alert
    const alertId = 'alert_disease_' + Date.now();
    await queryRun(
      `INSERT INTO alerts (id, farm_id, type, severity, title, message)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        alertId,
        farmId,
        'Disease',
        'Critical',
        'Tomato Disease Warning: Leaf Mold Detected',
        'AI vision diagnostic identifies Tomato Leaf Mold on Field A. Health index degraded to 65%. Urgent treatment recommended.'
      ]
    );

    // 5. Update farm health score downwards (Disease goes to 50, Pest stays 74, overall down to 72)
    await queryRun(
      `UPDATE farm_health_scores 
       SET score = 72.0, crop = 65.0, disease = 50.0 
       WHERE farm_id = ?`,
      [farmId]
    );

    return {
      success: true,
      disease: 'Tomato Leaf Mold',
      severity: 'High',
      confidence: 0.88,
      newFarmHealth: 72,
      newCropHealth: 65
    };
  }

  async runSoilDemo(): Promise<any> {
    console.log('Simulating Soil Depletion Scenario...');
    const farmId = 'farm_green_valley';
    const fieldId = 'field_a';

    // 1. Shift soil chemistry to depleted state (Moisture 25%, pH 5.2, Low N-P-K)
    await queryRun(
      `UPDATE soil_readings 
       SET moisture = 25.0, nitrogen = 15.0, phosphorus = 12.0, potassium = 14.0, ph = 5.2 
       WHERE field_id = ?`,
      [fieldId]
    );

    // 2. Generate fertilizer deficiency recommendation
    const recId = 'rec_soil_fert_' + Date.now();
    await queryRun(
      `INSERT INTO recommendations (id, field_id, recommendation, reason, data_used, confidence, expected_benefit, priority)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        recId,
        fieldId,
        'Apply N-P-K fertilizer and lime (pH neutralizer)',
        'Soil pH is highly acidic (5.2) and N-P-K elements are severely depleted below crop requirements. Nitrogen is 15 mg/kg (optimal > 40), Phosphorus is 12 mg/kg (optimal > 25).',
        JSON.stringify(['nitrogen', 'phosphorus', 'potassium', 'ph']),
        0.91,
        'Neutralizes soil acidity, restores nutrient reserves, and unlocks root intake absorption.',
        'High'
      ]
    );

    // 3. Create fertilizer records
    await queryRun('DELETE FROM fertilizer_records WHERE field_id = ?', [fieldId]);
    await queryRun(
      `INSERT INTO fertilizer_records (id, field_id, nutrient, status, amount_recommended)
       VALUES (?, ?, ?, ?, ?)`,
      ['fert_dep_n', fieldId, 'Nitrogen (N)', 'Deficient', 'Apply 20 kg urea per acre or composted cattle manure.']
    );
    await queryRun(
      `INSERT INTO fertilizer_records (id, field_id, nutrient, status, amount_recommended)
       VALUES (?, ?, ?, ?, ?)`,
      ['fert_dep_p', fieldId, 'Phosphorus (P)', 'Deficient', 'Apply 18 kg diammonium phosphate (DAP) or organic rock phosphate.']
    );
    await queryRun(
      `INSERT INTO fertilizer_records (id, field_id, nutrient, status, amount_recommended)
       VALUES (?, ?, ?, ?, ?)`,
      ['fert_dep_k', fieldId, 'Potassium (K)', 'Deficient', 'Apply 10 kg muriate of potash (MOP).']
    );

    // 4. Generate alert
    const alertId = 'alert_soil_' + Date.now();
    await queryRun(
      `INSERT INTO alerts (id, farm_id, type, severity, title, message)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        alertId,
        farmId,
        'Soil',
        'Critical',
        'Critical Soil Depletion & Acidity',
        'Field A chemistry indicates acidic lock (pH 5.2) and critical deficiencies across N, P, and K values. Nutrient status degraded.'
      ]
    );

    // 5. Update farm health scores (Soil goes down to 48, Nutrition down to 40, overall down to 64)
    await queryRun(
      `UPDATE farm_health_scores 
       SET score = 64.0, soil = 48.0, nutrition = 40.0 
       WHERE farm_id = ?`,
      [farmId]
    );

    return {
      success: true,
      moisture: 25.0,
      ph: 5.2,
      nitrogen: 15.0,
      phosphorus: 12.0,
      potassium: 14.0,
      newFarmHealth: 64
    };
  }

  async resetDemo(): Promise<any> {
    console.log('Resetting demo to initial values...');
    
    // Clear dynamic records created during demo run
    await queryRun("DELETE FROM users");
    await queryRun("DELETE FROM farms");
    await queryRun("DELETE FROM fields");
    await queryRun("DELETE FROM crops");
    await queryRun("DELETE FROM soil_readings");
    await queryRun("DELETE FROM weather_readings");
    await queryRun("DELETE FROM irrigation_records");
    await queryRun("DELETE FROM crop_health");
    await queryRun("DELETE FROM disease_predictions");
    await queryRun("DELETE FROM pest_risks");
    await queryRun("DELETE FROM fertilizer_records");
    await queryRun("DELETE FROM tasks");
    await queryRun("DELETE FROM recommendations");
    await queryRun("DELETE FROM recommendation_feedback");
    await queryRun("DELETE FROM alerts");
    await queryRun("DELETE FROM farm_health_scores");
    await queryRun("DELETE FROM sustainability_scores");
    await queryRun("DELETE FROM marketplace_products");
    await queryRun("DELETE FROM orders");
    await queryRun("DELETE FROM order_items");
    await queryRun("DELETE FROM soil_tests");
    await queryRun("DELETE FROM delivery_locations");
    await queryRun("DELETE FROM deliveries");
    await queryRun("DELETE FROM delivery_partners");

    // This will force the initDb seed data runner to re-seed the standard starter values
    const { initDb } = await import('../database/db.js');
    await initDb();

    return { success: true };
  }
}
