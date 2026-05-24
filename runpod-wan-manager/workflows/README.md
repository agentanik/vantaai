# ComfyUI Workflow Templates

This directory contains the JSON workflow templates utilized by the RunPod manager backend for automating video generation and upscaling.

### Active Workflows
1. `wan2.2-ti2v-5b.json`: The core Wan2.2 Text/Image-to-Video generation pipeline.
2. `video-upscale-template.json`: The post-processing workflow for video enhancement.

### Replacing Placeholders
To use your own custom workflows:
1. Export your workflow from ComfyUI using the **Save (API Format)** option.
2. Copy the exported JSON file into this folder, replacing the placeholders.
3. Update the corresponding Node IDs in your `.env` or `src/lib/config.ts` configuration mapping so the patcher can locate the parameters.
