export interface RunPodPort {
  privatePort: number;
  publicPort: number;
  ip: string;
}

export interface RunPodRuntime {
  ports?: RunPodPort[];
}

export interface PodResponse {
  id: string;
  name: string;
  imageName: string;
  status: string;
  gpuName?: string;
  ip?: string;
  runtime?: RunPodRuntime;
}
