import fs from 'fs';
import path from 'path';

export const fileUtils = {
  ensureDir(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  },

  readJson<T>(filePath: string, fallback: T): T {
    try {
      if (!fs.existsSync(filePath)) {
        this.writeJson(filePath, fallback);
        return fallback;
      }
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data) as T;
    } catch {
      return fallback;
    }
  },

  writeJson<T>(filePath: string, data: T): void {
    const dir = path.dirname(filePath);
    this.ensureDir(dir);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  },

  exists(filePath: string): boolean {
    return fs.existsSync(filePath);
  },

  getFileStats(filePath: string): fs.Stats | null {
    try {
      if (fs.existsSync(filePath)) {
        return fs.statSync(filePath);
      }
      return null;
    } catch {
      return null;
    }
  }
};

export function readJsonFile<T>(filePath: string): T {
  const data = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(data) as T;
}

export function writeJsonFile<T>(filePath: string, data: T): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

export function getWorkflowPath(filename: string): string {
  return path.join(process.cwd(), 'workflows', filename);
}
