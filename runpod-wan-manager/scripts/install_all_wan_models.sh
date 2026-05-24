#!/bin/bash
# install_all_wan_models.sh
# A comprehensive script to download and verify Wan 2.1 & 2.2 models in ComfyUI
set -e

# Base Directories
WORKSPACE_DIR="/workspace"
COMFYUI_DIR="$WORKSPACE_DIR/ComfyUI"
DIFFUSION_DIR="$COMFYUI_DIR/models/diffusion_models"
VAE_DIR="$COMFYUI_DIR/models/vae"
TEXT_ENCODER_DIR="$COMFYUI_DIR/models/text_encoders"
CLIP_VISION_DIR="$COMFYUI_DIR/models/clip_vision"

echo "================================================="
echo "📥 COMPREHENSIVE WAN VIDEO MODEL DOWNLOADER"
echo "================================================="

# Help Message
show_help() {
    echo "Usage: bash scripts/install_all_wan_models.sh [options]"
    echo ""
    echo "Options:"
    echo "  --shared-only       Download shared components only (VAEs, Text Encoder, CLIP Vision)"
    echo "  --wan21-t2v-1.3b    Download Wan 2.1 Text-to-Video 1.3B (FP16)"
    echo "  --wan21-t2v-14b     Download Wan 2.1 Text-to-Video 14B (BF16)"
    echo "  --wan21-i2v-480p    Download Wan 2.1 Image-to-Video 480p 14B (BF16)"
    echo "  --wan21-i2v-720p    Download Wan 2.1 Image-to-Video 720p 14B (BF16)"
    echo "  --wan22-ti2v-5b     Download Wan 2.2 Text/Image-to-Video 5B (FP16)"
    echo "  --wan22-t2v-14b     Download Wan 2.2 Text-to-Video 14B (FP8 Scaled High/Low Noise)"
    echo "  --wan22-i2v-14b     Download Wan 2.2 Image-to-Video 14B (FP8 Scaled High/Low Noise)"
    echo "  --all               Download ALL Wan 2.1 and Wan 2.2 models (Requires >100GB space)"
    echo "  -h, --help          Show this help text"
    echo ""
    echo "Example: bash scripts/install_all_wan_models.sh --wan22-ti2v-5b"
}

# If no arguments provided, show help
if [ $# -eq 0 ]; then
    show_help
    exit 0
fi

# Parse options
DOWNLOAD_SHARED=false
DW_WAN21_T2V_1_3B=false
DW_WAN21_T2V_14B=false
DW_WAN21_I2V_480P=false
DW_WAN21_I2V_720P=false
DW_WAN22_TI2V_5B=false
DW_WAN22_T2V_14B=false
DW_WAN22_I2V_14B=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --shared-only)
            DOWNLOAD_SHARED=true
            shift
            ;;
        --wan21-t2v-1.3b)
            DW_WAN21_T2V_1_3B=true
            DOWNLOAD_SHARED=true
            shift
            ;;
        --wan21-t2v-14b)
            DW_WAN21_T2V_14B=true
            DOWNLOAD_SHARED=true
            shift
            ;;
        --wan21-i2v-480p)
            DW_WAN21_I2V_480P=true
            DOWNLOAD_SHARED=true
            shift
            ;;
        --wan21-i2v-720p)
            DW_WAN21_I2V_720P=true
            DOWNLOAD_SHARED=true
            shift
            ;;
        --wan22-ti2v-5b)
            DW_WAN22_TI2V_5B=true
            DOWNLOAD_SHARED=true
            shift
            ;;
        --wan22-t2v-14b)
            DW_WAN22_T2V_14B=true
            DOWNLOAD_SHARED=true
            shift
            ;;
        --wan22-i2v-14b)
            DW_WAN22_I2V_14B=true
            DOWNLOAD_SHARED=true
            shift
            ;;
        --all)
            DOWNLOAD_SHARED=true
            DW_WAN21_T2V_1_3B=true
            DW_WAN21_T2V_14B=true
            DW_WAN21_I2V_480P=true
            DW_WAN21_I2V_720P=true
            DW_WAN22_TI2V_5B=true
            DW_WAN22_T2V_14B=true
            DW_WAN22_I2V_14B=true
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            echo "❌ Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Ensure directories exist
mkdir -p "$DIFFUSION_DIR"
mkdir -p "$VAE_DIR"
mkdir -p "$TEXT_ENCODER_DIR"
mkdir -p "$CLIP_VISION_DIR"

