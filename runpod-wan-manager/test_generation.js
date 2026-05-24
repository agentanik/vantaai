async function run() {
  const payload = {
    userId: "test-user",
    modelId: "wan2.2-ti2v-5b",
    prompt: "Cinematic high-quality 3D animation, ultra-detailed, smooth motion, bright dramatic daytime atmosphere. Beautiful high cliff edge with a wooden swing hanging from a flower-decorated wooden beam. Stunning mountain and sky view, floating soap bubbles, blue sky and white clouds. Rumi is a beautiful woman matching the reference image, with exactly one single long thick lavender-purple braid. She must always have only one braid, never two braids, never three braids, never split hair. She wears an elegant purple rose-themed dress and sits barefoot on the wooden swing. Ginu is a handsome young man matching the reference image, black hair, white shirt over pink t-shirt, jeans. He stands behind the swing. Derby Cat is a large blue cat with glowing yellow eyes, sitting happily near the cliff. Single continuous cinematic shot. The wooden swing gently sways back and forth. Rumi sits happily on the swing, holding the ropes and smiling as soap bubbles float around her. Ginu stands behind her with a cold malicious smile. Ginu holds the right swing rope with his left hand and holds a sharp knife in his right hand. He presses the knife against that same rope and makes exactly three visible sawing motions. On the third cut, the rope snaps, the swing loses balance, Rumi’s eyes widen, and she falls backward off the cliff. Derby Cat is happy at first, then surprised. Smooth wide opening shot, dolly-in during action, dramatic tilt down during the fall. No cuts, no scene transition.",
    negativePrompt: "blurry, low quality, bad anatomy, duplicate characters, multiple braids, two braids, three braids, split braid, loose purple hair, wrong outfit, wrong hand placement, wrong rope, knife in wrong hand, missing knife, missing cat, cat off screen, swing not moving, rope snapping too early, more than three cuts, fewer than three cuts, jump cut, scene cut, blood, gore, graphic injury, deformed face, inconsistent character identity",
    width: 704,
    height: 704,
    durationSeconds: 3,
    seed: 12345,
    priority: "medium",
    autoStop: true,
    upscale: false
  };
  try {
    const res = await fetch('http://localhost:3001/api/v1/video/generate', {
      method: 'POST',
      headers: {
        'x-manager-api-key': 'mgr_sec_key_runpod_wan_2026_x',
        'x-idempotency-key': 'rumi-ginu-clean-test-001',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    console.log(`Status: ${res.status}`);
    console.log(await res.text());
  } catch(e) { console.error(e); }
}
run();
