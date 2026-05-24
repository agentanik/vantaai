const jobId = 'job_2166e18bdbfa47ed';

async function poll() {
  while (true) {
    const res = await fetch('http://localhost:3001/api/v1/video/status/' + jobId, {
      headers: { 'x-manager-api-key': 'mgr_sec_key_runpod_wan_2026_x' }
    });
    const json = await res.json();
    
    if (json.data && (json.data.status === 'completed' || json.data.status === 'failed')) {
      console.log('JOB DONE:', JSON.stringify(json.data, null, 2));
      break;
    }
    
    console.log(`Still ${json.data ? json.data.status : 'unknown'}... waiting 10s...`);
    await new Promise(r => setTimeout(r, 10000));
  }
}

poll().catch(console.error);
