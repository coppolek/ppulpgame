#!/usr/bin/env bash
# ==============================================================================
# Script di deploy automatico per Puulp (puulp.it) su VPS Linux
# Utilizzo: bash deploy.sh
# ==============================================================================

set -e

echo "🚀 [Puulp] Inizio deploy su puulp.it..."

# 1. Recupera ultimi aggiornamenti dal repository git (se presente)
if [ -d ".git" ]; then
  echo "📥 Aggiornamento repository..."
  git pull origin main || git pull
fi

# 2. Installazione dipendenze pulita
echo "📦 Installazione dipendenze npm..."
npm install

# 3. Compilazione del bundle ottimizzato Vite
echo "⚙️ Compilazione build di produzione (Vite)..."
npm run build

# 4. Riavvio o avvio del processo PM2 (se installato)
if command -v pm2 &> /dev/null; then
  echo "🔄 Riavvio servizio con PM2..."
  pm2 reload ecosystem.config.cjs || pm2 start ecosystem.config.cjs
  pm2 save
  echo "✅ Servizio PM2 riavviato con successo!"
else
  echo "ℹ️ PM2 non rilevato. Puoi avviare l'app con: npm start"
fi

# 5. Ricarica Nginx se in esecuzione
if systemctl is-active --quiet nginx; then
  echo "🌐 Ricarica Nginx..."
  sudo nginx -t && sudo systemctl reload nginx
  echo "✅ Nginx ricaricato!"
fi

echo "✨ Deploy completato con successo per https://puulp.it!"
