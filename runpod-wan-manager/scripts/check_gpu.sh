#!/bin/bash
# check_gpu.sh
set -e

echo "================================================="
echo "⚙️ AUDITING NVIDIA GPU HARDWARE"
echo "================================================="

# 1. Check if nvidia-smi is available
if ! command -v nvidia-smi &> /dev/null; then
    echo "❌ ERROR: 'nvidia-smi' command not found. No NVIDIA GPU driver is installed or available!"
    exit 1
fi

echo "Retrieving GPU Info..."
nvidia-smi --query-gpu=name,memory.total --format=csv,noheader || {
    echo "❌ ERROR: Failed to query GPU using nvidia-smi."
    exit 1
}

# 2. Parse and print GPU details
GPU_NAME=$(nvidia-smi --query-gpu=gpu_name --format=csv,noheader | head -n 1)
VRAM_TOTAL=$(nvidia-smi --query-gpu=memory.total --format=csv,noheader,nounits | head -n 1 | awk '{print $1}')
VRAM_GB=$((VRAM_TOTAL / 1024))

echo ""
echo "Detected GPU: $GPU_NAME"
echo "Total VRAM:   $VRAM_GB GB ($VRAM_TOTAL MB)"
echo ""

# 3. Check VRAM and GPU Class
if [ "$VRAM_GB" -lt 22 ]; then
    echo "⚠️ WARNING: GPU VRAM is $VRAM_GB GB, which is less than the recommended 24GB for full FP16 inference."
    echo "You may need to enable FP8 precision or aggressive block swapping in ComfyUI."
fi

# Confirm RTX 4090 / 24GB class GPU
if [[ "$GPU_NAME" == *"4090"* ]] || [[ "$GPU_NAME" == *"3090"* ]] || [[ "$GPU_NAME" == *"A100"* ]] || [[ "$GPU_NAME" == *"A6000"* ]] || [[ "$VRAM_GB" -ge 24 ]]; then
    echo "✅ CONFIRMED: GPU matches RTX 4090 / 24GB VRAM class requirement."
else
    echo "⚠️ NOTE: Detected GPU ($GPU_NAME) is different from the target RTX 4090 / 24GB, but has $VRAM_GB GB VRAM."
fi

echo "================================================="
echo "✅ GPU audit completed successfully."
echo "================================================="
exit 0
