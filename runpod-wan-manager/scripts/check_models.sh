#!/bin/bash
# check_models.sh
set -e

echo "================================================="
echo "🔍 AUDITING WAN2.2 TI2V-5B MODEL WEIGHTS"
echo "================================================="

TEXT_ENCODER="/workspace/ComfyUI/models/text_encoders/umt5_xxl_fp8_e4m3fn_scaled.safetensors"
VAE="/workspace/ComfyUI/models/vae/wan2.2_vae.safetensors"
MODEL="/workspace/ComfyUI/models/diffusion_models/wan2.2_ti2v_5B_fp16.safetensors"

MISSING=0

# Helper to check file
check_file() {
    local filepath=$1
    local name=$2
    if [ -f "$filepath" ]; then
        local size_mb=$(du -m "$filepath" | cut -f1)
        echo "✅ FOUND: $name"
        echo "   Path: $filepath"
        echo "   Size: $size_mb MB"
    else
        echo "❌ MISSING: $name"
        echo "   Expected Path: $filepath"
        MISSING=$((MISSING + 1))
    fi
    echo ""
}

check_file "$TEXT_ENCODER" "UMT5 XXL Text Encoder (FP8 Scaled)"
check_file "$VAE" "Wan2.2 VAE"
check_file "$MODEL" "Wan2.2 TI2V-5B (FP16 Checkpoint)"

# Storage statistics
echo "=== Disk Usage Stats ==="
if [ -d "/workspace" ]; then
    TOTAL_USAGE=$(du -sh /workspace | cut -f1)
    echo "Total disk space used by /workspace: $TOTAL_USAGE"
    df -h /workspace | tail -1 | awk '{print "Total Available: "$4" / Size: "$2" (Used: "$5")"}'
else
    echo "⚠️ /workspace directory not found."
fi
echo "================================================="

if [ "$MISSING" -gt 0 ]; then
    echo "❌ AUDIT FAILED: $MISSING required Wan2.2 TI2V-5B model files are missing."
    exit 1
else
    echo "🎉 AUDIT PASSED: All required Wan2.2 TI2V-5B model files are present."
    exit 0
fi
