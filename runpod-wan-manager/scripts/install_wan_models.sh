#!/bin/bash
# install_wan_models.sh
set -e

echo "================================================="
echo "📁 STEP 5: Setting up model directories..."
echo "================================================="
mkdir -p /workspace/ComfyUI/models/diffusion_models
mkdir -p /workspace/ComfyUI/models/vae
mkdir -p /workspace/ComfyUI/models/text_encoders

# Activate venv
if [ -f "/workspace/ComfyUI/venv/bin/activate" ]; then
    source /workspace/ComfyUI/venv/bin/activate
else
    echo "❌ ERROR: Virtual environment not found. Please run install_comfyui.sh first."
    exit 1
fi

echo "================================================="
echo "⚙️ STEP 6: Installing huggingface_hub..."
echo "================================================="
pip install --upgrade huggingface_hub

# Check if HF Token is set
if [ -n "$HF_TOKEN" ] && [ "$HF_TOKEN" != "your_hugging_face_token_here" ]; then
    echo "🔑 Authenticating with Hugging Face..."
    huggingface-cli login --token "$HF_TOKEN" --add-to-git-credential
else
    echo "ℹ️ No Hugging Face token detected in environment. Downloading public assets."
fi

echo "================================================="
echo "📥 STEP 7: Downloading Wan2.2 / Wan2.1 models..."
echo "================================================="

# Download VAE
if [ -f "/workspace/ComfyUI/models/vae/wan2.1_vae.safetensors" ]; then
    echo "✅ wan2.1_vae.safetensors already exists. Skipping download."
else
    echo "Downloading wan2.1_vae.safetensors..."
    huggingface-cli download Kijai/WanVideo_comfy wan2.1_vae.safetensors --local-dir /workspace/ComfyUI/models/vae --local-dir-use-symlinks False
fi

# Download Text Encoder (Scaled UMT5 XXL FP8)
if [ -f "/workspace/ComfyUI/models/text_encoders/umt5_xxl_fp8_e4m3fn_scaled.safetensors" ]; then
    echo "✅ umt5_xxl_fp8_e4m3fn_scaled.safetensors already exists. Skipping download."
else
    echo "Downloading umt5_xxl_fp8_e4m3fn_scaled.safetensors..."
    huggingface-cli download Kijai/WanVideo_comfy umt5_xxl_fp8_e4m3fn_scaled.safetensors --local-dir /workspace/ComfyUI/models/text_encoders --local-dir-use-symlinks False
fi

# Download Main Diffusion Model
# Default to the 14B FP8 model which is community-quantized for consumer GPUs like RTX 4090 (24GB VRAM)
# If you explicitly need a 5B model, you can modify the repository and file names below.
if [ -f "/workspace/ComfyUI/models/diffusion_models/wan2.1_i2v_720p_14B_fp8.safetensors" ]; then
    echo "✅ wan2.1_i2v_720p_14B_fp8.safetensors already exists. Skipping download."
else
    echo "Downloading Wan Diffusion Model (wan2.1_i2v_720p_14B_fp8.safetensors)..."
    huggingface-cli download Kijai/WanVideo_comfy wan2.1_i2v_720p_14B_fp8.safetensors --local-dir /workspace/ComfyUI/models/diffusion_models --local-dir-use-symlinks False
fi

echo "================================================="
echo "🔍 STEP 8: Verifying downloads..."
echo "================================================="
echo "=== VAE Folder ==="
ls -lh /workspace/ComfyUI/models/vae
echo "=== Text Encoders Folder ==="
ls -lh /workspace/ComfyUI/models/text_encoders
echo "=== Diffusion Models Folder ==="
ls -lh /workspace/ComfyUI/models/diffusion_models

echo "================================================="
echo "✅ Wan Model files downloaded and verified."
echo "================================================="
