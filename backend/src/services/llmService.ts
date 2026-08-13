import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

// Define input context types
export interface FarmContext {
  farmName: string;
  location: string;
  fields: Array<{
    id: string;
    name: string;
    crop?: {
      name: string;
      variety: string;
      growthStage: string;
      waterRequirement: number;
    };
    soil?: {
      moisture: number;
      nitrogen: number;
      phosphorus: number;
      potassium: number;
      ph: number;
      temperature: number;
    };
    weather?: {
      temperature: number;
      humidity: number;
      rainProbability: number;
      windSpeed: number;
      conditions: string;
    };
  }>;
  alerts: Array<{
    type: string;
    severity: string;
    title: string;
    message: string;
  }>;
  tasks: Array<{
    title: string;
    type: string;
    status: string;
    priority: string;
  }>;
  farmHealth: number;
}

export class LLMCopilotService {
  private genAI: any = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      console.log('Gemini API key detected. Initializing Generative AI service...');
      try {
        this.genAI = new GoogleGenerativeAI(apiKey);
      } catch (e) {
        console.warn('Error instantiating GoogleGenAI, falling back to local simulation:', e);
      }
    } else {
      console.log('No Gemini API key found. AI Copilot will run on context-aware rule simulation.');
    }
  }

  async askCopilot(question: string, context: FarmContext, language: 'en' | 'ta' | 'hi' = 'en'): Promise<string> {
    const cleanQuestion = question.trim().toLowerCase();
    
    // If Gemini API is successfully loaded and initialized
    if (this.genAI) {
      try {
        const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const systemPrompt = `
You are AgriMind Copilot, an expert virtual agricultural advisor.
You are helping a farmer manage their farm. Here is the current live telemetry from the farm:

FARM NAME: ${context.farmName}
LOCATION: ${context.location}
FARM HEALTH SCORE: ${context.farmHealth}/100

FIELDS:
${context.fields.map(f => `- Field ${f.name} (ID: ${f.id}):
  Crop: ${f.crop ? `${f.crop.name} (${f.crop.variety}), Stage: ${f.crop.growthStage}` : 'No crop planted'}
  Soil: ${f.soil ? `Moisture: ${f.soil.moisture}%, N: ${f.soil.nitrogen}, P: ${f.soil.phosphorus}, K: ${f.soil.potassium}, pH: ${f.soil.ph}, Temp: ${f.soil.temperature}°C` : 'No soil data'}
  Weather: ${f.weather ? `Temp: ${f.weather.temperature}°C, Hum: ${f.weather.humidity}%, Rain Prob: ${f.weather.rainProbability}%, Wind: ${f.weather.windSpeed} km/h, Conditions: ${f.weather.conditions}` : 'No weather data'}
`).join('\n')}

ACTIVE ALERTS:
${context.alerts.map(a => `- [${a.severity}] ${a.title}: ${a.message}`).join('\n')}

PENDING TASKS:
${context.tasks.map(t => `- [${t.priority}] ${t.title} (${t.type}) - Status: ${t.status}`).join('\n')}

INSTRUCTIONS:
1. Keep the response short, simple, actionable, and friendly for a farmer.
2. Answer the user's question using the provided context. If they ask about something not in the context, give general agricultural advice.
3. If they ask in Tamil or if the language is 'ta', translate your advice into simple, colloquial Tamil.
4. Highlight priorities using icons: 🔴 (High Priority), 🟠 (Medium Priority), 🟡 (Low Priority).
5. Never state guarantees. Use terms like "predicted", "estimated", or "recommended".
`;

        const result = await model.generateContent([
          { text: systemPrompt },
          { text: `Farmer's Question: "${question}"` }
        ]);

        return result.response.text();
      } catch (err) {
        console.error('Error invoking Gemini, falling back to local decision mapping:', err);
      }
    }

    // --- CONTEXT-AWARE MOCK/SIMULATION FALLBACK ENGINE ---
    
    // Detect active field variables
    const fieldA = context.fields.find(f => f.id === 'field_a') || context.fields[0];
    const fieldB = context.fields.find(f => f.id === 'field_b') || context.fields[1] || fieldA;

    const moistureA = fieldA?.soil?.moisture ?? 28;
    const moistureB = fieldB?.soil?.moisture ?? 42;
    const rainProbA = fieldA?.weather?.rainProbability ?? 10;
    const rainProbB = fieldB?.weather?.rainProbability ?? 20;

    // Check query intent (English and Tamil)
    const isWater = cleanQuestion.includes('water') || clean_includes(cleanQuestion, ['irrigate', 'tannir', 'தண்ணீர்', 'பாய்ச்ச']);
    const isHealth = cleanQuestion.includes('health') || clean_includes(cleanQuestion, ['score', 'ஆரோக்கியம்', 'மதிப்பெண்']);
    const isPriority = clean_includes(cleanQuestion, ['todo', 'what should i do', 'priorities', 'இன்று என்ன செய்ய', 'priority']);
    const isRain = cleanQuestion.includes('rain') || clean_includes(cleanQuestion, ['weather', 'மழை', 'வானிலை']);
    const isSoil = clean_includes(cleanQuestion, ['soil', 'nitrogen', 'phosphorus', 'potassium', 'ph', 'மண்', 'சத்து']);
    const isField = cleanQuestion.includes('field') || clean_includes(cleanQuestion, ['attention', 'வயல்', 'இடம்']);

    if (language === 'ta') {
      // TAMIL FALLBACKS
      if (isWater) {
        if (moistureA < 30) {
          if (rainProbA < 50) {
            return `ஆம், **Field A (தக்காளி)** வயலுக்கு இன்று நீர் பாய்ச்ச பரிந்துரைக்கப்படுகிறது.
          
**ஏன்?**
மண் ஈரப்பதம் மிகவும் குறைவாக உள்ளது (${moistureA}%) மற்றும் மழை வர வாய்ப்பில்லை (${rainProbA}%).
          
**சிறந்த நேரம்:**
காலை 6 - 8 மணி.
          
**தேவையான தோராயமான நீர்:**
1,200 லிட்டர்.`;
          } else {
            return `இல்லை, **Field A** வயலுக்கு நீர் பாய்ச்சுவதை ஒத்திவைக்கவும்.
          
**ஏன்?**
மண் ஈரப்பதம் குறைவாக இருந்தாலும் (${moistureA}%), அடுத்த 18 மணி நேரத்தில் மழை பெய்ய ${rainProbA}% அதிக வாய்ப்பு உள்ளது. இயற்கை மழையைப் பயன்படுத்துவது நீரைச் சேமிக்கும்.`;
          }
        }
        return `இல்லை, தற்போது உங்கள் வயல்களுக்கு நீர் பாய்ச்ச தேவையில்லை. **Field A** ஈரப்பதம் ${moistureA}% மற்றும் **Field B** ஈரப்பதம் ${moistureB}% ஆக உள்ளது, இவை போதுமானது.`;
      }

      if (isHealth) {
        return `உங்கள் பண்ணையின் தற்போதைய ஆரோக்கிய மதிப்பெண் **${context.farmHealth}/100** ஆகும்.
        
**காரணங்கள்:**
- 🔴 **நீர் அழுத்த நிலை:** Field A-இல் ஈரப்பதம் (${moistureA}%) குறைவாக உள்ளது.
- 🟠 **பூச்சி தாக்குதல் ஆபத்து:** Field A-இல் வெள்ளை ஈக்கள் பரவ மிதமான வாய்ப்பு உள்ளது.
- 🟢 **மண் வள நிலை:** Field B நெற்பயிர் நல்ல வளத்துடன் உள்ளது (${moistureB}% ஈரப்பதம்).`;
      }

      if (isPriority) {
        return `இன்றைய உங்கள் முக்கிய கடமைகள்:
        
1. 🔴 **Field A-க்கு நீர் பாய்ச்சவும்:** தக்காளி செடிகளின் ஈரப்பதம் ${moistureA}% ஆக உள்ளது.
2. 🟠 **பூச்சி கண்காணிப்பு:** தக்காளி இலைகளில் வெள்ளை ஈக்களின் அறிகுறி உள்ளதா என கண்காணிக்கவும்.
3. 🟡 **உரம் இடுதல்:** நாளை திட்டமிடப்பட்ட பாஸ்பரஸ் உரப் பணியை மதிப்பாய்வு செய்யவும்.`;
      }

      if (isRain) {
        return `இன்று வானிலை நிலவரம்:
- **Field A:** வெப்பநிலை 34°C, மழை பெய்ய ${rainProbA}% மட்டுமே வாய்ப்பு உள்ளது.
- **Field B:** வெப்பநிலை 30°C, மழை பெய்ய ${rainProbB}% வாய்ப்பு உள்ளது.
- இன்று குறிப்பிடத்தக்க மழைக்கு வாய்ப்பு மிகக் குறைவு.`;
      }

      if (isSoil) {
        return `உங்கள் மண்ணின் வள விவரங்கள்:
- **Field A (தக்காளி):** ஈரப்பதம் ${moistureA}%. மண்ணில் பாஸ்பரஸ் (P) சத்து குறைவாக உள்ளது, இதற்கு மாட்டுச் சாணம் அல்லது எலும்புத்தூள் பயன்படுத்தலாம். pH அளவு 6.4 (சிறந்தது).
- **Field B (நெல்):** ஈரப்பதம் ${moistureB}%. ஊட்டச்சத்துக்கள் மற்றும் pH அளவு (6.1) சிறந்த முறையில் உள்ளன.`;
      }

      // Default Tamil response
      return `வணக்கம்! நான் அக்ரிமைண்ட் உதவியாளர். உங்கள் பண்ணை விவரங்களை ஆராய்ந்து உதவ முடியும். 
எடுத்துக்காட்டாக, "இன்று நான் தண்ணீர் பாய்ச்ச வேண்டுமா?" அல்லது "எனது பண்ணை ஆரோக்கியம் என்ன?" என்று கேளுங்கள்.`;
    }

    if (language === 'hi') {
      // HINDI FALLBACKS
      if (isWater) {
        if (moistureA < 30) {
          if (rainProbA < 50) {
            return `हाँ, आज **Field A (टमाटर)** के लिए सिंचाई की सिफारिश की जाती है।
          
**क्यों?**
मिट्टी की नमी बहुत कम (${moistureA}%) है और बारिश की संभावना केवल ${rainProbA}% है।
          
**सर्वोत्तम समय:**
सुबह 6 - 8 बजे।
          
**अनुमानित पानी की आवश्यकता:**
1,200 लीटर।`;
          } else {
            return `नहीं, आज आपको **सिंचाई टाल देनी चाहिए**।
          
**क्यों?**
हालांकि मिट्टी की नमी कम (${moistureA}%) है, अगले 18 घंटों में बारिश की संभावना ${rainProbA}% है। बारिश का इंतजार करें और पानी बचाएं।`;
          }
        }
        return `नहीं, आज सिंचाई की आवश्यकता नहीं है। Field A की नमी ${moistureA}% और Field B की नमी ${moistureB}% है, जो सुरक्षित स्तर पर हैं।`;
      }

      if (isHealth) {
        return `आपके खेत का स्वास्थ्य स्कोर **${context.farmHealth}/100** है।
        
**कारण:**
- 🔴 **पानी की कमी:** Field A में नमी कम (${moistureA}%) है।
- 🟠 **कीट जोखिम:** तापमान बढ़ने से सफेद मक्खी का खतरा मध्यम है।
- 🟢 **मिट्टी की स्थिति:** Field B में धान की फसल बेहतर स्थिति में है (${moistureB}% नमी)।`;
      }

      if (isPriority) {
        return `आज की आपकी मुख्य प्राथमिकताएं:
        
1. 🔴 **Field A में पानी डालें:** टमाटर की फसल की नमी कम (${moistureA}%) है।
2. 🟠 **कीट निगरानी:** टमाटर के पत्तों पर सफेद मक्खी के लक्षणों की निगरानी करें।
3. 🟡 **खाद प्रबंधन:** कल के लिए निर्धारित फास्फोरस खाद कार्य की समीक्षा करें।`;
      }

      if (isRain) {
        return `आज का मौसम पूर्वानुमान:
- **Field A:** तापमान 34°C, बारिश की संभावना ${rainProbA}% (धूप)।
- **Field B:** तापमान 30°C, बारिश की संभावना ${rainProbB}% (आंशिक रूप से बादल)।
- आज भारी बारिश की कोई संभावना नहीं है।`;
      }

      if (isSoil) {
        return `आपकी मिट्टी की पोषक तत्व स्थिति:
- **Field A (टमाटर):** नमी ${moistureA}% है। फास्फोरस की कमी है, जैविक खाद का उपयोग करें। पीएच 6.4 (बहुत अच्छा) है।
- **Field B (धान):** नमी ${moistureB}% है। पोषक तत्व और पीएच (6.1) संतुलित हैं।`;
      }

      // Default Hindi response
      return `नमस्ते! मैं आपका एग्रीमाइंड सहायक हूँ। मैं आपके खेत के विवरण का विश्लेषण करके मदद कर सकता हूँ।
पूछें: "क्या आज मुझे पानी देना चाहिए?" या "मेरे खेत का स्वास्थ्य कैसा है?"`;
    }

    // ENGLISH FALLBACKS
    if (isWater) {
      if (moistureA < 30) {
        if (rainProbA < 50) {
          return `Yes, irrigation is recommended for **Field A (Tomatoes)** today.
        
**Why?**
Soil moisture is critically low at **${moistureA}%** (threshold is 35% for tomatoes) and rain probability is only **${rainProbA}%**.
        
**Best Time:**
6:00 AM - 8:00 AM.
        
**Estimated Water Requirement:**
1,200 Liters.`;
        } else {
          return `No, you should **delay irrigation** for Field A today.
        
**Why?**
Although soil moisture is low (${moistureA}%), there is an **${rainProbA}% chance of rain** expected within the next 18 hours. Let's wait for the rain and conserve water.`;
        }
      }
      return `No irrigation is required today. Field A is at ${moistureA}% moisture and Field B is at ${moistureB}% moisture, which are within safe parameters.`;
    }

    if (isHealth) {
      return `Your Farm Health Score is **${context.farmHealth}/100** (Status: Good).
      
Here is the breakdown of why it is at this level:
- 🔴 **Water Stress:** Field A (Tomatoes) is showing moisture levels of **${moistureA}%**, which is triggering a water stress alert.
- 🟠 **Pest Risk:** Recent warm, humid weather has raised the Whitefly risk level to Medium in Field A.
- 🟢 **Crop Suitability:** Field B (Rice) has excellent crop vigor with **${moistureB}%** moisture and optimal soil readings.`;
    }

    if (isPriority) {
      return `Here are your top priorities for today based on current farm telemetry:
      
1. 🔴 **Water Field A:** Tomato soil moisture is low (${moistureA}%).
2. 🟠 **Pest Monitoring:** Inspect lower leaf surfaces in Field A for Whitefly activity.
3. 🟡 **Fertilizer Task:** Plan for the phosphorus fertilizer application scheduled for tomorrow.`;
    }

    if (isRain) {
      return `Weather forecast overview:
- **Field A:** Temperature is 34°C with a **${rainProbA}%** rain probability (Sunny).
- **Field B:** Temperature is 30°C with a **${rainProbB}%** rain probability (Partly Cloudy).
- No significant rainfall expected today.`;
    }

    if (isSoil) {
      return `Soil conditions update:
- **Field A:** Moisture is low at **${moistureA}%**. Nitrogen is Normal, but Phosphorus is Deficient (24 mg/kg). Consider applying bone meal or organic phosphates. pH is healthy at 6.4.
- **Field B:** Moisture is healthy at **${moistureB}%**. Nitrogen and potassium levels are fully optimal. pH is 6.1.`;
    }

    if (isField) {
      return `**Field A** (Tomatoes) needs immediate attention due to low soil moisture (${moistureA}%) and active Whitefly risks. **Field B** (Rice) is currently stable with normal irrigation levels (${moistureB}% moisture).`;
    }

    // Default response
    return `Hello! I am your AgriMind Copilot. I have scanned the telemetry for **${context.farmName}**. 
How can I help you today? You can ask:
- *"Should I water my crop today?"*
- *"Why is my farm health score low?"*
- *"What should I do today?"*
- *"Is rain expected?"*`;
  }
}

// Helper to match list of strings
function clean_includes(target: string, keywords: string[]): boolean {
  return keywords.some(key => target.includes(key));
}
