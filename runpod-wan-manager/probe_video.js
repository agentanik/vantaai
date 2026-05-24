async function run() {
    try {
        const res = await fetch('https://k8w9j2e2xvcdv6-8188.proxy.runpod.net/object_info');
        const data = await res.json();
        console.log(JSON.stringify({
            CreateVideo: data['CreateVideo'],
            EmptyLatentImage: data['EmptyLatentImage'],
            KSampler: data['KSampler']
        }, null, 2));
    } catch(e) { console.error(e); }
}
run();
