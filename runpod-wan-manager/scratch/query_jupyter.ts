import { logger } from '../src/lib/logger';

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

  logger.info("Fetching contents of ../start.sh...");
  const contentRes = await fetch(`${baseUrl}/api/contents/..%2Fstart.sh?content=1`, {
    headers
  });

  if (contentRes.ok) {
    const data = await contentRes.json();
    console.log("Contents:", JSON.stringify(data, null, 2));
  } else {
    logger.error(`Failed to fetch contents: ${contentRes.status} ${await contentRes.text()}`);
  }
}

main().catch(console.error);
