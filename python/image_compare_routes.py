"""
Image Compare API Routes
Add these to the existing server.py FastAPI app.
Import at the top of server.py:
    from image_compare import (
        model_manager, save_pair, label_pair, list_pairs,
        get_pair_images, delete_pair, load_and_normalize,
        compute_difference, image_to_base64
    )
"""

from fastapi import UploadFile, File, Form, HTTPException
from typing import Optional

# ── Compare two images (no saving) ────────────────────────────────

@app.post("/api/image-compare/compare")
async def compare_images(
    reference: UploadFile = File(...),
    scanned: UploadFile = File(...),
):
    """Compare reference vs scanned image. Returns metrics + visual diff."""
    try:
        ref_bytes = await reference.read()
        scan_bytes = await scanned.read()

        ref_img = load_and_normalize(ref_bytes)
        scan_img = load_and_normalize(scan_bytes)
        result = compute_difference(ref_img, scan_img)

        # Also run AI prediction if model is loaded
        prediction = None
        if model_manager.model is not None:
            prediction = model_manager.predict(ref_bytes, scan_bytes)

        return {
            "metrics": result["metrics"],
            "images": {
                "difference": image_to_base64(result["difference_image"]),
                "heatmap": image_to_base64(result["heatmap"]),
                "overlay": image_to_base64(result["overlay"]),
            },
            "prediction": prediction,
        }
    except Exception as e:
        logger.error(f"Compare error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ── Save a pair for training ──────────────────────────────────────

@app.post("/api/image-compare/pairs")
async def upload_pair(
    reference: UploadFile = File(...),
    scanned: UploadFile = File(...),
    job: str = Form(""),
    layer: str = Form(""),
    label: Optional[str] = Form(None),
    notes: str = Form(""),
):
    """Upload a reference/scanned pair, optionally with a label."""
    try:
        ref_bytes = await reference.read()
        scan_bytes = await scanned.read()
        result = save_pair(ref_bytes, scan_bytes, job, layer, label, notes)
        return result
    except Exception as e:
        logger.error(f"Upload pair error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ── List pairs ────────────────────────────────────────────────────

@app.get("/api/image-compare/pairs")
async def get_pairs(label: Optional[str] = None, limit: int = 50):
    """List saved pairs, optionally filtered by label."""
    return {"pairs": list_pairs(label_filter=label, limit=limit)}


# ── Get pair images ───────────────────────────────────────────────

@app.get("/api/image-compare/pairs/{pair_id}/images")
async def get_pair_images_route(pair_id: str):
    """Get base64 images for a pair."""
    try:
        return get_pair_images(pair_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Pair not found")


# ── Label a pair ──────────────────────────────────────────────────

@app.put("/api/image-compare/pairs/{pair_id}/label")
async def label_pair_route(pair_id: str, label: str, notes: str = ""):
    """Label a pair as pass or fail."""
    if label not in ("pass", "fail"):
        raise HTTPException(status_code=400, detail="Label must be 'pass' or 'fail'")
    try:
        result = label_pair(pair_id, label, notes)
        return result
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Pair not found")


# ── Delete a pair ─────────────────────────────────────────────────

@app.delete("/api/image-compare/pairs/{pair_id}")
async def delete_pair_route(pair_id: str):
    """Delete a pair."""
    if delete_pair(pair_id):
        return {"success": True}
    raise HTTPException(status_code=404, detail="Pair not found")


# ── Model status ──────────────────────────────────────────────────

@app.get("/api/image-compare/model/status")
async def get_model_status():
    """Get AI model status and training data summary."""
    return model_manager.get_status()


# ── Train model ───────────────────────────────────────────────────

@app.post("/api/image-compare/model/train")
async def train_model(
    epochs: int = 30,
    learning_rate: float = 0.001,
    batch_size: int = 8,
):
    """Train the pass/fail model on all labeled pairs."""
    result = model_manager.train(
        epochs=epochs,
        learning_rate=learning_rate,
        batch_size=batch_size,
    )
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error", "Training failed"))
    return result


# ── Predict (inference) ───────────────────────────────────────────

@app.post("/api/image-compare/model/predict")
async def predict(
    reference: UploadFile = File(...),
    scanned: UploadFile = File(...),
):
    """Run pass/fail prediction on a pair."""
    ref_bytes = await reference.read()
    scan_bytes = await scanned.read()
    result = model_manager.predict(ref_bytes, scan_bytes)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


# ── Reset model ───────────────────────────────────────────────────

@app.delete("/api/image-compare/model")
async def reset_model():
    """Delete the trained model (keeps training data)."""
    model_manager.reset_model()
    return {"success": True, "message": "Model deleted. Training data preserved."}
