export const getApiBaseUrl = () => {
  return import.meta.env.VITE_VANTA_API_BASE_URL || "http://localhost:3001";
};

export const getManagerKeyForLocalTest = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("MANAGER_API_KEY") || import.meta.env.VITE_MANAGER_API_KEY || "";
  }
  return import.meta.env.VITE_MANAGER_API_KEY || "";
};

const getDefaultHeaders = () => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const key = getManagerKeyForLocalTest();
  if (key) {
    headers["x-manager-api-key"] = key;
  }
  return headers;
};

export const healthCheck = async () => {
  const res = await fetch(`${getApiBaseUrl()}/health`);
  if (!res.ok) throw new Error("Backend health check failed");
  return res.json();
};

export const runpodHealth = async () => {
  const res = await fetch(`${getApiBaseUrl()}/health/runpod`, {
    headers: getDefaultHeaders(),
  });
  if (!res.ok) throw new Error("RunPod health check failed");
  return res.json();
};

export const validateWorkflow = async (modelId: string) => {
  const res = await fetch(`${getApiBaseUrl()}/api/v1/workflows/validate`, {
    method: "POST",
    headers: getDefaultHeaders(),
    body: JSON.stringify({ modelId }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || "Workflow validation failed");
  }
  return res.json();
};

export interface GenerateVideoPayload {
  userId?: string;
  modelId?: string;
  prompt: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  durationSeconds?: number;
  fps?: number;
  seed?: number;
  priority?: string;
  autoStop?: boolean;
  upscale?: boolean;
}

export const generateVideo = async (payload: GenerateVideoPayload) => {
  const res = await fetch(`${getApiBaseUrl()}/api/v1/video/generate`, {
    method: "POST",
    headers: getDefaultHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || "Video generation failed");
  }
  return res.json(); // should return { success: true, data: { jobId: ... } }
};

export const getJobStatus = async (jobId: string) => {
  const res = await fetch(`${getApiBaseUrl()}/api/v1/video/status/${jobId}`, {
    headers: getDefaultHeaders(),
  });
  if (!res.ok) throw new Error("Failed to get job status");
  return res.json(); // should return { data: { status, outputUrl, ... } }
};

export const fetchOutputVideo = async (filename: string): Promise<string> => {
  const res = await fetch(`${getApiBaseUrl()}/api/v1/outputs/${filename}`, {
    headers: getDefaultHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch output video");
  
  const blob = await res.blob();
  return URL.createObjectURL(blob);
};
