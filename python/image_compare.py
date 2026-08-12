"""
Image Compare & AI Training Module
Self-contained pass/fail classifier for PCB layer images.
Compares ODB++ rendered reference images against scanned machine images.
Trains a lightweight CNN model on labeled pairs for automated inspection.
"""

import os
import io
import json
import uuid
import shutil
import logging
import base64
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, Any, List, Tuple

import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageChops, ImageFilter

logger = logging.getLogger(__name__)

# ── Storage paths ──────────────────────────────────────────────────
DATA_ROOT = os.environ.get("IMAGE_COMPARE_DATA", "/app/data/image_compare")
UPLOAD_DIR = os.path.join(DATA_ROOT, "uploads")
PAIRS_DIR = os.path.join(DATA_ROOT, "pairs")
TRAINING_DIR = os.path.join(DATA_ROOT, "training")
MODEL_DIR = os.path.join(DATA_ROOT, "models")

for d in [UPLOAD_DIR, PAIRS_DIR, TRAINING_DIR, MODEL_DIR]:
    os.makedirs(d, exist_ok=True)


# ══════════════════════════════════════════════════════════════════
#  IMAGE PROCESSING & COMPARISON
# ══════════════════════════════════════════════════════════════════

def load_and_normalize(image_bytes: bytes, target_size: Tuple[int, int] = (512, 512)) -> Image.Image:
    """Load image from bytes, convert to grayscale, resize."""
    img = Image.open(io.BytesIO(image_bytes))
    if img.mode != "L":
        img = img.convert("L")
    img = img.resize(target_size, Image.LANCZOS)
    return img


def compute_difference(reference: Image.Image, scanned: Image.Image) -> Dict[str, Any]:
    """
    Compute pixel-level difference between reference (ODB render) and scanned image.
    Returns difference image, metrics, and heatmap.
    """
    # Absolute difference
    diff = ImageChops.difference(reference, scanned)
    diff_array = np.array(diff, dtype=np.float32)
    ref_array = np.array(reference, dtype=np.float32)
    scan_array = np.array(scanned, dtype=np.float32)

    # Metrics
    mse = float(np.mean(diff_array ** 2))
    mae = float(np.mean(diff_array))
    max_diff = float(np.max(diff_array))
    psnr = float(10 * np.log10(255.0 ** 2 / max(mse, 1e-10)))

    # Structural similarity (simplified SSIM)
    mu_ref = np.mean(ref_array)
    mu_scan = np.mean(scan_array)
    sigma_ref = np.std(ref_array)
    sigma_scan = np.std(scan_array)
    sigma_cross = np.mean((ref_array - mu_ref) * (scan_array - mu_scan))
    c1, c2 = (0.01 * 255) ** 2, (0.03 * 255) ** 2
    ssim = float(
        ((2 * mu_ref * mu_scan + c1) * (2 * sigma_cross + c2)) /
        ((mu_ref ** 2 + mu_scan ** 2 + c1) * (sigma_ref ** 2 + sigma_scan ** 2 + c2))
    )

    # Threshold difference to find defect regions
    threshold = 30  # pixels with > 30/255 difference
    defect_mask = diff_array > threshold
    defect_pixel_count = int(np.sum(defect_mask))
    total_pixels = diff_array.shape[0] * diff_array.shape[1]
    defect_ratio = defect_pixel_count / total_pixels

    # Generate heatmap (colorized difference)
    heatmap = _create_heatmap(diff_array)

    # Generate overlay (reference with defects highlighted in red)
    overlay = _create_overlay(reference, defect_mask)

    return {
        "metrics": {
            "mse": round(mse, 2),
            "mae": round(mae, 2),
            "max_diff": round(max_diff, 2),
            "psnr": round(psnr, 2),
            "ssim": round(ssim, 4),
            "defect_pixels": defect_pixel_count,
            "defect_ratio": round(defect_ratio * 100, 3),
        },
        "difference_image": diff,
        "heatmap": heatmap,
        "overlay": overlay,
    }


