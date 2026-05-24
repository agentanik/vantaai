#!/bin/bash
# install_wan2_2_ti2v_5b.sh
set -e

echo "================================================="
echo "📁 SETUP MODEL DIRECTORIES FOR WAN2.2 TI2V-5B"
echo "================================================="

# Check that /workspace exists
if [ ! -d "/workspace" ]; then
    echo "❌ ERROR: /workspace directory does not exist! This script must be run inside the RunPod instance."
    exit 1
fi

# Ensure directories exist
mkdir -p /workspace/ComfyUI/models/diffusion_models
mkdir -p /workspace/ComfyUI/models/vae
mkdir -p /workspace/ComfyUI/models/text_encoders

# Check free disk space (require at least 25GB)
FREE_KB=$(df -k /workspace | tail -1 | awk '{print $4}')
FREE_GB=$((FREE_KB / 1024 / 1024))
echo "Available disk space in /workspace: ${FREE_GB} GB"

if [ "$FREE_GB" -lt 25 ]; then
    echo "❌ ERROR: Insufficient disk space in /workspace (Only ${FREE_GB} GB available, need at least 25 GB)."
    exit 1
fi

# Activate ComfyUI virtual environment if present
if [ -f "/workspace/ComfyUI/venv/bin/activate" ]; then
    echo "Activating virtual environment..."
    source /workspace/ComfyUI/venv/bin/activate
fi

# Install/upgrade huggingface_hub
echo "Installing/upgrading huggingface_hub..."
pip install --upgrade huggingface_hub

# Authenticate with Hugging Face token if present
if [ -n "$HF_TOKEN" ] && [ "$HF_TOKEN" != "your_hugging_face_token_here" ] && [ "$HF_TOKEN" != "" ]; then
    echo "🔑 Authenticating with Hugging Face..."
    hf auth login --token "$HF_TOKEN"
else
    echo "ℹ️ No Hugging Face token detected in environment. Downloading public assets."
fi

echo "================================================="
echo "📥 DOWNLOADING WAN2.2 TI2V-5B MODEL FILES"
echo "================================================="

# 1. Download Text Encoder: umt5_xxl_fp8_e4m3fn_scaled.safetensors
TEXT_ENCODER_PATH="/workspace/ComfyUI/models/text_encoders/umt5_xxl_fp8_e4m3fn_scaled.safetensors"
if [ -f "$TEXT_ENCODER_PATH" ]; then
    echo "✅ Text Encoder already exists. Skipping."
else
    echo "Downloading umt5_xxl_fp8_e4m3fn_scaled.safetensors from Comfy-Org/Wan_2.2_ComfyUI_Repackaged..."
    hf download Comfy-Org/Wan_2.2_ComfyUI_Repackaged split_files/text_encoders/umt5_xxl_fp8_e4m3fn_scaled.safetensors --local-dir /workspace/ComfyUI/models
    mv /workspace/ComfyUI/models/split_files/text_encoders/umt5_xxl_fp8_e4m3fn_scaled.safetensors "$TEXT_ENCODER_PATH"
fi

# 2. Download VAE: wan2.2_vae.safetensors
VAE_PATH="/workspace/ComfyUI/models/vae/wan2.2_vae.safetensors"
if [ -f "$VAE_PATH" ]; then
    echo "✅ wan2.2_vae.safetensors already exists. Skipping."
else
    echo "Downloading wan2.2_vae.safetensors from Comfy-Org/Wan_2.2_ComfyUI_Repackaged..."
    hf download Comfy-Org/Wan_2.2_ComfyUI_Repackaged split_files/vae/wan2.2_vae.safetensors --local-dir /workspace/ComfyUI/models
    mv /workspace/ComfyUI/models/split_files/vae/wan2.2_vae.safetensors "$VAE_PATH"
fi

# 3. Download Main Diffusion Model: wan2.2_ti2v_5B_fp16.safetensors
MODEL_PATH="/workspace/ComfyUI/models/diffusion_models/wan2.2_ti2v_5B_fp16.safetensors"
if [ -f "$MODEL_PATH" ]; then
    echo "✅ wan2.2_ti2v_5B_fp16.safetensors already exists. Skipping."
else
    echo "Downloading wan2.2_ti2v_5B_fp16.safetensors from Comfy-Org/Wan_2.2_ComfyUI_Repackaged..."
    hf download Comfy-Org/Wan_2.2_ComfyUI_Repackaged split_files/diffusion_models/wan2.2_ti2v_5B_fp16.safetensors --local-dir /workspace/ComfyUI/models
    mv /workspace/ComfyUI/models/split_files/diffusion_models/wan2.2_ti2v_5B_fp16.safetensors "$MODEL_PATH"
fi

# Clean up split_files directory
rm -rf /workspace/ComfyUI/models/split_files

echo "================================================="
echo "🔍 VERIFYING DOWNLOADS"
echo "================================================="

# Confirm all files exist and print sizes
ALL_FOUND=true

for file in "$TEXT_ENCODER_PATH" "$VAE_PATH" "$MODEL_PATH"; do
    if [ -f "$file" ]; then
        SIZE_MB=$(du -m "$file" | cut -f1)
        echo "✅ Found: $file ($SIZE_MB MB)"
    else
        echo "❌ MISSING: $file"
        ALL_FOUND=false
    fi
done

if [ "$ALL_FOUND" = false ]; then
    echo "❌ ERROR: One or more required Wan2.2 TI2V-5B model files are missing!"
    exit 1
else
    echo "================================================="
    echo "🎉 SUCCESS: All Wan2.2 TI2V-5B model files are downloaded and verified."
    echo "================================================="
fi
