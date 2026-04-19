import type { NextApiRequest, NextApiResponse } from 'next';
import type { IncomingMessage } from 'http';
import httpProxy from 'http-proxy';

const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:3200';
const PROXY_TIMEOUT_MS = Number(process.env.FRONTEND_PROXY_TIMEOUT_MS || 15000);

// Disable Next.js body parsing so the proxy can forward the raw body
export const config = { api: { bodyParser: false } };

const proxy = httpProxy.createProxyServer({
  target: BACKEND_URL,
  changeOrigin: true,
  selfHandleResponse: false,
  cookieDomainRewrite: '',
  proxyTimeout: PROXY_TIMEOUT_MS,
  timeout: PROXY_TIMEOUT_MS,
});

// Suppress proxy error noise in dev
proxy.on('error', (err, _req, res) => {
  console.error('[api-proxy] proxy error:', err.message);
  if (res && 'writeHead' in res) {
    (res as any).writeHead(502, { 'Content-Type': 'application/json' });
    (res as any).end(JSON.stringify({ error: 'Backend unavailable' }));
  }
});

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  return new Promise<void>((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      res.off('finish', finish);
      res.off('close', finish);
      resolve();
    };

    // Ensure Next handler promise always settles after proxied response ends.
    res.on('finish', finish);
    res.on('close', finish);

    proxy.web(req as unknown as IncomingMessage, res as any, undefined, (err) => {
      if (err && !res.headersSent && !(res as any).writableEnded) {
        res.status(502).json({ error: 'Backend unavailable' });
      }
      finish();
    });
  });
}
