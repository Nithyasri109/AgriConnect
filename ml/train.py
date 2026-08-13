import os
import sys
import json
import random
import numpy as np
import tensorflow as tf
from PIL import Image
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score, precision_recall_fscore_support
import datetime
import ssl

# Bypass SSL certificate verification for downloading pretrained weights
try:
    ssl._create_default_https_context = ssl._create_unverified_context
except AttributeError:
    pass

# Configuration
RANDOM_SEED = 42
IMAGE_SIZE = (224, 224)
BATCH_SIZE = 32
TARGET_TOTAL_IMAGES = 25000
DATASET_DIR = "./plantvillage_dataset/color"
OUTPUT_DIR = "./ml/training_results"
MODEL_DIR = "./ml/models"

# Set random seeds for reproducibility
random.seed(RANDOM_SEED)
np.random.seed(RANDOM_SEED)
tf.random.set_seed(RANDOM_SEED)

def find_capping_limit(class_counts, target_total=25000):
    best_k = 1
    min_diff = float('inf')
    for k in range(1, max(class_counts.values()) + 1):
        total = sum(min(count, k) for count in class_counts.values())
        diff = abs(total - target_total)
        if diff < min_diff:
            min_diff = diff
            best_k = k
    return best_k

def load_split_dataset():
    # Load class inventory
    with open(os.path.join(OUTPUT_DIR, "class_counts.json"), "r") as f:
        metadata = json.load(f)
    
    class_counts = metadata["class_counts"]
    classes = sorted(list(class_counts.keys()))
    
    # Save class_names mapping (index to class name)
    class_to_idx = {cls: idx for idx, cls in enumerate(classes)}
    idx_to_class = {idx: cls for idx, cls in enumerate(classes)}
    
    os.makedirs(MODEL_DIR, exist_ok=True)
    with open(os.path.join(MODEL_DIR, "class_names.json"), "w") as f:
        json.dump(idx_to_class, f, indent=2)
        
    print(f"Saved class mapping to {os.path.join(MODEL_DIR, 'class_names.json')}")
    
    # Find capping limit K to get approx 25,000 images
    k_cap = find_capping_limit(class_counts, TARGET_TOTAL_IMAGES)
    print(f"Capping limit chosen: {k_cap} images per class to reach approx {TARGET_TOTAL_IMAGES} total images.")
    
    train_paths, train_labels = [], []
    val_paths, val_labels = [], []
    test_paths, test_labels = [], []
    
    distribution_report = []
    distribution_report.append("Class                         Available    Selected")
    distribution_report.append("----------------------------------------------------")
    
    selected_total = 0
    
    for cls in classes:
        cls_dir = os.path.join(DATASET_DIR, cls)
        all_imgs = sorted([f for f in os.listdir(cls_dir) if os.path.isfile(os.path.join(cls_dir, f))])
        
        # Determine number of images to select
        selected_count = min(len(all_imgs), k_cap)
        selected_total += selected_count
        distribution_report.append(f"{cls:<40} {len(all_imgs):<12} {selected_count:<8}")
        
        # Sample images
        sampled_imgs = random.sample(all_imgs, selected_count)
        
        # Split sampled images: 80% train, 10% val, 10% test
        # We use fixed splits
        train_count = int(selected_count * 0.8)
        val_count = int(selected_count * 0.1)
        # Test count is the rest
        
        cls_train = sampled_imgs[:train_count]
        cls_val = sampled_imgs[train_count:train_count+val_count]
        cls_test = sampled_imgs[train_count+val_count:]
        
        label_idx = class_to_idx[cls]
        
        for img in cls_train:
            train_paths.append(os.path.join(cls_dir, img))
            train_labels.append(label_idx)
            
        for img in cls_val:
            val_paths.append(os.path.join(cls_dir, img))
            val_labels.append(label_idx)
            
        for img in cls_test:
            test_paths.append(os.path.join(cls_dir, img))
            test_labels.append(label_idx)
            
    print("\n" + "\n".join(distribution_report) + "\n")
    print(f"Total Selected: {selected_total} images")
    print(f"Train set: {len(train_paths)} images")
    print(f"Validation set: {len(val_paths)} images")
    print(f"Test set: {len(test_paths)} images")
    
    # Save the distribution report
    with open(os.path.join(OUTPUT_DIR, "class_balancing_report.txt"), "w") as f:
        f.write("\n".join(distribution_report))
        
    return train_paths, train_labels, val_paths, val_labels, test_paths, test_labels, idx_to_class

