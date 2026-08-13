import os
import json
import numpy as np
import matplotlib.pyplot as plt
from PIL import Image
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix

# We dynamically check if PyTorch is installed, so the script compiles and is fully ready for Google Colab/Kaggle.
try:
    import torch
    import torch.nn as nn
    import torch.optim as optim
    from torch.utils.data import Dataset, DataLoader
    import torchvision.transforms as transforms
    import torchvision.models as models
    PYTORCH_AVAILABLE = True
except ImportError:
    PYTORCH_AVAILABLE = False

DATASET_DIR = "./plantvillage_dataset"

def build_paths():
    # Detect spacing variations in directory names
    if os.path.exists(os.path.join(DATASET_DIR, "color")):
        return os.path.join(DATASET_DIR, "color")
    elif os.path.exists("./plantvillage dataset/color"):
        return "./plantvillage dataset/color"
    return None

class PlantVillageDataset(Dataset):
    def __init__(self, file_paths, labels, transform=None):
        self.file_paths = file_paths
        self.labels = labels
        self.transform = transform

    def __len__(self):
        return len(self.file_paths)

    def __getitem__(self, idx):
        img_path = self.file_paths[idx]
        image = Image.open(img_path).convert('RGB')
        label = self.labels[idx]
        if self.transform:
            image = self.transform(image)
        return image, label

