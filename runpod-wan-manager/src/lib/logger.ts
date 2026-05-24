import fs from 'fs';
import path from 'path';
import { redactSecrets } from '../security/redactSecrets';

const LOG_DIR = path.join(process.cwd(), 'logs');
const LOG_FILE = path.join(LOG_DIR, 'app.log');

if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

function writeLog(level: LogLevel, message: string, meta?: any) {
  const timestamp = new Date().toISOString();
  
  // Apply deep redaction to both message and meta
  const safeMsg = redactSecrets(message) as string;
  const safeMeta = meta ? redactSecrets(meta) : '';
  const metaStr = safeMeta ? (typeof safeMeta === 'string' ? safeMeta : JSON.stringify(safeMeta)) : '';
  
  const logLine = `[${timestamp}] [${level.toUpperCase()}] ${safeMsg} ${metaStr}\n`;
  
  const colorReset = '\x1b[0m';
  let color = colorReset;
  
  switch (level) {
    case 'info': color = '\x1b[36m'; break;
    case 'warn': color = '\x1b[33m'; break;
    case 'error': color = '\x1b[31m'; break;
    case 'debug': color = '\x1b[90m'; break;
  }
  
  // Only log method, path, durationMs, statusCode, requestId if it's an express request meta object to prevent raw headers
  let logMeta = safeMeta;
  if (meta && typeof meta === 'object' && meta.headers) {
     logMeta = {
       method: meta.method,
       path: meta.path || meta.url,
       requestId: meta.requestId,
       userId: meta.userId,
       statusCode: meta.statusCode,
       durationMs: meta.durationMs
     };
  }
  
  console.log(`${color}[${timestamp}] [${level.toUpperCase()}]${colorReset} ${safeMsg}`, logMeta ? logMeta : '');
  
  // Write to log file
  try {
    fs.appendFileSync(LOG_FILE, logLine, 'utf8');
  } catch (err) {
    console.error('Failed to write to log file:', err);
  }
}

export const logger = {
  info: (message: string, meta?: any) => writeLog('info', message, meta),
  warn: (message: string, meta?: any) => writeLog('warn', message, meta),
  error: (message: string, meta?: any) => writeLog('error', message, meta),
  debug: (message: string, meta?: any) => writeLog('debug', message, meta)
};