def build_data_pipeline(paths, labels, is_training=False):
    # Convert labels to int32 tensors
    labels = np.array(labels, dtype=np.int32)
    
    def parse_image(file_path, label):
        # Read the image
        img = tf.io.read_file(file_path)
        # Decode jpeg
        img = tf.image.decode_jpeg(img, channels=3)
        # Resize to 224x224
        img = tf.image.resize(img, IMAGE_SIZE)
        # Normalize to [-1, 1] for MobileNetV2
        img = tf.keras.applications.mobilenet_v2.preprocess_input(img)
        return img, label

    # Create dataset
    dataset = tf.data.Dataset.from_tensor_slices((paths, labels))
    
    if is_training:
        dataset = dataset.shuffle(buffer_size=1000, seed=RANDOM_SEED)
        
    # Map decoding/preprocessing
    dataset = dataset.map(parse_image, num_parallel_calls=tf.data.AUTOTUNE)
    
    # Apply Augmentations ONLY to training
    if is_training:
        # Define modern data augmentation layers
        data_augmentation = tf.keras.Sequential([
            tf.keras.layers.RandomFlip("horizontal"),
            tf.keras.layers.RandomRotation(0.15),
            tf.keras.layers.RandomZoom(0.1),
            tf.keras.layers.RandomTranslation(0.1, 0.1),
            tf.keras.layers.RandomBrightness(0.1)
        ])
        
        def augment(img, label):
            # Apply augmentation (only during training phase execution)
            img = data_augmentation(img, training=True)
            return img, label
            
        dataset = dataset.map(augment, num_parallel_calls=tf.data.AUTOTUNE)
        
    dataset = dataset.batch(BATCH_SIZE)
    dataset = dataset.prefetch(buffer_size=tf.data.AUTOTUNE)
    return dataset

