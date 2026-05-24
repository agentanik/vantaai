import { logger } from '../src/lib/logger';
import WebSocket from 'ws';

export async function runCommandInPod(podId: string, command: string, timeoutMs: number = 30000): Promise<string> {
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

  logger.info(`Creating terminal session on pod ${podId}...`);
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

  const createRes = await fetch(`${baseUrl}/api/terminals`, {
    method: 'POST',
    headers,
    body: JSON.stringify({})
  });

  if (!createRes.ok) {
    throw new Error(`Failed to create terminal: ${createRes.status} ${await createRes.text()}`);
  }

  const termInfo = await createRes.json() as { name: string };
  const termName = termInfo.name;
  logger.info(`Terminal created successfully: ${termName}`);

  const wsUrl = `wss://${host}/terminals/websocket/${termName}`;
  logger.info(`Connecting to WebSocket: ${wsUrl}`);

  // Create ws connection using the 'ws' library, passing Host, Origin, and Cookie headers
  const ws = new WebSocket(wsUrl, {
    headers: {
      'Cookie': cookieHeader,
      'Origin': baseUrl,
      'Host': host
    }
  });

  return new Promise<string>((resolve, reject) => {
    let output = '';
    let timeoutTimer: NodeJS.Timeout;

    const cleanUp = () => {
      clearTimeout(timeoutTimer);
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    };

    ws.on('open', () => {
      logger.info(`WebSocket connected. Sending command: "${command}"`);
      // Send the command input
      ws.send(JSON.stringify(['stdin', command + '\n']));
      
      // Wait for output to settle, or simple timeout for completion
      timeoutTimer = setTimeout(() => {
        logger.info(`Execution timeout reached (${timeoutMs}ms). Closing terminal.`);
        cleanUp();
        resolve(output);
      }, timeoutMs);
    });

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        if (Array.isArray(message)) {
          const [type, payload] = message;
          if (type === 'stdout') {
            output += payload;
            // Print chunk to local stdout for real-time tracking
            process.stdout.write(payload);
          }
        }
      } catch (err) {
        // Ignore parsing errors of non-JSON messages
      }
    });

    ws.on('error', (err) => {
      logger.error(`WebSocket error:`, err);
      cleanUp();
      reject(err);
    });

    ws.on('close', () => {
      logger.info(`WebSocket connection closed.`);
      cleanUp();
      resolve(output);
    });
  });
}

// Run if called directly
if (require.main === module) {
  const podId = process.env.RUNPOD_POD_ID || 'k8w9j2e2xvcdv6';
  const command = process.argv[2] || 'ls -la /workspace';
  
  runCommandInPod(podId, command, 60000)
    .then((out) => {
      console.log('\n--- EXECUTION COMPLETED ---');
    })
    .catch((err) => {
      console.error('Execution failed:', err);
    });
}
