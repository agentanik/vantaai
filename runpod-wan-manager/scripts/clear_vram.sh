#!/bin/bash
# clear_vram.sh
# Safely restarts the ComfyUI process to clear VRAM memory leaks
set -e

echo "================================================="
echo "🧹 CLEARING VRAM AND RESTARTING COMFYUI"
echo "================================================="

# Find the ComfyUI process (assuming it's run via python main.py)
PID=$(pgrep -f "python.*main.py" || true)

if [ -n "$PID" ]; then
    echo "Found ComfyUI process running on PID $PID. Terminating..."
    kill -15 "$PID"
    sleep 3
    # Force kill if still running
    if pgrep -f "python.*main.py" > /dev/null; then
        echo "Process didn't terminate gracefully. Force killing..."
        kill -9 "$PID"
    fi
else
    echo "No running ComfyUI process found."
fi

# Clean up memory caches
echo "Freeing system memory caches..."
sync; echo 3 > /proc/sys/vm/drop_caches || true

# Check if start_comfyui.sh exists to restart
START_SCRIPT="/workspace/runpod-slim/scripts/start_comfyui.sh"
if [ ! -f "$START_SCRIPT" ]; then
    START_SCRIPT="$(dirname "$0")/start_comfyui.sh"
fi

if [ -f "$START_SCRIPT" ]; then
    echo "Restarting ComfyUI..."
    # Run start script in background
    nohup bash "$START_SCRIPT" > /workspace/comfyui_restart.log 2>&1 &
    echo "✅ ComfyUI has been restarted. VRAM cleared."
else
    echo "⚠️ Start script not found. ComfyUI was stopped to clear VRAM but could not be restarted automatically."
fi

echo "================================================="
echo "🎉 SUCCESS: VRAM cleanup complete!"
echo "================================================="
