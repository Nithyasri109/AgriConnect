import os
import sys
import json
import numpy as np
from PIL import Image

# Suppress tensorflow warnings
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
import tensorflow as tf

MODEL_PATH = "./ml/models/plant_disease_model.keras"
if not os.path.exists(MODEL_PATH):
    MODEL_PATH = "../ml/models/plant_disease_model.keras"

CLASS_NAMES_PATH = "./ml/models/class_names.json"
if not os.path.exists(CLASS_NAMES_PATH):
    CLASS_NAMES_PATH = "../ml/models/class_names.json"

def predict(image_path):
    if not os.path.exists(MODEL_PATH) or not os.path.exists(CLASS_NAMES_PATH):
        print(json.dumps({
            "success": False,
            "error": "Model files not found."
        }))
        return

    try:
        # Load class names
        with open(CLASS_NAMES_PATH, "r") as f:
            class_names_dict = json.load(f)
        
        # Ensure keys are integers and get sorted list
        class_names = [class_names_dict[str(i)] for i in range(len(class_names_dict))]

        # Load model
        model = tf.keras.models.load_model(MODEL_PATH)

        # Preprocess image
        img = Image.open(image_path).convert('RGB')
        img = img.resize((224, 224))
        img_array = tf.keras.preprocessing.image.img_to_array(img)
        img_array = np.expand_dims(img_array, axis=0)
        img_array = img_array / 255.0

        # Predict
        predictions = model.predict(img_array, verbose=0)
        score = predictions[0]
        predicted_idx = np.argmax(score)
        predicted_class = class_names[predicted_idx]
        confidence = float(score[predicted_idx]) * 100.0

        # Parse plant and disease
        if "___" in predicted_class:
            plant_name, condition_name = predicted_class.split("___", 1)
        else:
            plant_name, condition_name = predicted_class, "unknown"

        plant_name = plant_name.replace("_", " ").strip()
        condition_name = condition_name.replace("_", " ").strip()
        status = "healthy" if "healthy" in condition_name.lower() else "infected"

        print(json.dumps({
            "success": True,
            "prediction": {
                "class": predicted_class,
                "plant": plant_name,
                "disease": condition_name if status == "infected" else "Healthy",
                "confidence": round(confidence, 2),
                "status": status
            }
        }))

    except Exception as e:
        print(json.dumps({
            "success": False,
            "error": str(e)
        }))

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "No image path provided."}))
    else:
        predict(sys.argv[1])