# Verify virtual environment
if [ -f "$COMFYUI_DIR/venv/bin/activate" ]; then
    echo "🔄 Activating virtual environment..."
    source "$COMFYUI_DIR/venv/bin/activate"
else
    echo "⚠️ WARNING: Virtual environment not found at $COMFYUI_DIR/venv. Continuing with system Python."
fi

# Ensure huggingface_hub is installed
pip install --upgrade huggingface_hub

# Check if HF_TOKEN is present
if [ -n "$HF_TOKEN" ] && [ "$HF_TOKEN" != "your_hugging_face_token_here" ] && [ "$HF_TOKEN" != "" ]; then
    echo "🔑 Authenticating with Hugging Face token..."
    huggingface-cli login --token "$HF_TOKEN" --add-to-git-credential || true
fi

# Helper function to download from HF using huggingface-cli
download_model() {
    local repo=$1
    local filename=$2
    local target_dir=$3
    local final_name=$4

    echo "-------------------------------------------------"
    echo "📥 Downloading: $filename"
    echo "   From Repo:   $repo"
    echo "   To Directory:$target_dir"
    echo "-------------------------------------------------"

    # If the file already exists under final name, skip
    if [ -f "$target_dir/$final_name" ]; then
        echo "✅ File already exists: $target_dir/$final_name. Skipping."
        return 0
    fi

    # Run the download
    huggingface-cli download "$repo" "$filename" --local-dir "$target_dir" --local-dir-use-symlinks False

    # Move split files if they downloaded to subdirectories
    if [ -f "$target_dir/$filename" ]; then
        if [ "$filename" != "$final_name" ]; then
            mv "$target_dir/$filename" "$target_dir/$final_name"
        fi
    else
        # Handle cases where the download command structure leaves subdirectories (e.g. split_files/...)
        local base_filename=$(basename "$filename")
        local found_path=$(find "$target_dir" -name "$base_filename" -type f | head -n 1)
        if [ -n "$found_path" ]; then
            mv "$found_path" "$target_dir/$final_name"
            # Cleanup empty subdirectories
            find "$target_dir" -mindepth 1 -type d -empty -delete
        else
            echo "❌ ERROR: Downloaded file not found!"
            exit 1
        fi
    fi
    echo "✅ Successfully downloaded and placed $final_name"
}

# 1. Download Shared Components
if [ "$DOWNLOAD_SHARED" = true ]; then
    echo "🛠️ Downloading Shared Components..."
    
    # Text Encoder (Shared by Wan 2.1 and 2.2)
    download_model "Comfy-Org/Wan_2.2_ComfyUI_Repackaged" "split_files/text_encoders/umt5_xxl_fp8_e4m3fn_scaled.safetensors" "$TEXT_ENCODER_DIR" "umt5_xxl_fp8_e4m3fn_scaled.safetensors"

    # CLIP Vision (Required for Image-to-Video workflows)
    download_model "Comfy-Org/Wan_2.2_ComfyUI_Repackaged" "split_files/clip_vision/clip_vision_h.safetensors" "$CLIP_VISION_DIR" "clip_vision_h.safetensors"

    # Wan 2.1 VAE (Used for all Wan 2.1 models and Wan 2.2 14B models)
    download_model "Comfy-Org/Wan_2.1_ComfyUI_repackaged" "split_files/vae/wan_2.1_vae.safetensors" "$VAE_DIR" "wan_2.1_vae.safetensors"

    # Wan 2.2 VAE (Used specifically for Wan 2.2 5B model)
    download_model "Comfy-Org/Wan_2.2_ComfyUI_Repackaged" "split_files/vae/wan2.2_vae.safetensors" "$VAE_DIR" "wan2.2_vae.safetensors"
