async function testGen() {
  console.log("Triggering 5-sec smooth motion test...");
  const response = await fetch('http://localhost:3001/api/v1/video/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-manager-api-key': 'mgr_sec_key_runpod_wan_2026_x',
      'x-idempotency-key': 'wan-smooth-motion-test-002'
    },
    body: JSON.stringify({
      userId: "test-user",
      modelId: "wan2.2-ti2v-5b",
      prompt: "Cinematic high-quality 3D animated video of a beautiful woman with one single long lavender-purple braid sitting on a wooden swing on a sunny mountain cliff. The swing gently sways back and forth. Soap bubbles float slowly in the air. Her dress and braid move naturally in the wind. Bright blue sky, soft clouds, warm sunlight, smooth cinematic camera dolly-in, detailed animated movie style, stable character appearance, smooth continuous motion.",
      negativePrompt: "blurry, low quality, slideshow, still image, frozen pose, flicker, duplicate frames, stutter, bad anatomy, broken motion, jump cuts, multiple braids, two braids, three braids, split braid, distorted face, unstable identity, fast photo sequence, choppy motion",
      width: 704,
      height: 704,
      durationSeconds: 5,
      fps: 16,
      seed: 12345,
      priority: "medium",
      autoStop: true,
      upscale: false
    })
  });
  
  const text = await response.text();
  console.log("Response:", response.status, text);
}

testGen().catch(console.error);
