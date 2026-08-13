/**
 * AgriMind AI Prediction Services Interfaces
 * These interfaces define the contracts for all AI and ML models.
 * Frontend or other backend controllers only interact with these interfaces.
 * The concrete implementation can be swapped from a RuleBased/Demo service
 * to a full TensorFlow/PyTorch or external ML API service without modifying other modules.
 */

// Data structures
export interface SoilData {
  moisture: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  ph: number;
  temperature: number;
}

export interface WeatherData {
  temperature: number;
  humidity: number;
  rainProbability: number;
  windSpeed: number;
  conditions: string;
}

export interface CropData {
  name: string;
  variety: string;
  growthStage: string;
  plantingDate: string;
}

// 1. Irrigation Prediction Contracts
export interface IrrigationPredictionResult {
  irrigationRecommended: boolean;
  waterRequiredLiters: number;
  confidence: number; // 0.0 to 1.0
  reason: string;
  expectedBenefit: string;
  dataUsed: string[];
}

export interface IIrrigationPredictionService {
  predictIrrigation(soil: SoilData, weather: WeatherData, crop: CropData, area: number): Promise<IrrigationPredictionResult>;
}

// 2. Disease Prediction Contracts
export interface DiseasePredictionResult {
  conditionDetected: string;
  confidence: number;
  severity: 'Low' | 'Medium' | 'High';
  symptoms: string;
  recommendedAction: string;
  expertVerificationRequired: boolean;
}

export interface IDiseasePredictionService {
  analyzeCropImage(cropName: string, imageBase64OrUrl: string): Promise<DiseasePredictionResult>;
}

// 3. Pest Risk Prediction Contracts
export interface PestRiskResult {
  pestName: string;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  mitigationAction: string;
  confidence: number;
}

export interface IPestPredictionService {
  predictPestRisk(crop: CropData, weather: WeatherData, recentObservations?: string[]): Promise<PestRiskResult[]>;
}

// 4. Crop Recommendation Contracts
export interface CropRecommendationResult {
  cropName: string;
  suitabilityScore: number; // 0 - 100
  estimatedYieldKgPerAcre: number;
  growingPeriodDays: number;
  soilSuitabilityReason: string;
}

export interface ICropPredictionService {
  recommendCrops(soil: SoilData, location: string): Promise<CropRecommendationResult[]>;
}

// 5. Yield Prediction Contracts
export interface YieldPredictionResult {
  predictedYieldKg: number;
  confidence: number;
  factors: {
    positive: string[];
    negative: string[];
  };
  recommendations: string[];
}

export interface IYieldPredictionService {
  predictYield(crop: CropData, soilHistory: SoilData[], weatherHistory: WeatherData[]): Promise<YieldPredictionResult>;
}


/**
 * CONCRETE IMPLEMENTATIONS (Rule-Based & Demo Fallbacks)
 * These can be configured or swapped at runtime.
 */

export class RuleBasedIrrigationService implements IIrrigationPredictionService {
  async predictIrrigation(soil: SoilData, weather: WeatherData, crop: CropData, area: number): Promise<IrrigationPredictionResult> {
    // Threshold config (can be adjusted)
    const MOISTURE_THRESHOLD = crop.name.toLowerCase() === 'rice' ? 40.0 : 35.0; 
    const RAIN_PROB_THRESHOLD = 50.0;

    let irrigationRecommended = false;
    let confidence = 0.95;
    let reason = '';
    let expectedBenefit = 'Maintains optimal plant hydration.';
    const dataUsed = ['soil_moisture', 'rain_probability', 'crop_type', 'growth_stage'];

    const baseWaterNeededPerAcre = crop.name.toLowerCase() === 'rice' ? 600 : 240; // Liters per day per acre
    const waterRequiredLiters = Math.round(baseWaterNeededPerAcre * area);

    if (soil.moisture < MOISTURE_THRESHOLD) {
      if (weather.rainProbability < RAIN_PROB_THRESHOLD) {
        irrigationRecommended = true;
        reason = `Soil moisture (${soil.moisture}%) is below the preferred threshold of ${MOISTURE_THRESHOLD}% for ${crop.name} in its ${crop.growthStage} stage, and rain probability is low (${weather.rainProbability}%).`;
        expectedBenefit = `Supports crop transition during the crucial ${crop.growthStage} stage, preventing water stress.`;
      } else {
        irrigationRecommended = false;
        confidence = 0.88;
        reason = `Soil moisture is low (${soil.moisture}%), but significant rain probability (${weather.rainProbability}%) is forecast within the next 24 hours. Irrigation can be safely delayed.`;
        expectedBenefit = `Saves approximately ${waterRequiredLiters} L of water by utilizing natural precipitation.`;
      }
    } else {
      irrigationRecommended = false;
      reason = `Soil moisture (${soil.moisture}%) is adequate (threshold is ${MOISTURE_THRESHOLD}%). No active watering required today.`;
      expectedBenefit = `Prevents waterlogging and root rot in ${crop.name}.`;
    }

    return {
      irrigationRecommended,
      waterRequiredLiters,
      confidence,
      reason,
      expectedBenefit,
      dataUsed
    };
  }
}

