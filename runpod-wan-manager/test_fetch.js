require('dotenv').config();
const key = process.env.RUNPOD_API_KEY || "";
async function run() {
  try {
    const res = await fetch('https://rest.runpod.io/v1/pods', {
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('Status:', res.status);
    console.log(await res.text());
  } catch (e) {
    console.error(e);
  }
}
run();
