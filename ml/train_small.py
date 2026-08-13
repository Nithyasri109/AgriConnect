import os
import sys
import json
import random
import numpy as np
import tensorflow as tf
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_recall_fscore_support
import ssl

# Bypass SSL certificate verification for downloading pretrained weights
try:
    ssl._create_default_https_context = ssl._create_unverified_context
except AttributeError:
    pass

RANDOM_SEED = 42
IMAGE_SIZE = (224, 224)
BATCH_SIZE = 32
DATASET_DIR = "./ml/custom_dataset"
MODEL_DIR = "./ml/models"
OUTPUT_DIR = "./ml/training_results"
NUM_IMAGES_PER_CLASS = 150

random.seed(RANDOM_SEED)
np.random.seed(RANDOM_SEED)
tf.random.set_seed(RANDOM_SEED)

def train_model():
    print("Loading custom dataset...")
    if not os.path.exists(DATASET_DIR):
        print(f"Error: Dataset directory {DATASET_DIR} not found.")
        sys.exit(1)
        
    os.makedirs(MODEL_DIR, exist_ok=True)
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    classes = sorted([d for d in os.listdir(DATASET_DIR) if os.path.isdir(os.path.join(DATASET_DIR, d))])
    num_classes = len(classes)
    print(f"Detected {num_classes} classes: {classes}")
    
    # Save index to class name map
    idx_to_class = {idx: cls for idx, cls in enumerate(classes)}
    with open(os.path.join(MODEL_DIR, "class_names.json"), "w") as f:
        json.dump(idx_to_class, f, indent=2)
        
    # Collect all image paths and labels
    paths, labels = [], []
    for idx, cls in enumerate(classes):
        cls_dir = os.path.join(DATASET_DIR, cls)
        imgs = [f for f in os.listdir(cls_dir) if os.path.isfile(os.path.join(cls_dir, f))]
        for img in imgs:
            paths.append(os.path.join(cls_dir, img))
            labels.append(idx)
            
    print(f"Total dataset size: {len(paths)} images")
    
    # Split: 80% train, 10% validation, 10% test
    train_paths, val_test_paths, train_labels, val_test_labels = train_test_split(
        paths, labels, test_size=0.2, random_state=RANDOM_SEED, stratify=labels
    )
    val_paths, test_paths, val_labels, test_labels = train_test_split(
        val_test_paths, val_test_labels, test_size=0.5, random_state=RANDOM_SEED, stratify=val_test_labels
    )
    
    print(f"Train size: {len(train_paths)}")
    print(f"Validation size: {len(val_paths)}")
    print(f"Test size: {len(test_paths)}")
    
    def parse_image(file_path, label):
        img = tf.io.read_file(file_path)
        img = tf.image.decode_jpeg(img, channels=3)
        img = tf.image.resize(img, IMAGE_SIZE)
        img = tf.keras.applications.mobilenet_v2.preprocess_input(img)
        return img, label
        
    train_ds = tf.data.Dataset.from_tensor_slices((train_paths, train_labels))
    train_ds = train_ds.shuffle(buffer_size=500, seed=RANDOM_SEED)
    train_ds = train_ds.map(parse_image, num_parallel_calls=tf.data.AUTOTUNE)
    
    # Augmentations for train
    data_augmentation = tf.keras.Sequential([
        tf.keras.layers.RandomFlip("horizontal"),
        tf.keras.layers.RandomRotation(0.1),
        tf.keras.layers.RandomZoom(0.1)
    ])
    train_ds = train_ds.map(lambda x, y: (data_augmentation(x, training=True), y), num_parallel_calls=tf.data.AUTOTUNE)
    train_ds = train_ds.batch(BATCH_SIZE).prefetch(tf.data.AUTOTUNE)
    
    val_ds = tf.data.Dataset.from_tensor_slices((val_paths, val_labels))
    val_ds = val_ds.map(parse_image, num_parallel_calls=tf.data.AUTOTUNE).batch(BATCH_SIZE).prefetch(tf.data.AUTOTUNE)
    
    test_ds = tf.data.Dataset.from_tensor_slices((test_paths, test_labels))
    test_ds = test_ds.map(parse_image, num_parallel_calls=tf.data.AUTOTUNE).batch(BATCH_SIZE).prefetch(tf.data.AUTOTUNE)
    
    # Model configuration
    base_model = tf.keras.applications.MobileNetV2(
        input_shape=(224, 224, 3), include_top=False, weights='imagenet'
    )
    base_model.trainable = False
    
    inputs = tf.keras.Input(shape=(224, 224, 3))
    x = base_model(inputs, training=False)
    x = tf.keras.layers.GlobalAveragePooling2D()(x)
    x = tf.keras.layers.Dropout(0.2)(x)
    outputs = tf.keras.layers.Dense(num_classes, activation='softmax')(x)
    model = tf.keras.Model(inputs, outputs)
    
    # Compile
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3),
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy']
    )
    
    checkpoint_path = os.path.join(MODEL_DIR, "plant_disease_model.keras")
    callbacks = [
        tf.keras.callbacks.EarlyStopping(patience=3, restore_best_weights=True, monitor='val_loss'),
        tf.keras.callbacks.ModelCheckpoint(checkpoint_path, save_best_only=True, monitor='val_loss')
    ]
    
    print("\n--- Training top head layers ---")
    model.fit(train_ds, validation_data=val_ds, epochs=3, callbacks=callbacks)
    
    # Fine-tuning
    print("\n--- Fine-tuning top upper convolutional layers ---")
    base_model.trainable = True
    for layer in base_model.layers[:-15]:
        layer.trainable = False
        
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-4),
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy']
    )
    
    model.fit(train_ds, validation_data=val_ds, epochs=3, callbacks=callbacks)
    
    # Load best model
    best_model = tf.keras.models.load_model(checkpoint_path)
    
    # Evaluation
    print("\n--- Evaluating on test set ---")
    y_pred_probs = best_model.predict(test_ds)
    y_pred = np.argmax(y_pred_probs, axis=1)
    
    test_accuracy = accuracy_score(test_labels, y_pred)
    val_loss, val_accuracy = best_model.evaluate(val_ds, verbose=0)
    precision, recall, f1, _ = precision_recall_fscore_support(test_labels, y_pred, average='weighted')
    
    print(f"Validation Accuracy: {val_accuracy * 100:.2f}%")
    print(f"Test Accuracy: {test_accuracy * 100:.2f}%")
    
    # Save training metrics
    metrics = {
        "dataset_path": DATASET_DIR,
        "classes_trained": classes,
        "images_per_class": NUM_IMAGES_PER_CLASS,
        "model_path": checkpoint_path,
        "validation_accuracy": float(val_accuracy),
        "test_accuracy": float(test_accuracy),
        "class_names_path": os.path.join(MODEL_DIR, "class_names.json")
    }
    with open(os.path.join(OUTPUT_DIR, "small_training_metadata.json"), "w") as f:
        json.dump(metrics, f, indent=2)
        
    print("\nModel saved successfully at:", checkpoint_path)
    print("Metadata saved at:", os.path.join(OUTPUT_DIR, "small_training_metadata.json"))

if __name__ == "__main__":
    train_model()
