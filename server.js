import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const DIST_DIR = path.join(__dirname, 'dist');
const INDEX_HTML = path.join(DIST_DIR, 'index.html');

// Disable x-powered-by header
app.disable('x-powered-by');

// Auto-build fallback: If Hostinger deployed without running `npm run build`,
// build the client assets automatically so the server doesn't fail!
if (!fs.existsSync(INDEX_HTML)) {
  try {
    console.log('[Puulp] Cartella dist non trovata. Esecuzione automatica build...');
    execSync('npm run build', { stdio: 'inherit', cwd: __dirname });
    console.log('[Puulp] Build completata con successo!');
  } catch (err) {
    console.error('[Puulp] Attenzione: compilazione automatica non riuscita:', err.message);
  }
}

// Healthcheck endpoint for VPS & Hostinger monitoring
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    app: 'Puulp Web Platform',
    domain: 'puulp.it',
    distReady: fs.existsSync(INDEX_HTML),
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Cache control headers for static assets
app.use((req, res, next) => {
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
    res.sendFile(INDEX_HTML);
  });
} else {
  // If dist is still not ready
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
          <p>Esegui sul terminale Hostinger:</p>
          <code>npm run build</code>
        </div>
      </body>
      </html>
    `);
  });
}

// Hostinger & Passenger port compatibility
// Hostinger Phusion Passenger passes either a port number OR a unix socket path (e.g. /tmp/passenger.xxx/socket)
const RAW_PORT = process.env.PORT || 3000;
const isUnixSocket = typeof RAW_PORT === 'string' && (isNaN(Number(RAW_PORT)) || RAW_PORT.startsWith('/') || RAW_PORT.startsWith('\\\\'));

if (isUnixSocket) {
  // Listen on Hostinger Passenger unix socket (do NOT pass host string here!)
  app.listen(RAW_PORT, () => {
    console.log(`[Puulp] Server avviato su socket Hostinger: ${RAW_PORT}`);
  });
} else {
  // Listen on standard TCP port with automatic fallback if port is in use
  const initialPort = Number(RAW_PORT) || 3000;
  const HOST = process.env.HOST || '0.0.0.0';

  function startServer(targetPort) {
    const serverInstance = app.listen(targetPort, HOST, () => {
      console.log(`[Puulp] Server di produzione avviato con successo su http://${HOST}:${targetPort}`);
      console.log(`[Puulp] Configurato per puulp.it - Serving: ${DIST_DIR}`);
    });

    serverInstance.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.warn(`[Puulp] ATTENZIONE: La porta ${targetPort} è già occupata da un altro processo.`);
        // Try next port up to 3010 or 8080
        if (targetPort < 3010) {
          const nextPort = targetPort + 1;
          console.log(`[Puulp] Tentativo automatico sulla porta successiva: ${nextPort}...`);
          startServer(nextPort);
        } else {
          console.error(`[Puulp] Tutte le porte fino a ${targetPort} sono occupate.`);
          console.error(`[Puulp] Libera la porta 3000 con il comando: fuser -k 3000/tcp oppure usa: PORT=8080 npm start`);
          process.exit(1);
        }
      } else {
        console.error('[Puulp] Errore del server:', err);
        process.exit(1);
      }
    });
  }

  startServer(initialPort);
}
