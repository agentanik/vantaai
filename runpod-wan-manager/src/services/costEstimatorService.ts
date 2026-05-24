import { AIModel } from '../types/models';
import { CostEstimate } from '../types/costs';
import { gpuSelectorService } from './gpuSelectorService';
import { creditService } from './creditService';

class CostEstimatorService {
  public estimateJobCost(
    model: AIModel,
    width: number,
    height: number,
    durationSeconds: number,
    upscale: boolean
  ): CostEstimate {
    const selection = gpuSelectorService.selectGpuForModel(model);
    
    // Calculate estimated execution duration in minutes
    const averageRuntimeSeconds = model.averageRuntimeSeconds;
    const estimatedRuntimeMinutes = averageRuntimeSeconds / 60;
    
    // GPU cost hourly rate parsed from selected GPU profile
    const gpuHourlyCost = selection.estimatedHourlyCost;
    const estimatedGpuCostUsd = (gpuHourlyCost / 60) * estimatedRuntimeMinutes;
    
    // Standard mock storage allocation charge ($0.05 per standard video asset)
    const estimatedStorageCostUsd = 0.05;
    const estimatedTotalCostUsd = estimatedGpuCostUsd + estimatedStorageCostUsd;
    
    // Credits estimation
    const estimatedCredits = creditService.calculateCreditsForJob(
      width,
      height,
      durationSeconds,
      upscale
    );

    return {
      estimatedRuntimeMinutes: Math.round(estimatedRuntimeMinutes * 10) / 10,
      estimatedGpuCostUsd: Math.round(estimatedGpuCostUsd * 1000) / 1000,
      estimatedStorageCostUsd,
      estimatedTotalCostUsd: Math.round(estimatedTotalCostUsd * 1000) / 1000,
      estimatedCredits,
      assumptions: [
        `Target GPU: ${selection.recommendedGpu} at $${gpuHourlyCost.toFixed(2)}/hr`,
        `Average model execution runtime: ${averageRuntimeSeconds} seconds`,
        `Static asset storage holding fee: $${estimatedStorageCostUsd.toFixed(2)}`
      ]
    };
  }
}

export const costEstimatorService = new CostEstimatorService();
export { CostEstimate };
