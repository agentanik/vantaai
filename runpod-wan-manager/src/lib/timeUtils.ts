export const timeUtils = {
  now(): string {
    return new Date().toISOString();
  },

  getDifferenceInSeconds(startIso: string, endIso: string): number {
    const start = new Date(startIso).getTime();
    const end = new Date(endIso).getTime();
    return Math.max(0, Math.round((end - start) / 1000));
  },

  isOlderThanDays(isoString: string, days: number): boolean {
    const date = new Date(isoString).getTime();
    const limit = Date.now() - (days * 24 * 60 * 60 * 1000);
    return date < limit;
  },

  isOlderThanHours(isoString: string, hours: number): boolean {
    const date = new Date(isoString).getTime();
    const limit = Date.now() - (hours * 60 * 60 * 1000);
    return date < limit;
  }
};
