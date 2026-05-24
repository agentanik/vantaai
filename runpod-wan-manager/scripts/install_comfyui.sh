#!/bin/bash
# install_comfyui.sh
set -e

echo "================================================="
echo "⚙️ STEP 2: Cloning ComfyUI and creating Virtual Env..."
echo "================================================="
cd /workspace

if [ ! -d "ComfyUI" ]; then
    echo "Cloning official ComfyUI repository..."
    git clone https://github.com/comfyanonymous/ComfyUI.git
else
    echo "ComfyUI repository already exists in /workspace/ComfyUI."
fi

cd ComfyUI

# Set up virtual environment
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment in /workspace/ComfyUI/venv..."
    python3 -m venv venv
else
    echo "Virtual environment already exists."
fi

# Activate virtual environment
source venv/bin/activate

# Upgrade pip and install standard packages
echo "Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

echo "================================================="
echo "⚙️ STEP 3: Installing required custom nodes..."
echo "================================================="
mkdir -p custom_nodes
cd custom_nodes

# 1. WanVideoWrapper
if [ ! -d "ComfyUI-WanVideoWrapper" ]; then
    echo "Cloning ComfyUI-WanVideoWrapper repository (Kijai)..."
    git clone https://github.com/Kijai/ComfyUI-WanVideoWrapper.git
else
    echo "ComfyUI-WanVideoWrapper already exists."
fi
cd ComfyUI-WanVideoWrapper
echo "Installing WanVideoWrapper requirements..."
pip install -r requirements.txt
cd ..

# 2. VideoHelperSuite
if [ ! -d "ComfyUI-VideoHelperSuite" ]; then
    echo "Cloning ComfyUI-VideoHelperSuite repository (Kosinkadink)..."
    git clone https://github.com/Kosinkadink/ComfyUI-VideoHelperSuite.git
else
    echo "ComfyUI-VideoHelperSuite already exists."
fi
cd ComfyUI-VideoHelperSuite
echo "Installing VideoHelperSuite requirements..."
pip install -r requirements.txt
cd ..

# 3. KJNodes
if [ ! -d "ComfyUI-KJNodes" ]; then
    echo "Cloning ComfyUI-KJNodes repository (Kijai)..."
    git clone https://github.com/kijai/ComfyUI-KJNodes.git
else
    echo "ComfyUI-KJNodes already exists."
fi
cd ComfyUI-KJNodes
echo "Installing KJNodes requirements..."
pip install -r requirements.txt
cd ../..

echo "================================================="
echo "🔍 STEP 4: Verifying PyTorch and CUDA installation..."
echo "================================================="
python3 -c "
import torch
print('PyTorch Version:', torch.__version__)
print('CUDA Available:', torch.cuda.is_available())
if torch.cuda.is_available():
    print('CUDA Device:', torch.cuda.get_device_name(0))
else:
    print('⚠️ ERROR: CUDA is NOT available. Make sure you selected a GPU pod!')
"

echo "================================================="
echo "✅ ComfyUI setup completed successfully."
echo "================================================="
