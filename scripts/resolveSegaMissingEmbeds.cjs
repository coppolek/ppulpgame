const https = require('https');
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../public/data/segaCatalog.json');
const allGames = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

const missing = allGames.filter(g => !g.numId || !g.coverUrl);
console.log(`Need to resolve ${missing.length} Sega games...`);

const agent = new https.Agent({ keepAlive: true, maxSockets: 40 });

function resolveGame(game) {
  return new Promise((resolve) => {
    const url = `https://www.retrogames.cc/${game.category}/${game.slug}.html`;
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
        const embedMatch = data.match(/embed\/([^\"'\s]+)/);
        const idMatch = data.match(/var\s+game_id\s*=\s*(\d+)/i) || (embedMatch ? embedMatch[1].match(/^(\d+)-/) : null);
        const numId = idMatch ? (idMatch[1] || idMatch[0]) : null;

        if (embedMatch) {
          game.iframeUrl = `https://www.retrogames.cc/embed/${embedMatch[1]}`;
        } else if (numId) {
          game.iframeUrl = `https://www.retrogames.cc/embed/${numId}-${game.slug}.html`;
        }

        if (numId) game.numId = numId;

        // Check if there is an og:image or screenshot in detail page
        const imgMatch = data.match(/property="og:image"\s+content="([^"]+)"/) ||
                         data.match(/class="game-screenshot"[^>]*src="([^"]+)"/) ||
                         data.match(/data-poster="([^"]+)"/);
        if (imgMatch && imgMatch[1] && !imgMatch[1].includes('logo') && !imgMatch[1].includes('default')) {
          game.coverUrl = imgMatch[1].startsWith('//') ? `https:${imgMatch[1]}` : imgMatch[1];
        }

        resolve();
      });
    });
    req.on('error', () => resolve());
    req.setTimeout(10000, () => {
      req.destroy();
      resolve();
    });
  });
}

async function run() {
  const CONCURRENCY = 30;
  let index = 0;
  let done = 0;

  async function worker() {
    while (index < missing.length) {
      const g = missing[index++];
      await resolveGame(g);
      done++;
      if (done % 50 === 0 || done === missing.length) {
        console.log(`Resolved ${done}/${missing.length}...`);
      }
    }
  }

  const workers = Array.from({ length: CONCURRENCY }, () => worker());
  await Promise.all(workers);

  const stillMissing = allGames.filter(g => !g.numId || !g.coverUrl);
  console.log(`Remaining without numId or cover: ${stillMissing.length}`);

  fs.writeFileSync(filePath, JSON.stringify(allGames, null, 2), 'utf-8');
  console.log('Finished resolving missing embeds and updated segaCatalog.json');
}

run();
