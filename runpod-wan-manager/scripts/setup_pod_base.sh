#!/bin/bash
# setup_pod_base.sh
set -e

echo "================================================="
echo "⚙️ STEP 1: Setting up directory and OS packages..."
echo "================================================="
mkdir -p /workspace
cd /workspace

# Update apt and install prerequisites
apt-get update

echo "Installing Git, Git LFS, ffmpeg, wget, curl, and python3-venv..."
apt-get install -y git git-lfs ffmpeg wget curl python3-venv python3-pip

# Initialize Git LFS
echo "Initializing Git LFS..."
git lfs install

echo "================================================="
echo "✅ Pod base setup completed successfully."
echo "================================================="