export class DemoDiseaseService implements IDiseasePredictionService {
  async analyzeCropImage(cropName: string, imageBase64OrUrl: string): Promise<DiseasePredictionResult> {
    // Return standard mock disease responses based on crop type or preset string
    const isTomato = cropName.toLowerCase().includes('tomato');
    
    if (isTomato) {
      return {
        conditionDetected: 'Tomato Leaf Mold (Passalora fulva)',
        confidence: 0.84,
        severity: 'Medium',
        symptoms: 'Pale green or yellow spots on the upper leaf surface, followed by a gray-purple velvety mold on the underside of the leaves.',
        recommendedAction: 'Improve greenhouse ventilation, reduce relative humidity below 85%, and apply a copper-based organic fungicide if spread continues.',
        expertVerificationRequired: false
      };
    } else {
      return {
        conditionDetected: 'Rice Blast (Magnaporthe oryzae)',
        confidence: 0.91,
        severity: 'High',
        symptoms: 'Diamond-shaped, spindle lesions on leaves with gray centers and brown borders. Leaf collars are yellowing.',
        recommendedAction: 'Avoid excessive nitrogen fertilizers, maintain proper field drainage, and use resistant varieties or application of tricyclazole fungicide.',
        expertVerificationRequired: true
      };
    }
  }
}

export class RuleBasedPestService implements IPestPredictionService {
  async predictPestRisk(crop: CropData, weather: WeatherData, recentObservations?: string[]): Promise<PestRiskResult[]> {
    const risks: PestRiskResult[] = [];
    
    if (crop.name.toLowerCase() === 'tomato') {
      // Hot and humid increases whitefly risk
      const whiteflyRisk = (weather.temperature > 30 && weather.humidity > 60) ? 'Medium' : 'Low';
      risks.push({
        pestName: 'Whiteflies',
        riskLevel: whiteflyRisk,
        mitigationAction: 'Install yellow sticky traps. Introduce predatory beetles or spray neem oil if counts exceed 5 per leaf.',
        confidence: 0.82
      });

      // Dry and warm increases red spider mites risk
      const miteRisk = (weather.temperature > 32 && weather.humidity < 50) ? 'High' : 'Low';
      risks.push({
        pestName: 'Spider Mites',
        riskLevel: miteRisk,
        mitigationAction: 'Apply light water spray on leaf undersides to raise micro-humidity. Release phytoseiid predatory mites.',
        confidence: 0.76
      });
    } else if (crop.name.toLowerCase() === 'rice') {
      const stemBorerRisk = (weather.temperature > 25 && weather.humidity > 70) ? 'High' : 'Medium';
      risks.push({
        pestName: 'Yellow Stem Borer',
        riskLevel: stemBorerRisk,
        mitigationAction: 'Set up pheromone traps (5 traps/acre). Apply Bacillus thuringiensis (Bt) or release Trichogramma wasps.',
        confidence: 0.88
      });
    }

    return risks;
  }
}

export class RuleBasedCropPredictionService implements ICropPredictionService {
  async recommendCrops(soil: SoilData, location: string): Promise<CropRecommendationResult[]> {
    // Simple mock logic for crop suitability
    return [
      {
        cropName: 'Tomato',
        suitabilityScore: soil.ph >= 6.0 && soil.ph <= 7.0 ? 92 : 75,
        estimatedYieldKgPerAcre: 15000,
        growingPeriodDays: 90,
        soilSuitabilityReason: 'Optimal pH (6.4) and soil structure supports tomato root systems. Requires nitrogen management during growth.'
      },
      {
        cropName: 'Bell Pepper',
        suitabilityScore: 84,
        estimatedYieldKgPerAcre: 8000,
        growingPeriodDays: 110,
        soilSuitabilityReason: 'Fits loam texture and warm weather. Requires high potassium and moderate moisture.'
      },
      {
        cropName: 'Maize',
        suitabilityScore: soil.nitrogen > 40 ? 89 : 60,
        estimatedYieldKgPerAcre: 3500,
        growingPeriodDays: 120,
        soilSuitabilityReason: 'Good soil nitrogen levels support rapid early vegetative development.'
      }
    ];
  }
}

export class RuleBasedYieldPredictionService implements IYieldPredictionService {
  async predictYield(crop: CropData, soilHistory: SoilData[], weatherHistory: WeatherData[]): Promise<YieldPredictionResult> {
    const avgMoisture = soilHistory.reduce((sum, s) => sum + s.moisture, 0) / (soilHistory.length || 1);
    const positive = [];
    const negative = [];
    let confidence = 0.85;
    let baseMultiplier = 1.0;

    if (avgMoisture < 30) {
      negative.push('Frequent low soil moisture cycles might restrict vascular nutrient flow.');
      baseMultiplier *= 0.88;
    } else {
      positive.push('Consistent water availability supports vegetative cell division.');
    }

    if (crop.name.toLowerCase() === 'tomato') {
      positive.push('Arka Rakshak variety contains high disease tolerance.');
      return {
        predictedYieldKg: Math.round(15000 * crop.variety.length * 0.2 * baseMultiplier),
        confidence,
        factors: { positive, negative },
        recommendations: [
          'Maintain moisture above 32% during fruit sizing.',
          'Inject phosphorus rich fertilizer blend now that flowering is peaks.'
        ]
      };
    } else {
      return {
        predictedYieldKg: Math.round(12000 * baseMultiplier),
        confidence: 0.80,
        factors: { positive, negative },
        recommendations: [
          'Ensure continuous field flooding during active tillering.',
          'Top dress with organic nitrogen amendments.'
        ]
      };
    }
  }
}
