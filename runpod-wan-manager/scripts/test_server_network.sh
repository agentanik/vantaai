#!/bin/bash
# test_server_network.sh
set -e

echo "================================================="
echo "🌐 RUNPOD SERVER NETWORK DIAGNOSTIC"
echo "================================================="

# 1. Check if running inside a container / server environment
if [ ! -d "/workspace" ]; then
    echo "⚠️ WARNING: /workspace directory not found. Are you running this script locally?"
fi

# 2. Test connection to Hugging Face
echo "Testing connection to huggingface.co..."
HF_STATUS=$(curl -o /dev/null -s -w "%{http_code}" -I https://huggingface.co)

if [ "$HF_STATUS" -eq 200 ] || [ "$HF_STATUS" -eq 301 ] || [ "$HF_STATUS" -eq 302 ]; then
    echo "✅ Connection to Hugging Face: SUCCESS (HTTP $HF_STATUS)"
else
    echo "❌ CONNECTION ERROR: Unable to contact huggingface.co (HTTP $HF_STATUS)"
    exit 1
fi

# 3. Test small download speed
TEST_FILE_URL="https://huggingface.co/Kijai/WanVideo_comfy/resolve/main/wan2.1_vae.safetensors?download=true"
echo "Running speed test (downloading first 15MB of VAE model)..."

TEMP_FILE="/tmp/net_speed_test.tmp"
rm -f "$TEMP_FILE"

# Use curl with progress bar and time it
START_TIME=$(date +%s.%N)
# Download first 15MB only to prevent waiting long if network is slow
curl -L -r 0-15728640 -o "$TEMP_FILE" "$TEST_FILE_URL" --silent --show-error

END_TIME=$(date +%s.%N)
ELAPSED_TIME=$(echo "$END_TIME - $START_TIME" | bc)
FILE_SIZE=$(stat -c%s "$TEMP_FILE" 2>/dev/null || stat -f%z "$TEMP_FILE")

# Clean up
rm -f "$TEMP_FILE"

# Calculate speed in MB/s
SPEED_MB_S=$(echo "scale=2; ($FILE_SIZE / 1048576) / $ELAPSED_TIME" | bc)

echo "Downloaded $(echo "scale=2; $FILE_SIZE / 1048576" | bc) MB in $(echo "scale=2; $ELAPSED_TIME" | bc) seconds."
echo "⚡ Download Speed: $SPEED_MB_S MB/s"

# Warn or fail if speed is extremely low (e.g. less than 5 MB/s)
MIN_SPEED=5.0
IS_SLOW=$(echo "$SPEED_MB_S < $MIN_SPEED" | bc)

if [ "$IS_SLOW" -eq 1 ]; then
    echo "⚠️ WARNING: Download speed ($SPEED_MB_S MB/s) is below target threshold ($MIN_SPEED MB/s)."
    echo "Downloading massive model weights (10GB+) might take a long time on this host."
    echo "Consider redeploying this pod on a different RunPod host or region."
else
    echo "✅ Speed test passed ($SPEED_MB_S MB/s exceeds $MIN_SPEED MB/s threshold)."
fi

echo "================================================="
echo "✅ Network diagnostic completed successfully."
echo "================================================="
