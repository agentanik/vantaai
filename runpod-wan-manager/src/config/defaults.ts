export const defaults = {
  priority: 'normal' as const,
  autoStop: true,
  upscale: false,
  retries: 0,
  maxRetries: 2,
  userCreditBase: 100, // default credits for mock user accounts
  
  // Job weights for billing estimations
  billingWeights: {
    baseVideoClip10s: 10,
    upscaleAddition: 5,
    highResolutionAddition: 5,
  },

  // Safe configurations lists
  resolutions: [
    { width: 832, height: 480 },
    { width: 1280, height: 704 },
    { width: 704, height: 1280 }
  ]
};
