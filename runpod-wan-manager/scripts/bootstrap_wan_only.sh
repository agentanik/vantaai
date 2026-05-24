#!/bin/bash
# bootstrap_wan_only.sh
set -e

# Change directory to the root of the project
cd "$(dirname "$0")/.."

echo "================================================="
echo "⚡ BOOTSTRAPPING WAN2.2 TI2V-5B VIDEO GENERATION ENVIRONMENT"
echo "================================================="

echo "🔄 Running setup_pod_base.sh..."
bash scripts/setup_pod_base.sh

echo "🔄 Running check_gpu.sh..."
bash scripts/check_gpu.sh

echo "🔄 Running test_server_network.sh..."
bash scripts/test_server_network.sh

echo "🔄 Running install_comfyui.sh..."
bash scripts/install_comfyui.sh

echo "🔄 Running install_wan2_2_ti2v_5b.sh..."
bash scripts/install_wan2_2_ti2v_5b.sh

echo "🔄 Running check_models.sh..."
bash scripts/check_models.sh

echo "================================================="
echo "🎉 SUCCESS: WAN2.2 TI2V-5B BOOTSTRAP READY!"
echo "   You can now start ComfyUI using: bash scripts/start_comfyui.sh"
echo "================================================="
exit 0
