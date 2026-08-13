import os
import sys
import json
from PIL import Image

# Suppress warnings
import warnings
warnings.filterwarnings("ignore")

try:
    import torch
    import torch.nn as nn
    import torchvision.transforms as transforms
    import torchvision.models as models
    PYTORCH_AVAILABLE = True
except ImportError:
    PYTORCH_AVAILABLE = False

CLASS_NAMES_PATH = "./backend/class_names.json"
MODEL_PATH = "./backend/model.pth"

def run_prediction(image_path):
    if not PYTORCH_AVAILABLE:
        print(json.dumps({
            "success": False,
            "error": "PyTorch or torchvision is not installed in the execution environment."
        }))
        return

    if not os.path.exists(MODEL_PATH) or not os.path.exists(CLASS_NAMES_PATH):
        print(json.dumps({
            "success": False,
            "error": f"Trained model checkpoint not found. Missing model.pth or class_names.json."
        }))
        return

    try:
        # Load class names
        with open(CLASS_NAMES_PATH, "r") as f:
            class_names = json.load(f)

        # Load image
        img = Image.open(image_path).convert('RGB')

        # Define transform
        transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])
        img_t = transform(img).unsqueeze(0)

        # Re-build lightweight MobileNetV2 architecture
        model = models.mobilenet_v2()
        num_ftrs = model.classifier[1].in_features
        model.classifier[1] = nn.Sequential(
            nn.Dropout(0.2),
            nn.Linear(num_ftrs, len(class_names))
        )

        # Load trained weights
        model.load_state_dict(torch.load(MODEL_PATH, map_location=torch.device('cpu')))
        model.eval()

        # Run inference
        with torch.no_grad():
            outputs = model(img_t)
            probabilities = torch.nn.functional.softmax(outputs[0], dim=0)
            confidence, predicted_idx = torch.max(probabilities, 0)
            
            predicted_class = class_names[predicted_idx.item()]
            conf_pct = float(confidence.item()) * 100.0

        # Parse plant name and condition
        if "___" in predicted_class:
            plant_name, condition_name = predicted_class.split("___", 1)
        else:
            plant_name, condition_name = predicted_class, "unknown"

        # Re-format text strings
        plant_name = plant_name.replace("_", " ").strip()
        condition_name = condition_name.replace("_", " ").strip()

        status = "healthy" if "healthy" in condition_name.lower() else "infected"

        print(json.dumps({
            "success": True,
            "prediction": {
                "class": predicted_class,
                "plant": plant_name,
                "disease": condition_name if status == "infected" else "Healthy",
                "confidence": round(conf_pct, 2),
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
        print(json.dumps({
            "success": False,
            "error": "Usage: python3 predict.py <image_path>"
        }))
        sys.exit(1)
        
    image_path = sys.argv[1]
    run_prediction(image_path)
