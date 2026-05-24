async function listFiles(repoId: string) {
  console.log(`\n=== Files in ${repoId} ===`);
  try {
    const url = `https://huggingface.co/api/models/${repoId}`;
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`Failed to fetch: ${res.statusText}`);
      return;
    }
    const data = await res.json() as any;
    if (data.siblings) {
      data.siblings.forEach((s: any) => {
        console.log(`- ${s.rpath || s.path || JSON.stringify(s)}`);
      });
    } else {
      console.log('No siblings found.');
    }
  } catch (err: any) {
    console.error(`Error: ${err.message}`);
  }
}

async function main() {
  await listFiles('Kijai/WanVideo_comfy');
  await listFiles('Comfy-Org/Wan_2.2_ComfyUI_Repackaged');
}

main().catch(console.error);
