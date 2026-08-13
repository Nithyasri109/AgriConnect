import { queryRun, initDb } from './db.js';

async function reset() {
  console.log('Resetting database...');
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
  await queryRun("DELETE FROM plant_health_analyses");
  
  console.log('Database wiped. Seeding admin user...');
  await initDb();
  console.log('Database reset complete!');
  process.exit(0);
}

reset().catch(err => {
  console.error(err);
  process.exit(1);
});
