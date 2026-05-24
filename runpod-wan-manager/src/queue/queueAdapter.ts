import { GenerationJob } from '../types/jobs';

export interface QueueAdapter {
  enqueue(job: GenerationJob): Promise<void>;
  getNextJob(): Promise<GenerationJob | null>;
  cancel(jobId: string): Promise<void>;
  getQueueSize(): Promise<number>;
  listPending(): Promise<GenerationJob[]>;
}
