import { RuleBasedIrrigationService } from './services/predictionServices.js';

const runTests = async () => {
  console.log('--------------------------------------------------');
  console.log('RUNNING UNIT TESTS FOR IRRIGATION DECISION ENGINE');
  console.log('--------------------------------------------------');

  const engine = new RuleBasedIrrigationService();

  const tomatoCrop = {
    name: 'Tomato',
    variety: 'Arka Rakshak',
    growthStage: 'Flowering',
    plantingDate: '2026-06-25'
  };

  const testCases = [
    {
      name: 'Dry Soil, Low Rain Probability (Should recommend watering)',
      soil: { moisture: 25.0, nitrogen: 40, phosphorus: 20, potassium: 15, ph: 6.5, temperature: 32 },
      weather: { temperature: 34, humidity: 65, rainProbability: 10, windSpeed: 12, conditions: 'Sunny' },
      area: 5,
      expectedRecommended: true
    },
    {
      name: 'Dry Soil, High Rain Probability (Should delay watering to conserve)',
      soil: { moisture: 25.0, nitrogen: 40, phosphorus: 20, potassium: 15, ph: 6.5, temperature: 32 },
      weather: { temperature: 28, humidity: 85, rainProbability: 80, windSpeed: 10, conditions: 'Heavy Overcast' },
      area: 5,
      expectedRecommended: false
    },
    {
      name: 'Adequate Moisture (Should not recommend watering)',
      soil: { moisture: 38.0, nitrogen: 40, phosphorus: 20, potassium: 15, ph: 6.5, temperature: 32 },
      weather: { temperature: 31, humidity: 60, rainProbability: 15, windSpeed: 8, conditions: 'Sunny' },
      area: 5,
      expectedRecommended: false
    }
  ];

  let passedCount = 0;

  for (const tc of testCases) {
    console.log(`\nTest Case: ${tc.name}`);
    const result = await engine.predictIrrigation(tc.soil, tc.weather, tomatoCrop, tc.area);
    
    console.log(`-> Recommended: ${result.irrigationRecommended}`);
    console.log(`-> Water Required: ${result.waterRequiredLiters} L`);
    console.log(`-> Confidence: ${result.confidence * 100}%`);
    console.log(`-> Reason: ${result.reason}`);
    
    if (result.irrigationRecommended === tc.expectedRecommended) {
      console.log('✅ PASSED');
      passedCount++;
    } else {
      console.log(`❌ FAILED (Expected: ${tc.expectedRecommended}, Got: ${result.irrigationRecommended})`);
    }
  }

  console.log('\n--------------------------------------------------');
  console.log(`TESTS SUMMARY: ${passedCount}/${testCases.length} Passed`);
  console.log('--------------------------------------------------');
  
  if (passedCount === testCases.length) {
    process.exit(0);
  } else {
    process.exit(1);
  }
};

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
