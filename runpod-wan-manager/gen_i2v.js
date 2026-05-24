const fs = require('fs');
const path = require('path');

require('dotenv').config();
const runpodApiKey = process.env.RUNPOD_API_KEY || "";
const podId = "6g2yx32pnvizsm";
const comfyUrl = `https://${podId}-8188.proxy.runpod.net`;

const imagePath = `C:\\Users\\Trust computer world\\.gemini\\antigravity-ide\\brain\\3e1e6b34-d721-4ebf-8053-e872687fe218\\media__1779509126572.jpg`;
const prompt = `Cinematic high-quality 3D animation, ultra-detailed, smooth motion, 4K, romantic turning dramatic grand ballroom scene. Setting: Luxurious grand ballroom with high ceilings, massive crystal chandeliers, marble floor, golden decorations, and guests in formal attire in the background. Warm elegant lighting. Character Details (STRICT - Match Reference Image): - Mira: Beautiful young woman with long vibrant pink hair in a high ponytail, wearing an elegant white and pink floral mermaid gown with lace details, white heels, and jewelry. - Ginu: Handsome young man with black stylish hair, wearing a white suit with pink shirt and chain necklace. Action Sequence (Single Continuous Scene): Mira and Ginu stand close together in the center of the ballroom, each holding a champagne glass. They gently clink their glasses together with soft smiles. Ginu (warm, romantic, sincere voice): “I will remember this night forever…” They both take a sip from their champagne glasses. Suddenly, Mira’s face begins to change — fine wrinkles appear, making her look slightly older. Her expression shifts to shock. Mira (shocked, panicked voice): “Oh no, Ginu… I have to go!” Ginu looks confused and deeply concerned. Ginu (worried, emotional voice): “Mira! Wait… where are you going?” Mira turns quickly with a distressed face and starts running toward the large door of the hall, still holding her glass.`;

async function run() {
  console.log("Uploading image to ComfyUI...");
  const formData = new FormData();
  
  // Read file as Blob for upload
  const fileBuffer = fs.readFileSync(imagePath);
  const blob = new Blob([fileBuffer], { type: 'image/jpeg' });
  formData.append('image', blob, 'media__1779509126572.jpg');

  const uploadRes = await fetch(`${comfyUrl}/upload/image`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${runpodApiKey}` },
    body: formData
  });

  if (!uploadRes.ok) {
    console.error("Upload failed", await uploadRes.text());
    return;
  }
  
  const uploadData = await uploadRes.json();
  console.log("Uploaded successfully:", uploadData);

  const workflow = {
    "1": { "inputs": { "unet_name": "wan2.2_ti2v_5B_fp16.safetensors", "weight_dtype": "fp8_e4m3fn" }, "class_type": "UNETLoader" },
    "2": { "inputs": { "vae_name": "wan2.2_vae.safetensors" }, "class_type": "VAELoader" },
    "3": { "inputs": { "clip_name": "umt5_xxl_fp8_e4m3fn_scaled.safetensors", "type": "wan" }, "class_type": "CLIPLoader" },
    "4": { "inputs": { "text": prompt, "clip": [ "3", 0 ] }, "class_type": "CLIPTextEncode" },
    "5": { "inputs": { "text": "blurry, distorted, low quality, bad anatomy, deformed", "clip": [ "3", 0 ] }, "class_type": "CLIPTextEncode" },
    "6": { "inputs": { "image": uploadData.name, "upload": "image" }, "class_type": "LoadImage" },
    "11": { "inputs": { "pixels": [ "6", 0 ], "vae": [ "2", 0 ] }, "class_type": "VAEEncode" },
    "7": { "inputs": { "seed": Math.floor(Math.random() * 1000000), "steps": 25, "cfg": 6.0, "sampler_name": "euler", "scheduler": "normal", "denoise": 0.8, "model": [ "1", 0 ], "positive": [ "4", 0 ], "negative": [ "5", 0 ], "latent_image": [ "11", 0 ] }, "class_type": "KSampler" },
    "8": { "inputs": { "samples": [ "7", 0 ], "vae": [ "2", 0 ] }, "class_type": "VAEDecode" },
    "9": { "inputs": { "fps": 16, "images": [ "8", 0 ] }, "class_type": "CreateVideo" },
    "10": { "inputs": { "filename_prefix": "wan_test_i2v", "format": "mp4", "codec": "h264", "video": [ "9", 0 ] }, "class_type": "SaveVideo" }
  };

  console.log("Submitting I2V generation job...");
  const promptRes = await fetch(`${comfyUrl}/prompt`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${runpodApiKey}`
    },
    body: JSON.stringify({ prompt: workflow })
  });

  if (!promptRes.ok) {
    console.error("Failed to submit job", await promptRes.text());
    return;
  }
  const promptData = await promptRes.json();
  console.log("Job submitted! Prompt ID:", promptData.prompt_id);

  const promptId = promptData.prompt_id;
  
  let isDone = false;
  while (!isDone) {
    await new Promise(r => setTimeout(r, 5000));
    const histRes = await fetch(`${comfyUrl}/history/${promptId}`, {
      headers: { 'Authorization': `Bearer ${runpodApiKey}` }
    });
    if (!histRes.ok) continue;
    const histData = await histRes.json();
    
    if (histData[promptId]) {
      console.log("Generation complete!");
      const outputs = histData[promptId].outputs;
      if (outputs && outputs["10"] && outputs["10"].videos) {
        const videoInfo = outputs["10"].videos[0];
        const videoFilename = videoInfo.filename;
        console.log(`Downloading video: ${videoFilename}`);
        
        const vidRes = await fetch(`${comfyUrl}/view?filename=${videoFilename}&type=output`, {
          headers: { 'Authorization': `Bearer ${runpodApiKey}` }
        });
        const buffer = await vidRes.arrayBuffer();
        const outPath = path.join("F:\\workspace\\ComfyUI\\output", videoFilename);
        fs.writeFileSync(outPath, Buffer.from(buffer));
        console.log(`Video saved to ${outPath}`);
      }
      isDone = true;
    } else {
      process.stdout.write(".");
    }
  }
}

run().catch(console.error);