def _create_heatmap(diff_array: np.ndarray) -> Image.Image:
    """Create a colorized heatmap from grayscale difference (vectorized)."""
    if diff_array.max() > 0:
        n = (diff_array / diff_array.max() * 255).astype(np.float32)
    else:
        n = diff_array.astype(np.float32)

    h, w = n.shape
    rgb = np.zeros((h, w, 3), dtype=np.uint8)

    # Blue zone: 0-84
    mask1 = n < 85
    rgb[mask1, 2] = (n[mask1] * 3).astype(np.uint8)

    # Yellow zone: 85-169
    mask2 = (n >= 85) & (n < 170)
    t2 = (n[mask2] - 85) / 85.0
    rgb[mask2, 0] = (255 * t2).astype(np.uint8)
    rgb[mask2, 1] = (255 * t2).astype(np.uint8)
    rgb[mask2, 2] = (255 * (1 - t2)).astype(np.uint8)

    # Red zone: 170-255
    mask3 = n >= 170
    t3 = (n[mask3] - 170) / 85.0
    rgb[mask3, 0] = 255
    rgb[mask3, 1] = (255 * (1 - t3)).astype(np.uint8)
    rgb[mask3, 2] = 0

    return Image.fromarray(rgb, "RGB")


def _create_overlay(reference: Image.Image, defect_mask: np.ndarray) -> Image.Image:
    """Overlay defect regions in red on the reference image."""
    ref_rgb = reference.convert("RGB")
    ref_array = np.array(ref_rgb)
    overlay = ref_array.copy()
    overlay[defect_mask] = [255, 60, 60]  # red highlight
    # Blend
    blended = (ref_array * 0.6 + overlay * 0.4).astype(np.uint8)
    blended[defect_mask] = overlay[defect_mask]
    return Image.fromarray(blended, "RGB")


def image_to_base64(img: Image.Image, fmt: str = "PNG") -> str:
    """Convert PIL Image to base64 data URI."""
    buf = io.BytesIO()
    img.save(buf, format=fmt)
    b64 = base64.b64encode(buf.getvalue()).decode()
    return f"data:image/{fmt.lower()};base64,{b64}"


# ══════════════════════════════════════════════════════════════════
#  PAIR MANAGEMENT (for training data)
# ══════════════════════════════════════════════════════════════════

def save_pair(
    reference_bytes: bytes,
    scanned_bytes: bytes,
    job: str = "",
    layer: str = "",
    label: Optional[str] = None,  # "pass" or "fail" or None (unlabeled)
    notes: str = "",
) -> Dict[str, Any]:
    """Save a reference/scanned image pair for training or review."""
    pair_id = str(uuid.uuid4())[:8]
    pair_dir = os.path.join(PAIRS_DIR, pair_id)
    os.makedirs(pair_dir, exist_ok=True)

    ref_img = load_and_normalize(reference_bytes)
    scan_img = load_and_normalize(scanned_bytes)

    ref_img.save(os.path.join(pair_dir, "reference.png"))
    scan_img.save(os.path.join(pair_dir, "scanned.png"))

    # Compute and save difference
    comparison = compute_difference(ref_img, scan_img)
    comparison["difference_image"].save(os.path.join(pair_dir, "difference.png"))
    comparison["heatmap"].save(os.path.join(pair_dir, "heatmap.png"))
    comparison["overlay"].save(os.path.join(pair_dir, "overlay.png"))

    metadata = {
        "pair_id": pair_id,
        "job": job,
        "layer": layer,
        "label": label,
        "notes": notes,
        "metrics": comparison["metrics"],
        "created": datetime.now().isoformat(),
    }
    with open(os.path.join(pair_dir, "metadata.json"), "w") as f:
        json.dump(metadata, f, indent=2)

    return metadata


def label_pair(pair_id: str, label: str, notes: str = "") -> Dict[str, Any]:
    """Label a pair as 'pass' or 'fail' for training."""
    meta_path = os.path.join(PAIRS_DIR, pair_id, "metadata.json")
    if not os.path.exists(meta_path):
        raise FileNotFoundError(f"Pair {pair_id} not found")

    with open(meta_path) as f:
        metadata = json.load(f)

    metadata["label"] = label
    if notes:
        metadata["notes"] = notes
    metadata["labeled_at"] = datetime.now().isoformat()

    with open(meta_path, "w") as f:
        json.dump(metadata, f, indent=2)

    return metadata