fi

# 2. Wan 2.1 Model Options
if [ "$DW_WAN21_T2V_1_3B" = true ]; then
    download_model "Comfy-Org/Wan_2.1_ComfyUI_repackaged" "split_files/diffusion_models/wan2.1_t2v_1.3B_fp16.safetensors" "$DIFFUSION_DIR" "wan2.1_t2v_1.3B_fp16.safetensors"
fi

if [ "$DW_WAN21_T2V_14B" = true ]; then
    download_model "Comfy-Org/Wan_2.1_ComfyUI_repackaged" "split_files/diffusion_models/wan2.1_t2v_14B_bf16.safetensors" "$DIFFUSION_DIR" "wan2.1_t2v_14B_bf16.safetensors"
fi

if [ "$DW_WAN21_I2V_480P" = true ]; then
    download_model "Comfy-Org/Wan_2.1_ComfyUI_repackaged" "split_files/diffusion_models/wan2.1_i2v_480p_14B_bf16.safetensors" "$DIFFUSION_DIR" "wan2.1_i2v_480p_14B_bf16.safetensors"
fi

if [ "$DW_WAN21_I2V_720P" = true ]; then
    download_model "Comfy-Org/Wan_2.1_ComfyUI_repackaged" "split_files/diffusion_models/wan2.1_i2v_720p_14B_bf16.safetensors" "$DIFFUSION_DIR" "wan2.1_i2v_720p_14B_bf16.safetensors"
fi

# 3. Wan 2.2 Model Options
if [ "$DW_WAN22_TI2V_5B" = true ]; then
    download_model "Comfy-Org/Wan_2.2_ComfyUI_Repackaged" "split_files/diffusion_models/wan2.2_ti2v_5B_fp16.safetensors" "$DIFFUSION_DIR" "wan2.2_ti2v_5B_fp16.safetensors"
fi

if [ "$DW_WAN22_T2V_14B" = true ]; then
    # Downloads BOTH high and low noise weights required for Wan 2.2 14B Text-to-Video
    download_model "Comfy-Org/Wan_2.2_ComfyUI_Repackaged" "split_files/diffusion_models/wan2.2_t2v_high_noise_14B_fp8_scaled.safetensors" "$DIFFUSION_DIR" "wan2.2_t2v_high_noise_14B_fp8_scaled.safetensors"
    download_model "Comfy-Org/Wan_2.2_ComfyUI_Repackaged" "split_files/diffusion_models/wan2.2_t2v_low_noise_14B_fp8_scaled.safetensors" "$DIFFUSION_DIR" "wan2.2_t2v_low_noise_14B_fp8_scaled.safetensors"
fi

if [ "$DW_WAN22_I2V_14B" = true ]; then
    # Downloads BOTH high and low noise weights required for Wan 2.2 14B Image-to-Video
    download_model "Comfy-Org/Wan_2.2_ComfyUI_Repackaged" "split_files/diffusion_models/wan2.2_i2v_high_noise_14B_fp8_scaled.safetensors" "$DIFFUSION_DIR" "wan2.2_i2v_high_noise_14B_fp8_scaled.safetensors"
    download_model "Comfy-Org/Wan_2.2_ComfyUI_Repackaged" "split_files/diffusion_models/wan2.2_i2v_low_noise_14B_fp8_scaled.safetensors" "$DIFFUSION_DIR" "wan2.2_i2v_low_noise_14B_fp8_scaled.safetensors"
fi

echo "================================================="
echo "🔍 VERIFYING DOWNLOADED FILES..."
echo "================================================="
echo "=== VAE models ==="
ls -lh "$VAE_DIR" || true
echo "=== CLIP Vision models ==="
ls -lh "$CLIP_VISION_DIR" || true
echo "=== Text Encoder models ==="
ls -lh "$TEXT_ENCODER_DIR" || true
echo "=== Diffusion models ==="
ls -lh "$DIFFUSION_DIR" || true

echo "================================================="
echo "🎉 SUCCESS: All selected Wan model assets are ready!"
echo "================================================="