def main():
    print("==========================================")
    print("PLANTVILLAGE DATASET ML TRAINING PIPELINE")
    print("==========================================")
    
    # 1. Load dataset split lists
    train_paths, train_labels, val_paths, val_labels, test_paths, test_labels, idx_to_class = load_split_dataset()
    num_classes = len(idx_to_class)
    
    # 2. Build tf.data pipelines
    print("Building data pipelines...")
    train_ds = build_data_pipeline(train_paths, train_labels, is_training=True)
    val_ds = build_data_pipeline(val_paths, val_labels, is_training=False)
    test_ds = build_data_pipeline(test_paths, test_labels, is_training=False)
    
    # 3. Create Model using MobileNetV2 base
    print("Building model using MobileNetV2 base...")
    base_model = tf.keras.applications.MobileNetV2(
        input_shape=(IMAGE_SIZE[0], IMAGE_SIZE[1], 3),
        include_top=False,
        weights='imagenet'
    )
    
    # Freeze the base model
    base_model.trainable = False
    
    # Build classification head
    inputs = tf.keras.Input(shape=(IMAGE_SIZE[0], IMAGE_SIZE[1], 3))
    x = base_model(inputs, training=False) # training=False keeps batchnorm in inference mode
    x = tf.keras.layers.GlobalAveragePooling2D()(x)
    x = tf.keras.layers.Dropout(0.2)(x)
    outputs = tf.keras.layers.Dense(num_classes, activation='softmax')(x)
    model = tf.keras.Model(inputs, outputs)
    
    model.summary()
    
    # 4. Stage 1 Training: Classification Head
    print("\n--- STAGE 1: Training Classification Head ---")
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3),
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy']
    )
    
    # Callbacks
    checkpoint_path = os.path.join(MODEL_DIR, "plant_disease_model.keras")
    callbacks = [
        tf.keras.callbacks.EarlyStopping(patience=3, restore_best_weights=True, monitor='val_loss'),
        tf.keras.callbacks.ModelCheckpoint(checkpoint_path, save_best_only=True, monitor='val_loss'),
        tf.keras.callbacks.ReduceLROnPlateau(factor=0.2, patience=2, min_lr=1e-6, monitor='val_loss')
    ]
    
    # Train classification head for 3 epochs (fast head alignment)
    epochs_stage1 = 3
    history_stage1 = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=epochs_stage1,
        callbacks=callbacks
    )
    
    # 5. Stage 2 Training: Fine-tuning
    print("\n--- STAGE 2: Fine-Tuning Upper Layers ---")
    # Unfreeze the base model
    base_model.trainable = True
    # Freeze all layers except the top 30 layers
    for layer in base_model.layers[:-30]:
        layer.trainable = False
    
    # Recompile with very low learning rate
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-5),
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy']
    )
    
    # Train model for 3 epochs
    epochs_stage2 = 3
    history_stage2 = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=epochs_stage2,
        callbacks=callbacks
    )
    
    # 6. Evaluation
    print("\n--- Evaluating Model on Test Set ---")
    # Load the best saved model
    best_model = tf.keras.models.load_model(checkpoint_path)
    
    # Predict on test set
    print("Running predictions on test set...")
    y_pred_probs = best_model.predict(test_ds)
    y_pred = np.argmax(y_pred_probs, axis=1)
    
    test_accuracy = accuracy_score(test_labels, y_pred)
    precision, recall, f1, _ = precision_recall_fscore_support(test_labels, y_pred, average='weighted')
    
    print(f"Test Accuracy: {test_accuracy * 100:.2f}%")
    print(f"Test Precision: {precision * 100:.2f}%")
    print(f"Test Recall: {recall * 100:.2f}%")
    print(f"Test F1-score: {f1 * 100:.2f}%")
    
    # Classification Report
    report = classification_report(
        test_labels, y_pred, 
        target_names=[idx_to_class[i] for i in range(num_classes)],
        digits=4
    )
    
    with open(os.path.join(OUTPUT_DIR, "classification_report.txt"), "w") as f:
        f.write(report)
        
    print("\nClassification report saved.")
    
    # Confusion Matrix
    cm = confusion_matrix(test_labels, y_pred)
    plt.figure(figsize=(16, 14))
    plt.imshow(cm, interpolation='nearest', cmap=plt.cm.Blues)
    plt.title('Confusion Matrix')
    plt.colorbar()
    tick_marks = np.arange(num_classes)
    plt.xticks(tick_marks, [idx_to_class[i] for i in range(num_classes)], rotation=90)
    plt.yticks(tick_marks, [idx_to_class[i] for i in range(num_classes)])
    plt.tight_layout()
    plt.ylabel('True label')
    plt.xlabel('Predicted label')
    plt.savefig(os.path.join(OUTPUT_DIR, "confusion_matrix.png"))
    plt.close()
    print("Confusion matrix plot saved.")
    
    # Plot curves (Combine history)
    acc = history_stage1.history['accuracy'] + history_stage2.history['accuracy']
    val_acc = history_stage1.history['val_accuracy'] + history_stage2.history['val_accuracy']
    loss = history_stage1.history['loss'] + history_stage2.history['loss']
    val_loss = history_stage1.history['val_loss'] + history_stage2.history['val_loss']
    
    epochs_range = range(1, len(acc) + 1)
    
    # Plot Accuracy
    plt.figure(figsize=(10, 5))
    plt.plot(epochs_range, acc, label='Training Accuracy')
    plt.plot(epochs_range, val_acc, label='Validation Accuracy')
    plt.title('Training vs Validation Accuracy')
    plt.xlabel('Epoch')
    plt.ylabel('Accuracy')
    plt.legend(loc='lower right')
    plt.grid(True)
    plt.savefig(os.path.join(OUTPUT_DIR, "accuracy.png"))
    plt.close()
    
    # Plot Loss
    plt.figure(figsize=(10, 5))
    plt.plot(epochs_range, loss, label='Training Loss')
    plt.plot(epochs_range, val_loss, label='Validation Loss')
    plt.title('Training vs Validation Loss')
    plt.xlabel('Epoch')
    plt.ylabel('Loss')
    plt.legend(loc='upper right')
    plt.grid(True)
    plt.savefig(os.path.join(OUTPUT_DIR, "loss.png"))
    plt.close()
    print("Training history curves saved.")
    
    # 7. Save metadata
    total_epochs = len(acc)
    metadata = {
        "dataset_path": DATASET_DIR,
        "original_dataset_size": 54305,
        "selected_dataset_size": len(train_paths) + len(val_paths) + len(test_paths),
        "number_of_classes": num_classes,
        "training_image_count": len(train_paths),
        "validation_image_count": len(val_paths),
        "test_image_count": len(test_paths),
        "model_name": "MobileNetV2",
        "image_size": f"{IMAGE_SIZE[0]}x{IMAGE_SIZE[1]}",
        "batch_size": BATCH_SIZE,
        "number_of_epochs": total_epochs,
        "actual_epochs_completed": total_epochs,
        "random_seed": RANDOM_SEED,
        "test_accuracy": float(test_accuracy),
        "precision": float(precision),
        "recall": float(recall),
        "f1_score": float(f1),
        "training_datetime": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "model_version": "1.0.0"
    }
    
    with open(os.path.join(OUTPUT_DIR, "training_metadata.json"), "w") as f:
        json.dump(metadata, f, indent=2)
    print("Saved training metadata JSON.")
    
    print("\n==========================================")
    print("TRAINING PROCESS SUCCESSFULLY COMPLETED!")
    print("==========================================")

if __name__ == "__main__":
    main()
