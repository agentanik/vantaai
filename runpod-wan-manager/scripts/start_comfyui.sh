#!/bin/bash
# start_comfyui.sh
set -e

echo "================================================="
echo "🚀 STEP 9: Starting ComfyUI server..."
echo "================================================="
cd /workspace/ComfyUI

# Activate virtual environment
if [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
else
    echo "❌ ERROR: Virtual environment not found. Please run install_comfyui.sh first."
    exit 1
fi

echo "Launching ComfyUI on port 8188..."
# Listen on all interfaces so the proxy can connect
python main.py --listen 0.0.0.0 --port 8188
