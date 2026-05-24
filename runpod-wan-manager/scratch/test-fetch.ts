import { config } from '../src/lib/config';

async function test() {
  console.log("Testing fetch from Node...");
  const url = "https://rest.runpod.io/v1/pods";
  const headers = {
    'Authorization': `Bearer ${config.runpodApiKey}`,
    'Content-Type': 'application/json'
  };
  try {
    const start = Date.now();
    const res = await fetch(url, { headers });
    const data = await res.json();
    console.log(`Success in ${Date.now() - start}ms:`, data);
  } catch (err: any) {
    console.error("Error:", err);
  }
}

test();
