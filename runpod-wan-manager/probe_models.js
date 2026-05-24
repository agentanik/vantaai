async function run() {
    try {
        const res = await fetch('https://k8w9j2e2xvcdv6-8188.proxy.runpod.net/object_info');
        const data = await res.json();
        
        // Find UNETLoader or similar model loader
        const unetLoader = data['UNETLoader'];
        if (unetLoader && unetLoader.input && unetLoader.input.required && unetLoader.input.required.unet_name) {
            console.log("Diffusion Models Available:", unetLoader.input.required.unet_name[0]);
        } else {
            console.log("UNETLoader not found or format unexpected.");
        }

        const vaeLoader = data['VAELoader'];
        if (vaeLoader && vaeLoader.input && vaeLoader.input.required && vaeLoader.input.required.vae_name) {
            console.log("VAE Models Available:", vaeLoader.input.required.vae_name[0]);
        }

    } catch (e) {
        console.error("Error:", e);
    }
}
run();
