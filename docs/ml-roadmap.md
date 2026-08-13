# Machine Learning Integration Roadmap - AgriMind AI

AgriMind AI is engineered to scale from a deterministic, rule-based decision support system to an advanced machine learning predictive engine without requiring redesign of the presentation layer.

## Decoupled Interface Pattern

All prediction tasks are governed by TypeScript contracts inside `backend/src/services/predictionServices.ts`. For instance:

```typescript
export interface IIrrigationPredictionService {
  predictIrrigation(
    soil: SoilData, 
    weather: WeatherData, 
    crop: CropData, 
    area: number
  ): Promise<IrrigationPredictionResult>;
}
```

The application starts with `RuleBasedIrrigationService` or `DemoPredictionService` as standard. Once custom ML models are trained, they can be plugged in by creating a new class implementing the interface and swapping the initialization:

```typescript
export class MLIrrigationPredictionService implements IIrrigationPredictionService {
  async predictIrrigation(soil: SoilData, weather: WeatherData, crop: CropData, area: number): Promise<IrrigationPredictionResult> {
    // 1. Call custom Python API, TensorFlow node, or PyTorch endpoint
    // 2. Fetch tensor predictions for soil moisture decay curves
    // 3. Format results into identical JSON format
    return {
      irrigationRecommended: true,
      waterRequiredLiters: 1150,
      confidence: 0.94,
      reason: "ML Moisture decay model predicts critical deficit in 4 hours...",
      expectedBenefit: "Prevents root cellular shrink...",
      dataUsed: ["soil_decay_curve", "transpiration_ratio"]
    };
  }
}
```

---

## Future ML Integration Slots

Our roadmap details four primary integration slots:

### 1. Crop Yield Forecasting (`IYieldPredictionService`)
- **Current Fallback**: Rule-based estimations using crop variety multipliers.
- **ML Target**: Linear regression models or Random Forest models trained on regional historical yields, historical weather files, and active N-P-K nutrient curves.

### 2. Pathogen Image Classification (`IDiseasePredictionService`)
- **Current Fallback**: Simulated condition returns based on crop type.
- **ML Target**: Convolutional Neural Networks (CNNs) like MobileNetV3 or ResNet50 running leaf spot and mildew binary/multiclass classification.

### 3. Pest Risk Projections (`IPestPredictionService`)
- **Current Fallback**: Hot-humidity threshold alerts.
- **ML Target**: Logistic Regression or XGBoost modeling regional insect trap readings and weather logs to calculate Pest Risk indicators.

### 4. Soil Classification & Crop Suitability (`ICropPredictionService`)
- **Current Fallback**: Basic pH check.
- **ML Target**: Support Vector Machines (SVMs) matching N-P-K, pH, area, and temperature vectors to a database of 500+ crops to output suitability coefficients.
