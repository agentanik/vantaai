async function run() {
  try {
    const res = await fetch('http://localhost:3001/api/v1/workflows/validate', {
      method: 'POST',
      headers: {
        'x-manager-api-key': 'mgr_sec_key_runpod_wan_2026_x',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ modelId: "wan2.2-ti2v-5b" })
    });
    console.log(await res.text());
  } catch(e) { console.error(e); }
}
run();