def train_model():
    print("==================================================")
    print("PLANTVILLAGE ML TRAINING PIPELINE (MobileNetV2)")
    print("==================================================")

    dataset_path = build_paths()
    if not dataset_path:
        print(f"Error: PlantVillage color dataset not found in {DATASET_DIR} or nearby paths.")
        print("Please ensure the dataset is downloaded and extracted in the root of the project.")
        return

    print(f"Dataset path: {dataset_path}")

    classes = sorted([d for d in os.listdir(dataset_path) if os.path.isdir(os.path.join(dataset_path, d))])
    print(f"Number of classes: {len(classes)}")
    
    file_paths = []
    labels = []
    class_to_idx = {cls: idx for idx, cls in enumerate(classes)}

    for cls in classes:
        cls_dir = os.path.join(dataset_path, cls)
        for f in os.listdir(cls_dir):
            if f.startswith('.'):
                continue
            file_paths.append(os.path.join(cls_dir, f))
            labels.append(class_to_idx[cls])

    print(f"Total images: {len(file_paths)}")
    print(f"Saving class mappings to class_names.json...")
    with open("./backend/class_names.json", "w") as f:
        json.dump(classes, f, indent=2)

    if not PYTORCH_AVAILABLE:
        print("\n[WARNING] PyTorch or torchvision is not installed in the current environment.")
        print("This script is ready to be run in Google Colab, Kaggle, or a GPU-enabled Python environment.")
        print("To run, please install dependencies:")
        print("  pip install torch torchvision matplotlib scikit-learn pillow onnx")
        return

    # Train / Val / Test split (80% / 10% / 10%)
    train_files, test_files, train_labels, test_labels = train_test_split(
        file_paths, labels, test_size=0.20, random_state=42, stratify=labels
    )
    val_files, test_files, val_labels, test_labels = train_test_split(
        test_files, test_labels, test_size=0.50, random_state=42, stratify=test_labels
    )

    print(f"Data split:")
    print(f"  Training samples: {len(train_files)}")
    print(f"  Validation samples: {len(val_files)}")
    print(f"  Testing samples: {len(test_files)}")

    # Preprocessing & Data Augmentation
    train_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.RandomHorizontalFlip(),
        transforms.RandomRotation(15),
        transforms.ColorJitter(brightness=0.2, contrast=0.2),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    val_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    train_dataset = PlantVillageDataset(train_files, train_labels, train_transform)
    val_dataset = PlantVillageDataset(val_files, val_labels, val_transform)
    test_dataset = PlantVillageDataset(test_files, test_labels, val_transform)

    train_loader = DataLoader(train_dataset, batch_size=32, shuffle=True, num_workers=2)
    val_loader = DataLoader(val_dataset, batch_size=32, shuffle=False, num_workers=2)
    test_loader = DataLoader(test_dataset, batch_size=32, shuffle=False, num_workers=2)

    # Model definition: Lightweight MobileNetV2 for Transfer Learning
    print("Loading MobileNetV2 pretrained model...")
    model = models.mobilenet_v2(pretrained=True)
    
    # Freeze core feature extractor layers
    for param in model.parameters():
        param.requires_grad = False

    # Replace classifier head
    num_ftrs = model.classifier[1].in_features
    model.classifier[1] = nn.Sequential(
        nn.Dropout(0.2),
        nn.Linear(num_ftrs, len(classes))
    )

    device = torch.device("cuda" if torch.cuda.is_available() else "mps" if torch.backends.mps.is_available() else "cpu")
    print(f"Training will run on device: {device}")
    model.to(device)

    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.classifier.parameters(), lr=0.001)
    scheduler = optim.lr_scheduler.StepLR(optimizer, step_size=3, gamma=0.1)

    epochs = 10
    best_val_loss = float('inf')
    history = {'train_loss': [], 'val_loss': [], 'train_acc': [], 'val_acc': []}

    print("Starting training loop...")
    for epoch in range(epochs):
        model.train()
        running_loss = 0.0
        correct_train = 0
        total_train = 0

        for images, labels_batch in train_loader:
            images, labels_batch = images.to(device), labels_batch.to(device)
            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels_batch)
            loss.backward()
            optimizer.step()

            running_loss += loss.item() * images.size(0)
            _, predicted = torch.max(outputs, 1)
            correct_train += (predicted == labels_batch).sum().item()
            total_train += labels_batch.size(0)

        scheduler.step()
        epoch_train_loss = running_loss / len(train_files)
        epoch_train_acc = correct_train / total_train

        # Validation phase
        model.eval()
        running_val_loss = 0.0
        correct_val = 0
        total_val = 0

        with torch.no_grad():
            for val_images, val_labels_batch in val_loader:
                val_images, val_labels_batch = val_images.to(device), val_labels_batch.to(device)
                val_outputs = model(val_images)
                val_loss = criterion(val_outputs, val_labels_batch)

                running_val_loss += val_loss.item() * val_images.size(0)
                _, val_predicted = torch.max(val_outputs, 1)
                correct_val += (val_predicted == val_labels_batch).sum().item()
                total_val += val_labels_batch.size(0)

        epoch_val_loss = running_val_loss / len(val_files)
        epoch_val_acc = correct_val / total_val

        history['train_loss'].append(epoch_train_loss)
        history['val_loss'].append(epoch_val_loss)
        history['train_acc'].append(epoch_train_acc)
        history['val_acc'].append(epoch_val_acc)

        print(f"Epoch {epoch+1}/{epochs}:")
        print(f"  Train Loss: {epoch_train_loss:.4f} | Train Acc: {epoch_train_acc:.4f}")
        print(f"  Val Loss: {epoch_val_loss:.4f} | Val Acc: {epoch_val_acc:.4f}")

        # Checkpoint and save best model
        if epoch_val_loss < best_val_loss:
            best_val_loss = epoch_val_loss
            torch.save(model.state_dict(), "./backend/model.pth")
            print("  New checkpoint saved! (model.pth)")

    print("Training complete. Loading best checkpoint for evaluation...")
    model.load_state_dict(torch.load("./backend/model.pth"))
    model.eval()

    # Test set evaluation
    all_preds = []
    all_targets = []
    
    with torch.no_grad():
        for test_images, test_labels_batch in test_loader:
            test_images = test_images.to(device)
            outputs = model(test_images)
            _, predicted = torch.max(outputs, 1)
            all_preds.extend(predicted.cpu().numpy())
            all_targets.extend(test_labels_batch.numpy())

    # Report performance metrics
    print("\n==================================================")
    print("MODEL EVALUATION ON TEST SET")
    print("==================================================")
    print(classification_report(all_targets, all_preds, target_names=classes))

    # Plot loss and accuracy curves
    plt.figure(figsize=(12, 5))
    plt.subplot(1, 2, 1)
    plt.plot(history['train_loss'], label='Train Loss')
    plt.plot(history['val_loss'], label='Val Loss')
    plt.title('Training and Validation Loss')
    plt.xlabel('Epoch')
    plt.ylabel('Loss')
    plt.legend()

    plt.subplot(1, 2, 2)
    plt.plot(history['train_acc'], label='Train Acc')
    plt.plot(history['val_acc'], label='Val Acc')
    plt.title('Training and Validation Accuracy')
    plt.xlabel('Epoch')
    plt.ylabel('Accuracy')
    plt.legend()
    
    plt.tight_layout()
    plt.savefig("./backend/training_curves.png")
    print("Saved training loss/accuracy curves to ./backend/training_curves.png")

    # Export to ONNX format
    print("\nExporting model to ONNX format...")
    dummy_input = torch.randn(1, 3, 224, 224).to(device)
    torch.onnx.export(
        model, dummy_input, "./backend/plant_disease_model.onnx",
        export_params=True, opset_version=11,
        do_constant_folding=True,
        input_names=['input'], output_names=['output'],
        dynamic_axes={'input': {0: 'batch_size'}, 'output': {0: 'batch_size'}}
    )
    print("Export complete: ./backend/plant_disease_model.onnx saved!")

if __name__ == "__main__":
    train_model()
