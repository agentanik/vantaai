const fs = require('fs');

async function run() {
    try {
        const res = await fetch('https://k8w9j2e2xvcdv6-8188.proxy.runpod.net/object_info');
        const data = await res.json();
        
        const nodeNames = Object.keys(data);
        const targetNodes = nodeNames.filter(n => 
            n.toLowerCase().includes('wan') || 
            n.toLowerCase().includes('video') || 
            n.toLowerCase().includes('latent')
        );
        fs.writeFileSync('wan_nodes.json', JSON.stringify(targetNodes, null, 2));
        console.log("Found Nodes matching 'wan', 'video', 'latent':", targetNodes.length);
        
        if (data['WanVideoResolutionNode']) {
            console.log("WanVideoResolutionNode EXISTS!");
        } else {
            console.log("WanVideoResolutionNode is MISSING!");
        }
    } catch (e) {
        console.error("Error:", e);
    }
}
run();
