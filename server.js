import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const DIST_DIR = path.join(__dirname, 'dist');

// Disable x-powered-by header
app.disable('x-powered-by');

// Healthcheck endpoint for VPS monitoring (e.g. Uptime Kuma, Nginx healthcheck)
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    app: 'Puulp Web Platform',
    domain: 'puulp.it',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Cache control headers for static assets
app.use((req, res, next) => {
  // Allow iframes embedding
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  if (req.url.match(/\.(js|css|png|jpg|jpeg|gif|webp|svg|woff2?|ttf|eot)$/)) {
    // 1 year cache for static assets with hash
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  } else if (req.url.match(/\.(json|html)$/)) {
    // Short cache for html and catalog json files
    res.setHeader('Cache-Control', 'public, max-age=3600, must-revalidate');
  }
  next();
});

// Serve static files from dist
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR, {
    index: 'index.html',
    etag: true,
  }));

  // Fallback to index.html for SPA client-side routing
  app.get('*', (_req, res) => {
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
} else {
  // If dist is not yet built
  app.get('*', (_req, res) => {
    res.status(503).send(`
      <!DOCTYPE html>
      <html lang="it">
      <head>
        <meta charset="utf-8" />
        <title>Puulp - Build in corso</title>
        <style>
          body { font-family: sans-serif; background: #020617; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
          .card { background: #0f172a; padding: 2rem; border-radius: 1rem; border: 1px solid #1e293b; max-width: 500px; }
          h1 { color: #f43f5e; }
          code { background: #020617; padding: 0.2rem 0.4rem; border-radius: 4px; color: #38bdf8; font-family: monospace; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>Puulp (puulp.it)</h1>
          <p>La build di produzione non è ancora presente.</p>
          <p>Esegui sulla tua VPS:</p>
          <code>npm run build</code>
        </div>
      </body>
      </html>
    `);
  });
}

app.listen(PORT, HOST, () => {
  console.log(`[Puulp] Server di produzione avviato su http://${HOST}:${PORT}`);
  console.log(`[Puulp] Configurato per puulp.it - Serving: ${DIST_DIR}`);
});
