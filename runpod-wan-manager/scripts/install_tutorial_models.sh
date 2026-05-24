#!/bin/bash
# install_tutorial_models.sh
# Downloads the exact models specified in the Wan 2.1 Video Model Tutorial (ProgrammingHut)
set -e

echo "================================================="
echo "📥 DOWNLOADING MODELS (TUTORIAL SPECIFICATION)"
echo "================================================="

# Check that /workspace exists
if [ ! -d "/workspace" ]; then
    echo "❌ ERROR: /workspace directory does not exist! This script must be run inside the RunPod instance."
    exit 1
fi

echo "Creating model directories..."
mkdir -p /workspace/ComfyUI/models/diffusion_models
mkdir -p /workspace/ComfyUI/models/text_encoders
mkdir -p /workspace/ComfyUI/models/vae

echo "-------------------------------------------------"
echo "1. Downloading Diffusion Model (Wan2.1-14B-144p)"
echo "-------------------------------------------------"
cd /workspace/ComfyUI/models/diffusion_models
if [ -f "Wan2.1-14B-144p.safetensors" ]; then
    echo "✅ Wan2.1-14B-144p.safetensors already exists."
else
    wget https://huggingface.co/Kijai/WanVideo_comfy/resolve/main/Wan2.1-14B-144p.safetensors
fi

echo "-------------------------------------------------"
echo "2. Downloading Text Encoder (umt5-xxl-enc-fp8_e4m3fn)"
echo "-------------------------------------------------"
cd /workspace/ComfyUI/models/text_encoders
if [ -f "umt5-xxl-enc-fp8_e4m3fn.safetensors" ]; then
    echo "✅ umt5-xxl-enc-fp8_e4m3fn.safetensors already exists."
else
    wget https://huggingface.co/Kijai/WanVideo_comfy/resolve/main/umt5-xxl-enc-fp8_e4m3fn.safetensors
fi

echo "-------------------------------------------------"
echo "3. Downloading VAE (wan_vae)"
echo "-------------------------------------------------"
cd /workspace/ComfyUI/models/vae
if [ -f "wan_vae.safetensors" ]; then
    echo "✅ wan_vae.safetensors already exists."
else
    wget https://huggingface.co/Kijai/WanVideo_comfy/resolve/main/wan_vae.safetensors
fi

echo "================================================="
echo "🎉 SUCCESS: All tutorial models have been downloaded!"
echo "================================================="
