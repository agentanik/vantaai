import { logger } from '../src/lib/logger';
import fs from 'fs';
import path from 'path';

async function main() {
  const podId = 'k8w9j2e2xvcdv6';
  const baseUrl = `https://${podId}-8888.proxy.runpod.net`;
  const host = `${podId}-8888.proxy.runpod.net`;
  
  logger.info(`Performing XSRF handshake with Jupyter Lab at ${baseUrl}...`);
  const getRes = await fetch(`${baseUrl}/lab`);
  const setCookies = getRes.headers.getSetCookie ? getRes.headers.getSetCookie() : [];
  
  let xsrfToken = '';
  const cookiesList: string[] = [];
  
  for (const cookieStr of setCookies) {
    const parts = cookieStr.split(';');
    const cookieKv = parts[0];
    cookiesList.push(cookieKv);
    if (cookieKv.startsWith('_xsrf=')) {
      xsrfToken = cookieKv.substring(6);
    }
  }

  const cookieHeader = cookiesList.join('; ');
  logger.info(`Handshake completed. _xsrfToken: "${xsrfToken}". CookieHeader: "${cookieHeader}"`);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Host': host,
    'Origin': baseUrl,
    'Referer': `${baseUrl}/lab`
  };
  if (cookieHeader) {
    headers['Cookie'] = cookieHeader;
  }
  if (xsrfToken) {
    headers['X-XSRFToken'] = xsrfToken;
  }

  // Create scripts directory in the pod first
  logger.info("Creating directory runpod-slim/scripts in the pod...");
  const createDirRes = await fetch(`${baseUrl}/api/contents/runpod-slim/scripts`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      type: 'directory'
    })
  });

  if (createDirRes.ok) {
    logger.info("Successfully created/verified runpod-slim/scripts directory.");
  } else {
    logger.warn(`Directory creation warning: ${createDirRes.status} ${await createDirRes.text()}`);
  }

  // Local scripts folder path
  const localScriptsDir = path.join(__dirname, '..', 'scripts');
  const files = fs.readdirSync(localScriptsDir);

  for (const file of files) {
    if (!file.endsWith('.sh')) continue;
    
    const localFilePath = path.join(localScriptsDir, file);
    const content = fs.readFileSync(localFilePath, 'utf8');
    const remotePath = `runpod-slim/scripts/${file}`;

    logger.info(`Uploading script: ${file} to ${remotePath}...`);
    const uploadRes = await fetch(`${baseUrl}/api/contents/${remotePath}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        type: 'file',
        format: 'text',
        content: content
      })
    });

    if (uploadRes.ok) {
      logger.info(`✅ Successfully uploaded ${file}`);
    } else {
      logger.error(`❌ Failed to upload ${file}: ${uploadRes.status} ${await uploadRes.text()}`);
    }
  }
}

main().catch(console.error);
