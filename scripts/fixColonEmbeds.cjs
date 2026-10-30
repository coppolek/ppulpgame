const https = require('https');
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../public/data/arcadeCatalog.json');
const games = JSON.parse(fs.readFileSync(file, 'utf-8'));

const needsFix = games.filter(g => !/embed\/\d+-/.test(g.iframeUrl));
console.log(`Fixing ${needsFix.length} games that have colons or special chars in slug...`);

function fetchEmbed(g) {
  return new Promise((resolve) => {
    const url = `https://www.retrogames.cc/arcade-games/${g.slug}.html`;
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const m = data.match(/embed\/([^\"'\s]+)/);
        if (m) {
          g.iframeUrl = `https://www.retrogames.cc/embed/${m[1]}`;
          const idMatch = m[1].match(/^(\d+)-/);
          if (idMatch) g.numId = idMatch[1];
        }
        resolve();
      });
    }).on('error', () => resolve());
  });
}

async function fixAll() {
  for (let i = 0; i < needsFix.length; i += 10) {
    await Promise.all(needsFix.slice(i, i + 10).map(fetchEmbed));
    await new Promise(r => setTimeout(r, 100));
  }

  const remaining = games.filter(g => !/embed\/\d+-/.test(g.iframeUrl)).length;
  console.log(`After fix: remaining without numeric ID = ${remaining}`);

  fs.writeFileSync(file, JSON.stringify(games, null, 2), 'utf-8');
  console.log('Saved updated arcadeCatalog.json');
}

fixAll().catch(console.error);
