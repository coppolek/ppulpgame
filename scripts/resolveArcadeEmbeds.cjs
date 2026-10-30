const https = require('https');
const fs = require('fs');
const path = require('path');

const rawPath = path.join(__dirname, '../public/data/arcadeRawList.json');
const outPath = path.join(__dirname, '../public/data/arcadeCatalog.json');

const rawGames = JSON.parse(fs.readFileSync(rawPath, 'utf-8'));

// Check if there is already partial progress
let resolvedMap = new Map();
if (fs.existsSync(outPath)) {
  try {
    const existing = JSON.parse(fs.readFileSync(outPath, 'utf-8'));
    for (const g of existing) {
      if (g.iframeUrl && g.iframeUrl.includes('/embed/')) {
        resolvedMap.set(g.slug, g);
      }
    }
    console.log(`Loaded ${resolvedMap.size} already resolved arcade games.`);
  } catch (e) {
    console.log('No valid previous progress, starting fresh.');
  }
}

const agent = new https.Agent({ keepAlive: true, maxSockets: 40 });

function fetchGameEmbed(game) {
  return new Promise((resolve) => {
    // If numId is already known, we can construct the embed directly, but let's check
    if (resolvedMap.has(game.slug)) {
      return resolve(resolvedMap.get(game.slug));
    }

    const url = `https://www.retrogames.cc/arcade-games/${encodeURIComponent(game.slug)}.html`;
    const req = https.get(url, {
      agent,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let iframeUrl = '';
        const embedMatch = data.match(/embed\/([^\"'\s]+)/);
        if (embedMatch) {
          iframeUrl = `https://www.retrogames.cc/embed/${embedMatch[1]}`;
        } else if (game.numId) {
          iframeUrl = `https://www.retrogames.cc/embed/${game.numId}-${game.slug}.html`;
        } else {
          iframeUrl = `https://www.retrogames.cc/embed/${game.slug}.html`;
        }

        const idMatch = iframeUrl.match(/embed\/(\d+)-/);
        const numId = idMatch ? idMatch[1] : game.numId;

        const resolved = {
          numId: numId || game.slug,
          slug: game.slug,
          title: game.title,
          coverUrl: game.coverUrl,
          iframeUrl,
          likes: game.likes
        };
        resolve(resolved);
      });
    });

    req.on('error', () => {
      // Fallback if network drops
      const iframeUrl = game.numId 
        ? `https://www.retrogames.cc/embed/${game.numId}-${game.slug}.html`
        : `https://www.retrogames.cc/embed/${game.slug}.html`;
      resolve({
        numId: game.numId || game.slug,
        slug: game.slug,
        title: game.title,
        coverUrl: game.coverUrl,
        iframeUrl,
        likes: game.likes
      });
    });

    req.setTimeout(8000, () => {
      req.destroy();
      const iframeUrl = game.numId 
        ? `https://www.retrogames.cc/embed/${game.numId}-${game.slug}.html`
        : `https://www.retrogames.cc/embed/${game.slug}.html`;
      resolve({
        numId: game.numId || game.slug,
        slug: game.slug,
        title: game.title,
        coverUrl: game.coverUrl,
        iframeUrl,
        likes: game.likes
      });
    });
  });
}

async function resolveAll() {
  console.log(`Starting embed resolution for ${rawGames.length} arcade games...`);
  const finalGames = [];
  const batchSize = 40;

  for (let i = 0; i < rawGames.length; i += batchSize) {
    const chunk = rawGames.slice(i, i + batchSize);
    const results = await Promise.all(chunk.map(g => fetchGameEmbed(g)));
    
    for (const r of results) {
      finalGames.push(r);
      resolvedMap.set(r.slug, r);
    }

    if ((i + batchSize) % 200 === 0 || i + batchSize >= rawGames.length) {
      console.log(`Resolved ${finalGames.length}/${rawGames.length} arcade games (${((finalGames.length / rawGames.length) * 100).toFixed(1)}%)`);
      // Periodic save
      fs.writeFileSync(outPath, JSON.stringify(finalGames, null, 2), 'utf-8');
    }

    await new Promise(r => setTimeout(r, 60));
  }

  fs.writeFileSync(outPath, JSON.stringify(finalGames, null, 2), 'utf-8');
  console.log(`\nSUCCESS! Completed all ${finalGames.length} Arcade games with iframe embeds and covers.`);
}

resolveAll().catch(console.error);
