export const safeJson = {
  parse<T>(jsonStr: string, fallback: T): T {
    try {
      return JSON.parse(jsonStr) as T;
    } catch {
      return fallback;
    }
  },

  stringify(data: any, fallback: string = '{}'): string {
    try {
      return JSON.stringify(data);
    } catch {
      return fallback;
    }
  }
};
