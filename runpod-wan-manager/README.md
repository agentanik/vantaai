# RunPod Wan Video Generation Manager

This project facilitates programmatic power control over your RunPod GPU instances, security boundaries for client frontends, and automated ComfyUI video generation workflows using Wan2.2. It features a Node.js + Express + TypeScript backend with robust input validation, job queuing, logging, automatic file cleanups, and secure video proxy streaming.

---

## 🛠️ Architecture Overview

The system operates as an orchestration middleware between your public client website/frontend and the private RunPod/ComfyUI instances:

```
[ Frontend Client ] 
        │ (Submits prompts with x-manager-api-key)
        ▼
[ Local Node.js Manager Backend ] 
        │ (Performs Zod validation & updates memory store)
        ├─► [ RunPod API ] ──► Starts GPU Pod (RTX 4090)
        ├─► [ ComfyUI API ] ─► Polls status, patches template JSON, submits queue
        └─► [ Stream Proxy ] ◄─ Pipes output MP4 to browser without exposing pod IP
```

---

## ⚙️ Setup and Configuration

### 1. Adding Balance & Storage on RunPod
* **Fund Account**: Add balance manually via [RunPod Billing](https://www.runpod.io/console/billing).
* **Create Network Volume**: Provision a Network Volume in [RunPod Storage](https://www.runpod.io/console/storage) (size 100GB+ recommended). Note the volume ID to prevent model redownloads on subsequent pod runs.
* **API Key**: Retrieve your API key from [User Settings](https://www.runpod.io/console/user/settings).

### 2. Local Environment Setup
* Copy `.env.example` to `.env`:
  * **Windows CMD**:
    ```cmd
    copy .env.example .env
    ```
  * **PowerShell / Linux**:
    ```bash
    cp .env.example .env
    ```
* Fill out the required parameters in `.env`:
  * `RUNPOD_API_KEY`: Your private RunPod key.
  * `RUNPOD_POD_ID`: Your default target GPU pod instance.
  * `MANAGER_API_KEY`: Secret string used to authorize your frontend website calls to this manager backend.
  * `RUNPOD_NETWORK_VOLUME_ID`: Storage volume to attach to `/workspace`.

### 3. Local Installation & Launch
* Install dependencies:
  ```bash
  npm install
  ```
* Compile and check types:
  ```bash
  npm run typecheck
  ```
* Start the server in development mode:
  ```bash
  npm run dev
  ```
  The server starts on port `3001` by default.

---

## 🤖 RunPod Container Setup & Scripts

The project contains a set of shell scripts under `scripts/` to automate the provisioning and setup of the remote GPU container environment:

*   **`setup_pod_base.sh`**: Installs OS package dependencies (Git LFS, FFmpeg, curl, etc.).
*   **`install_comfyui.sh`**: Clones ComfyUI, creates a virtual environment, and installs custom nodes (`ComfyUI-WanVideoWrapper`).
*   **`install_all_wan_models.sh`**: A comprehensive downloader that lets you selectively fetch Wan 2.1 and Wan 2.2 model files from official repackaged repositories.

### Selective Model Downloader Usage
Since downloading all models exceeds **100 GB**, you should specify which models you need:
```bash
# Download only Wan 2.2 5B Text/Image-to-Video (FP16)
bash scripts/install_all_wan_models.sh --wan22-ti2v-5b

# Download Wan 2.2 14B Text-to-Video models (FP8 Scaled)
bash scripts/install_all_wan_models.sh --wan22-t2v-14b

# Download Wan 2.1 14B Image-to-Video models (BF16)
bash scripts/install_all_wan_models.sh --wan21-i2v-720p

# Download all available Wan 2.1 and 2.2 models
bash scripts/install_all_wan_models.sh --all
```

---

## 🔒 Security Design

* **API Keys Shielded**: Neither your RunPod API Key nor your Hugging Face Token are ever exposed to the client browser. They are kept securely on your backend.
* **Credential Validation**: All protected endpoints under `/api/*` require the header:
  `x-manager-api-key: <your_secret_manager_api_key_here>`
* **Abuse Protection**: Global rate limiting restricts requests to a maximum of 30 calls per minute per IP address.
* **Proxy Streaming**: Video outputs generated on ComfyUI are fetched via a backend piping stream at `/api/output/view/:filename`. The frontend never learns the private sub-domain URL of the active GPU container.

---

## 🔑 Manager API Key Management

The RunPod Wan Manager features a secure, multi-tenant API Key Management system. While the initial setup leverages a bootstrap `MANAGER_API_KEY` defined in your `.env` file, subsequent service credentials can be managed programmatically.

### Security Principles:
* **Hashed Storage**: Raw generated keys are displayed exactly **once** upon creation or rotation. Only SHA-256 hashes of the keys are stored in the database (`data/api-keys.json`).
* **Timing-Safe Verification**: Key lookup matches prefixes and compares hashes using `crypto.timingSafeEqual` to eliminate side-channel attacks.
* **Granular Scopes (RBAC)**: Keys can be scoped to specific permissions:
  * `admin:*` - Absolute administrative access (required to manage other API keys)
  * `pod:read` / `pod:write` - GPU compute instance orchestration
  * `jobs:read` / `jobs:write` - Requesting, tracking, and canceling generation tasks
  * `models:read` / `models:write` - Managing registered AI model weights
  * `billing:read` - Fetching ledger balances, cost estimates, and budget stats
  * `keys:read` / `keys:write` - Reading and writing API keys
* **Brute-Force Shield**: Authentication middleware tracks failed keys and temporarily bans offensive IP addresses.

---

## 🚀 Endpoints & API Reference

### API Key Management
* **`POST /api/v1/keys`** (Scope: `keys:write` / `admin:*`)
  * Generates a new cryptographically secure API key. Returns the raw key once.
  * Request Body:
    ```json
    {
      "name": "Integration Key",
      "scopes": ["jobs:write", "jobs:read"],
      "expiresAt": "2026-12-31T23:59:59.000Z",
      "ownerUserId": "user_123"
    }
    ```
* **`GET /api/v1/keys`** (Scope: `keys:read` / `admin:*`)
  * Lists metadata for all registered API keys. Secrets and hashes are hidden.
* **`GET /api/v1/keys/:id`** (Scope: `keys:read` / `admin:*`)
  * Retrieves metadata details for a specific key.
* **`DELETE /api/v1/keys/:id`** (Scope: `keys:write` / `admin:*`)
  * Revokes an API key, preventing future access.
  * Request Body: `{ "reason": "Key compromise rotation" }`
* **`POST /api/v1/keys/:id/rotate`** (Scope: `keys:write` / `admin:*`)
  * Revokes the current key and provisions a fresh one with identical properties, returning the new raw key once.

### Health & System Status
* **`GET /health`**
  * Check backend health, environment readiness status, and GPU definitions.

### Pod Control
* **`POST /api/pod/create`**
  * Spawns a new RunPod GPU instance utilizing the configured network volume.
* **`POST /api/pod/start`**
  * Boots or resumes the target pod.
* **`POST /api/pod/stop`**
  * Shuts down the pod (saves GPU runtime billing costs).
* **`GET /api/pod/status`**
  * Retrieves live system logs, status fields, and connection parameters.

### Video Generation & Queue Management
* **`POST /api/video/generate`**
  * Initiates the automated pipeline.
  * Request Body Parameters:
    ```json
    {
      "prompt": "Vibrant cinematic sequence of a futuristic cyborg running in rain...",
      "negativePrompt": "blurry, low quality, static",
      "width": 1280,
      "height": 704,
      "durationSeconds": 10,
      "seed": -1,
      "autoStop": true,
      "upscale": false
    }
    ```
* **`GET /api/video/status/:jobId`**
  * Retrieves the status of a specific job (e.g. `queued`, `starting_pod`, `generating`, `completed`, `failed`).
* **`GET /api/video/jobs`**
  * List all active and historically queued jobs in memory.
* **`POST /api/video/cancel/:jobId`**
  * Aborts a pending or active job and interrupts ComfyUI execution queue.

### Video Delivery Proxy
* **`GET /api/output/view/:filename`**
  * Securely streams output MP4/GIF file from the ComfyUI volume back to the authorized client.

---

## 🧼 Cron Jobs & Logging
* **Log Rotation**: Logs are saved in `logs/app.log` (rotating daily) and `logs/error.log` for fatal exceptions.
* **File Cleanup**: A daily background cron task scans the local output directory and purges cached assets older than the configured threshold (default `7` days) to free volume disk space.
