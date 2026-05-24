export interface ComfySystemStats {
  system: {
    os: string;
    python_version: string;
    embedded_python: boolean;
  };
  devices: Array<{
    name: string;
    type: string;
    index: number;
    vram_total: number;
    vram_free: number;
    torch_vram_total: number;
    torch_vram_free: number;
  }>;
}

export interface ComfyPromptResponse {
  prompt_id: string;
  number: number;
  node_errors?: Record<string, any>;
}

export interface ComfyQueueResponse {
  queue_running: any[];
  queue_pending: any[];
}

export interface ComfyHistoryOutput {
  gifs?: Array<{
    filename: string;
    subfolder: string;
    type: string;
  }>;
  images?: Array<{
    filename: string;
    subfolder: string;
    type: string;
  }>;
  videos?: Array<{
    filename: string;
    subfolder: string;
    type: string;
  }>;
}

export interface ComfyHistoryItem {
  prompt: [number, string, Record<string, any>, Record<string, any>, string[]];
  outputs: Record<string, ComfyHistoryOutput>;
  status: {
    status_str: string;
    completed: boolean;
    messages: any[];
  };
}

export type ComfyHistoryResponse = Record<string, ComfyHistoryItem>;
