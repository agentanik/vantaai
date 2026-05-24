async function run() {
  const payload = {
    prompt: "A beautiful cinematic city at night, neon lights, 4k resolution",
    durationSeconds: 1
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