def list_pairs(label_filter: Optional[str] = None, limit: int = 50) -> List[Dict]:
    """List saved pairs, optionally filtered by label."""
    pairs = []
    if not os.path.exists(PAIRS_DIR):
        return pairs

    for pair_id in sorted(os.listdir(PAIRS_DIR), reverse=True):
        meta_path = os.path.join(PAIRS_DIR, pair_id, "metadata.json")
        if os.path.exists(meta_path):
            with open(meta_path) as f:
                meta = json.load(f)
            if label_filter is None or meta.get("label") == label_filter:
                pairs.append(meta)
            if len(pairs) >= limit:
                break

    return pairs


def get_pair_images(pair_id: str) -> Dict[str, str]:
    """Get base64-encoded images for a pair."""
    pair_dir = os.path.join(PAIRS_DIR, pair_id)
    if not os.path.exists(pair_dir):
        raise FileNotFoundError(f"Pair {pair_id} not found")

    images = {}
    for name in ["reference", "scanned", "difference", "heatmap", "overlay"]:
        img_path = os.path.join(pair_dir, f"{name}.png")
        if os.path.exists(img_path):
            img = Image.open(img_path)
            images[name] = image_to_base64(img)

    return images


def delete_pair(pair_id: str) -> bool:
    """Delete a pair and all its images."""
    pair_dir = os.path.join(PAIRS_DIR, pair_id)
    if os.path.exists(pair_dir):
        shutil.rmtree(pair_dir)
        return True
    return False


# ══════════════════════════════════════════════════════════════════
#  AI MODEL — Lightweight CNN for Pass/Fail Classification
# ══════════════════════════════════════════════════════════════════

# We use PyTorch for the model. The classifier takes a 3-channel input:
#   Channel 0: reference image (grayscale)
#   Channel 1: scanned image (grayscale)
#   Channel 2: difference image (grayscale)
# This gives the model full context: what it should look like, what it
# actually looks like, and where the differences are.

try:
    import torch
    import torch.nn as nn
    import torch.optim as optim
    from torch.utils.data import Dataset, DataLoader
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False
    logger.warning("PyTorch not available — AI training/inference disabled")


if TORCH_AVAILABLE:

    class PCBCompareNet(nn.Module):
        """
        Lightweight CNN for PCB image comparison pass/fail classification.
        Input: 3-channel 128x128 image (reference, scanned, difference)
        Output: 2-class probability (pass, fail)
        ~150K parameters — trains in seconds on CPU with small datasets.
        """

        def __init__(self):
            super().__init__()
            self.features = nn.Sequential(
                # Block 1: 3 -> 16 channels, 128 -> 64
                nn.Conv2d(3, 16, kernel_size=3, padding=1),
                nn.BatchNorm2d(16),
                nn.ReLU(inplace=True),
                nn.MaxPool2d(2),

                # Block 2: 16 -> 32, 64 -> 32
                nn.Conv2d(16, 32, kernel_size=3, padding=1),
                nn.BatchNorm2d(32),
                nn.ReLU(inplace=True),
                nn.MaxPool2d(2),

                # Block 3: 32 -> 64, 32 -> 16
                nn.Conv2d(32, 64, kernel_size=3, padding=1),
                nn.BatchNorm2d(64),
                nn.ReLU(inplace=True),
                nn.MaxPool2d(2),

                # Block 4: 64 -> 64, 16 -> 8
                nn.Conv2d(64, 64, kernel_size=3, padding=1),
                nn.BatchNorm2d(64),
                nn.ReLU(inplace=True),
                nn.AdaptiveAvgPool2d(4),  # -> 64 x 4 x 4
            )

            self.classifier = nn.Sequential(
                nn.Flatten(),
                nn.Linear(64 * 4 * 4, 128),
                nn.ReLU(inplace=True),
                nn.Dropout(0.3),
                nn.Linear(128, 2),  # pass, fail
            )

        def forward(self, x):
            x = self.features(x)
            x = self.classifier(x)
            return x


    class PCBPairDataset(Dataset):
        """Dataset that loads labeled pairs for training."""

        def __init__(self, pairs_dir: str, input_size: int = 128):
            self.samples = []
            self.input_size = input_size

            for pair_id in os.listdir(pairs_dir):
                meta_path = os.path.join(pairs_dir, pair_id, "metadata.json")
                if not os.path.exists(meta_path):
                    continue
                with open(meta_path) as f:
                    meta = json.load(f)
                if meta.get("label") in ("pass", "fail"):
                    self.samples.append({
                        "pair_dir": os.path.join(pairs_dir, pair_id),
                        "label": 0 if meta["label"] == "pass" else 1,
                    })

        def __len__(self):
            return len(self.samples)

        def __getitem__(self, idx):
            s = self.samples[idx]
            ref = Image.open(os.path.join(s["pair_dir"], "reference.png")).convert("L")
            scan = Image.open(os.path.join(s["pair_dir"], "scanned.png")).convert("L")
            diff = Image.open(os.path.join(s["pair_dir"], "difference.png")).convert("L")

            # Resize to input_size
            ref = ref.resize((self.input_size, self.input_size), Image.LANCZOS)
            scan = scan.resize((self.input_size, self.input_size), Image.LANCZOS)
            diff = diff.resize((self.input_size, self.input_size), Image.LANCZOS)

            # Stack as 3-channel tensor, normalize to [0, 1]
            tensor = torch.stack([
                torch.FloatTensor(np.array(ref)) / 255.0,
                torch.FloatTensor(np.array(scan)) / 255.0,
                torch.FloatTensor(np.array(diff)) / 255.0,
            ])

            return tensor, s["label"]


