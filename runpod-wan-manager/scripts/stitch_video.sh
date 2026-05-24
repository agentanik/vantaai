#!/bin/bash
# stitch_video.sh
# Stitches a sequence of PNG frames into a high-quality MP4 using FFmpeg
set -e

# Default settings
INPUT_DIR="/workspace/ComfyUI/output/frames"
OUTPUT_FILE="/workspace/ComfyUI/output/final_video_$(date +%s).mp4"
FPS=16

# Check for arguments
if [ -n "$1" ]; then
    INPUT_DIR=$1
fi
if [ -n "$2" ]; then
    OUTPUT_FILE=$2
fi
if [ -n "$3" ]; then
    FPS=$3
fi

echo "================================================="
echo "🎬 FAST VIDEO STITCHER (FFMPEG)"
echo "================================================="
echo "Input Directory: $INPUT_DIR"
echo "Output File: $OUTPUT_FILE"
echo "Framerate: ${FPS} fps"
echo "-------------------------------------------------"

# Ensure input directory exists
if [ ! -d "$INPUT_DIR" ]; then
    echo "❌ ERROR: Input directory $INPUT_DIR not found."
    exit 1
fi

# Ensure ffmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo "❌ ERROR: ffmpeg is not installed. Run apt-get install -y ffmpeg"
    exit 1
fi

# Run FFmpeg
# Assumes files are named with an index, e.g., frame_00001.png
# -pattern_type glob is used for robustness with varying naming conventions
echo "Stitching frames..."
ffmpeg -y -framerate "$FPS" -pattern_type glob -i "$INPUT_DIR/*.png" -c:v libx264 -pix_fmt yuv420p -preset fast -crf 19 "$OUTPUT_FILE"

echo "================================================="
echo "🎉 SUCCESS: Video saved to $OUTPUT_FILE"
echo "================================================="
