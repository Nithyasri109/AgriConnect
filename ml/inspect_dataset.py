import os
import sys
from PIL import Image
from collections import defaultdict
import json

DATASET_DIR = "./plantvillage_dataset/color/"
OUTPUT_DIR = "./ml/training_results"

def inspect_dataset():
    if not os.path.exists(DATASET_DIR):
        print(f"Error: Dataset directory {DATASET_DIR} does not exist.")
        sys.exit(1)
        
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    classes = sorted([d for d in os.listdir(DATASET_DIR) if os.path.isdir(os.path.join(DATASET_DIR, d))])
    
    total_images = 0
    class_counts = {}
    corrupted_images = []
    formats = defaultdict(int)
    dimensions = defaultdict(int)
    
    healthy_classes = []
    disease_classes = []
    
    print("Inspecting dataset classes and images...")
    
    for cls in classes:
        class_path = os.path.join(DATASET_DIR, cls)
        # Parse class type (healthy vs disease)
        parts = cls.split("___")
        plant = parts[0]
        condition = parts[1] if len(parts) > 1 else "unknown"
        
        if "healthy" in condition.lower():
            healthy_classes.append(cls)
        else:
            disease_classes.append(cls)
            
        cls_images = sorted([f for f in os.listdir(class_path) if os.path.isfile(os.path.join(class_path, f))])
        class_counts[cls] = len(cls_images)
        
        # Sample check format & dimension & corruption for first few files in each class
        # to avoid slow full-checks, but we will scan all filenames to count, and check readable status
        for idx, img_name in enumerate(cls_images):
            img_path = os.path.join(class_path, img_name)
            total_images += 1
            
            # Check format from file extension
            _, ext = os.path.splitext(img_name.lower())
            formats[ext] += 1
            
            # Open some images to check dimensions & detect corruption
            # Check up to 10 images per class for corruption and dimensions
            if idx < 10:
                try:
                    with Image.open(img_path) as img:
                        img.verify()
                    # Re-open to get size (verify doesn't load image details)
                    with Image.open(img_path) as img:
                        dimensions[img.size] += 1
                except Exception as e:
                    corrupted_images.append((img_path, str(e)))
                    
    # Generate the Markdown report content
    report = []
    report.append("# PlantVillage Dataset Inspection Report")
    report.append("")
    report.append(f"**Total images found:** {total_images}")
    report.append(f"**Total classes found:** {len(classes)}")
    report.append(f"**Healthy classes:** {len(healthy_classes)}")
    report.append(f"**Disease classes:** {len(disease_classes)}")
    report.append(f"**Corrupted/Unreadable files (sampled check):** {len(corrupted_images)}")
    report.append("")
    
    report.append("## Image Formats Summary")
    for fmt, count in sorted(formats.items()):
        report.append(f"- **{fmt}**: {count} images")
    report.append("")
    
    report.append("## Image Dimensions Summary (Sampled)")
    for dim, count in sorted(dimensions.items(), key=lambda x: x[1], reverse=True)[:5]:
        report.append(f"- **{dim[0]}x{dim[1]}**: {count} images")
    report.append("")
    
    report.append("## Class Distribution")
    report.append("| Class Name | Type | Images Count |")
    report.append("| :--- | :--- | :--- |")
    for cls in classes:
        cls_type = "Healthy" if cls in healthy_classes else "Disease"
        report.append(f"| {cls} | {cls_type} | {class_counts[cls]} |")
    report.append("")
    
    if corrupted_images:
        report.append("## Corrupted Images Found")
        for c_path, err in corrupted_images:
            report.append(f"- `{c_path}`: {err}")
    else:
        report.append("## Corrupted Images")
        report.append("No corrupted images found in the sampled inspection.")
        
    report_content = "\n".join(report)
    
    # Save the report
    report_path = os.path.join(OUTPUT_DIR, "dataset_inspection_report.md")
    with open(report_path, "w") as f:
        f.write(report_content)
        
    # Also save simple count metadata for train script
    with open(os.path.join(OUTPUT_DIR, "class_counts.json"), "w") as f:
        json.dump({
            "total_images": total_images,
            "classes_count": len(classes),
            "class_counts": class_counts,
            "healthy_classes": healthy_classes,
            "disease_classes": disease_classes
        }, f, indent=2)
        
    print("\n--- INVENTORY SUMMARY ---")
    print(f"Total Images: {total_images}")
    print(f"Total Classes: {len(classes)} ({len(healthy_classes)} healthy, {len(disease_classes)} diseased)")
    print(f"Report written to: {report_path}")
    print("-------------------------\n")

if __name__ == "__main__":
    inspect_dataset()
