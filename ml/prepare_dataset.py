import os
import shutil
import random

SOURCE_DIR = "./plantvillage_dataset/color"
TARGET_DIR = "./ml/custom_dataset"
NUM_IMAGES_PER_CLASS = 150

random.seed(42)

classes_mapping = {
    "Potato___healthy": "Potato___healthy",
    "Potato___Early_blight": "Potato___Early_blight",
    "Potato___Late_blight": "Potato___Late_blight",
    "Tomato___healthy": "Tomato___healthy",
    "Tomato___Early_blight": "Tomato___Early_blight",
    "Tomato___Septoria_leaf_spot": "Tomato___Septoria_leaf_spot",
}

def prepare_dataset():
    print("Preparing dataset subset for fast training...")
    if not os.path.exists(SOURCE_DIR):
        print(f"Error: Source dataset directory {SOURCE_DIR} not found.")
        return False
        
    # Clear target dir if it exists to ensure a clean start
    if os.path.exists(TARGET_DIR):
        shutil.rmtree(TARGET_DIR)
    os.makedirs(TARGET_DIR, exist_ok=True)
    
    # 1. Copy standard PlantVillage classes
    for src_cls, target_cls in classes_mapping.items():
        src_path = os.path.join(SOURCE_DIR, src_cls)
        target_path = os.path.join(TARGET_DIR, target_cls)
        os.makedirs(target_path, exist_ok=True)
        
        all_imgs = [f for f in os.listdir(src_path) if os.path.isfile(os.path.join(src_path, f))]
        selected_imgs = random.sample(all_imgs, min(len(all_imgs), NUM_IMAGES_PER_CLASS))
        
        print(f"Copying {len(selected_imgs)} images for class: {target_cls}")
        for img in selected_imgs:
            shutil.copy2(os.path.join(src_path, img), os.path.join(target_path, img))
            
    # 2. Prepare Rose___black_spot (Copied from Grape___Black_rot)
    rose_target_path = os.path.join(TARGET_DIR, "Rose___black_spot")
    os.makedirs(rose_target_path, exist_ok=True)
    src_grape_path = os.path.join(SOURCE_DIR, "Grape___Black_rot")
    if os.path.exists(src_grape_path):
        all_imgs = [f for f in os.listdir(src_grape_path) if os.path.isfile(os.path.join(src_grape_path, f))]
        selected_imgs = random.sample(all_imgs, min(len(all_imgs), NUM_IMAGES_PER_CLASS))
        print(f"Copying {len(selected_imgs)} images for custom class: Rose___black_spot (from Grape___Black_rot)")
        for img in selected_imgs:
            shutil.copy2(os.path.join(src_grape_path, img), os.path.join(rose_target_path, img))
    else:
        print("Warning: Grape___Black_rot source not found. Cannot populate Rose___black_spot.")

    # 3. Prepare General___diseased_leaf (Mixed from Squash, Peach, and Strawberry diseases)
    general_target_path = os.path.join(TARGET_DIR, "General___diseased_leaf")
    os.makedirs(general_target_path, exist_ok=True)
    
    mixed_sources = [
        "Squash___Powdery_mildew",
        "Peach___Bacterial_spot",
        "Strawberry___Leaf_scorch"
    ]
    
    selected_mixed = []
    for src in mixed_sources:
        src_path = os.path.join(SOURCE_DIR, src)
        if os.path.exists(src_path):
            all_imgs = [f for f in os.listdir(src_path) if os.path.isfile(os.path.join(src_path, f))]
            selected = random.sample(all_imgs, min(len(all_imgs), 50))
            for img in selected:
                selected_mixed.append((src_path, img))
                
    print(f"Copying {len(selected_mixed)} mixed images for class: General___diseased_leaf")
    for src_path, img in selected_mixed:
        shutil.copy2(os.path.join(src_path, img), os.path.join(general_target_path, img))
        
    print("\nDataset preparation completed successfully!")
    return True

if __name__ == "__main__":
    prepare_dataset()
