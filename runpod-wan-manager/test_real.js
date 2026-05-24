async function run() {
  const payload = {
    prompt: "cinematic futuristic city at night",
    width: 704,
    height: 704,
    durationSeconds: 3,
    autoStop: true,
    upscale: false
  };
  try {
    const res = await fetch('http://localhost:3001/api/v1/video/generate', {
      method: 'POST',
      headers: {
        'x-manager-api-key': 'mgr_sec_key_runpod_wan_2026_x',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    const text = await res.text();
    console.log(`Status: ${res.status}`);
    console.log(text);
  } catch (e) {
    console.error(e);
  }
}
run();
