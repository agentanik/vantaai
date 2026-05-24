export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const waitUtils = {
  sleep(ms: number): Promise<void> {
    return sleep(ms);
  },

  async poll<T>(
    fn: () => Promise<T>,
    validate: (result: T) => boolean,
    intervalMs: number,
    timeoutMs: number,
    onPoll?: (currentResult: T) => void
  ): Promise<T> {
    const startTime = Date.now();
    
    while (true) {
      const result = await fn();
      if (validate(result)) {
        return result;
      }
      
      if (onPoll) {
        onPoll(result);
      }
      
      if (Date.now() - startTime > timeoutMs) {
        throw new Error('Polling timeout exceeded');
      }
      
      await this.sleep(intervalMs);
    }
  }
};