# ══════════════════════════════════════════════════════════════════
#  TRAINING & INFERENCE API
# ══════════════════════════════════════════════════════════════════

class ModelManager:
    """Manages model training, saving, loading, and inference."""

    def __init__(self):
        self.model: Optional[Any] = None
        self.model_path = os.path.join(MODEL_DIR, "pcb_compare_model.pt")
        self.meta_path = os.path.join(MODEL_DIR, "model_meta.json")
        self.training_log: List[Dict] = []
        self._load_if_exists()

    def _load_if_exists(self):
        """Load saved model on startup."""
        if not TORCH_AVAILABLE:
            return
        if os.path.exists(self.model_path):
            try:
                self.model = PCBCompareNet()
                self.model.load_state_dict(torch.load(self.model_path, map_location="cpu"))
                self.model.eval()
                logger.info("Loaded existing model from %s", self.model_path)
            except Exception as e:
                logger.warning("Failed to load model: %s", e)
                self.model = None

    def get_status(self) -> Dict[str, Any]:
        """Get model status and training history."""
        status = {
            "torch_available": TORCH_AVAILABLE,
            "model_loaded": self.model is not None,
            "model_path": self.model_path,
        }

        # Count labeled pairs
        pairs = list_pairs()
        pass_count = sum(1 for p in pairs if p.get("label") == "pass")
        fail_count = sum(1 for p in pairs if p.get("label") == "fail")
        unlabeled = sum(1 for p in pairs if p.get("label") is None)

        status["training_data"] = {
            "pass": pass_count,
            "fail": fail_count,
            "unlabeled": unlabeled,
            "total": len(pairs),
        }

        if os.path.exists(self.meta_path):
            with open(self.meta_path) as f:
                status["model_meta"] = json.load(f)

        return status

    def train(
        self,
        epochs: int = 30,
        learning_rate: float = 0.001,
        batch_size: int = 8,
        augment: bool = True,
    ) -> Dict[str, Any]:
        """
        Train the model on all labeled pairs.
        Returns training results with loss/accuracy history.
        """
        if not TORCH_AVAILABLE:
            return {"error": "PyTorch not installed", "success": False}

        dataset = PCBPairDataset(PAIRS_DIR)

        if len(dataset) < 4:
            return {
                "error": f"Need at least 4 labeled pairs to train (have {len(dataset)})",
                "success": False,
            }

        # Check class balance
        labels = [s["label"] for s in dataset.samples]
        n_pass = labels.count(0)
        n_fail = labels.count(1)
        if n_pass == 0 or n_fail == 0:
            return {
                "error": f"Need examples of both pass ({n_pass}) and fail ({n_fail})",
                "success": False,
            }

        # Class weights for imbalanced data
        total = len(labels)
        weight_pass = total / (2 * n_pass)
        weight_fail = total / (2 * n_fail)
        class_weights = torch.FloatTensor([weight_pass, weight_fail])

        # Split: 80% train, 20% val
        n_val = max(1, len(dataset) // 5)
        n_train = len(dataset) - n_val
        train_set, val_set = torch.utils.data.random_split(dataset, [n_train, n_val])

        train_loader = DataLoader(train_set, batch_size=batch_size, shuffle=True)
        val_loader = DataLoader(val_set, batch_size=batch_size)

        # Initialize model
        model = PCBCompareNet()
        criterion = nn.CrossEntropyLoss(weight=class_weights)
        optimizer = optim.Adam(model.parameters(), lr=learning_rate)
        scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, patience=5, factor=0.5)

        history = {"train_loss": [], "val_loss": [], "val_accuracy": []}
        best_val_acc = 0.0

        for epoch in range(epochs):
            # Train
            model.train()
            epoch_loss = 0.0
            for inputs, targets in train_loader:
                optimizer.zero_grad()
                outputs = model(inputs)
                loss = criterion(outputs, torch.LongTensor(targets.numpy()))
                loss.backward()
                optimizer.step()
                epoch_loss += loss.item()

            avg_train_loss = epoch_loss / len(train_loader)
            history["train_loss"].append(round(avg_train_loss, 4))

            # Validate
            model.eval()
            val_loss = 0.0
            correct = 0
            total_val = 0
            with torch.no_grad():
                for inputs, targets in val_loader:
                    outputs = model(inputs)
                    loss = criterion(outputs, torch.LongTensor(targets.numpy()))
                    val_loss += loss.item()
                    _, predicted = torch.max(outputs, 1)
                    total_val += targets.size(0)
                    correct += (predicted == targets).sum().item()

            avg_val_loss = val_loss / max(len(val_loader), 1)
            val_acc = correct / max(total_val, 1)
            history["val_loss"].append(round(avg_val_loss, 4))
            history["val_accuracy"].append(round(val_acc, 4))

            scheduler.step(avg_val_loss)

            if val_acc >= best_val_acc:
                best_val_acc = val_acc
                # Save best model
                torch.save(model.state_dict(), self.model_path)

            if (epoch + 1) % 5 == 0:
                logger.info(
                    "Epoch %d/%d — train_loss: %.4f, val_loss: %.4f, val_acc: %.2f%%",
                    epoch + 1, epochs, avg_train_loss, avg_val_loss, val_acc * 100
                )

        # Reload best model
        model.load_state_dict(torch.load(self.model_path, map_location="cpu"))
        model.eval()
        self.model = model

        # Save metadata
        meta = {
            "trained_at": datetime.now().isoformat(),
            "epochs": epochs,
            "learning_rate": learning_rate,
            "train_samples": n_train,
            "val_samples": n_val,
            "pass_samples": n_pass,
            "fail_samples": n_fail,
            "best_val_accuracy": round(best_val_acc * 100, 1),
            "final_train_loss": history["train_loss"][-1],
            "final_val_loss": history["val_loss"][-1],
            "parameters": sum(p.numel() for p in model.parameters()),
        }
        with open(self.meta_path, "w") as f:
            json.dump(meta, f, indent=2)

        return {
            "success": True,
            "meta": meta,
            "history": history,
        }

    def predict(self, reference_bytes: bytes, scanned_bytes: bytes) -> Dict[str, Any]:
        """
        Run inference on a reference/scanned pair.
        Returns pass/fail prediction with confidence.
        """
        if not TORCH_AVAILABLE:
            return {"error": "PyTorch not installed"}
        if self.model is None:
            return {"error": "No model loaded — train one first"}

        ref = load_and_normalize(reference_bytes, (128, 128))
        scan = load_and_normalize(scanned_bytes, (128, 128))
        diff = ImageChops.difference(ref, scan)

        tensor = torch.stack([
            torch.FloatTensor(np.array(ref)) / 255.0,
            torch.FloatTensor(np.array(scan)) / 255.0,
            torch.FloatTensor(np.array(diff)) / 255.0,
        ]).unsqueeze(0)  # add batch dimension

        self.model.eval()
        with torch.no_grad():
            outputs = self.model(tensor)
            probabilities = torch.softmax(outputs, dim=1)[0]
            predicted_class = torch.argmax(probabilities).item()

        result_label = "pass" if predicted_class == 0 else "fail"
        confidence = float(probabilities[predicted_class])

        return {
            "prediction": result_label,
            "confidence": round(confidence * 100, 1),
            "probabilities": {
                "pass": round(float(probabilities[0]) * 100, 1),
                "fail": round(float(probabilities[1]) * 100, 1),
            },
        }

    def reset_model(self) -> bool:
        """Delete the trained model (keep training data)."""
        self.model = None
        for f in [self.model_path, self.meta_path]:
            if os.path.exists(f):
                os.remove(f)
        return True


# Singleton instance
model_manager = ModelManager()
