const https = require('https');
const fs = require('fs');
const path = require('path');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      }
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchUrl(res.headers.location).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error(`Timeout fetching ${url}`));
    });
  });
}

function parseArcadeGamesFromPage(html, pageNum) {
  const games = [];
  const blockRegex = /class="post-thumb\s+arcade-thumb"[\s\S]*?<\/div>\s*<div class="post-des">[\s\S]*?<\/div>/gi;
  let blockMatch;
  while ((blockMatch = blockRegex.exec(html)) !== null) {
    const block = blockMatch[0];
    const posterMatch = block.match(/data-poster="([^"]+)"/) || block.match(/data-src="([^"]+)"/) || block.match(/src="([^"]+)"/);
    const poster = posterMatch ? posterMatch[1] : '';
    const linkMatch = block.match(/href="https:\/\/www\.retrogames\.cc\/arcade-games\/([^.]+)\.html"/);
    const rawSlug = linkMatch ? linkMatch[1] : '';
    if (!rawSlug || rawSlug.includes('/index')) continue;

    const titleMatch = block.match(/<h6><a[^>]*>([\s\S]*?)<\/a><\/h6>/) || block.match(/alt="([^"]+)"/);
    let title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : '';
    title = title.replace(/&amp;/g, '&').replace(/&#039;/g, "'").replace(/&quot;/g, '"');

    let numId = null;
    const idMatch = poster.match(/\/(\d+)(?:_[a-f0-9]+)?\.(?:jpg|png)/i);
    if (idMatch) {
      numId = idMatch[1];
    } else {
      const anyNum = block.match(/screenshot\/\d+(?:\/\d+){0,3}\/(\d+)/);
      if (anyNum) numId = anyNum[1];
    }

    const likesMatch = block.match(/fa-thumbs-o-up"><\/i>\s*([\d,]+)/);
    const likes = likesMatch ? parseInt(likesMatch[1].replace(/,/g, ''), 10) : 50;

    const fullPoster = poster.startsWith('//') ? `https:${poster}` : poster;

    games.push({
      numId: numId || null,
      slug: rawSlug,
      title,
      coverUrl: fullPoster,
      likes,
      page: pageNum
    });
  }
  return games;
}

async function scrapeAll() {
  const totalPages = 101;
  const allGames = [];
  const seenSlugs = new Set();
  const batchSize = 10;

  console.log(`Scraping all ${totalPages} Arcade pages from RetroGames.cc in batches of ${batchSize}...`);

  for (let i = 1; i <= totalPages; i += batchSize) {
    const batch = [];
    for (let p = i; p < i + batchSize && p <= totalPages; p++) {
      const url = p === 1 ? 'https://www.retrogames.cc/arcade-games' : `https://www.retrogames.cc/arcade-games/page/${p}.html`;
      batch.push(
        fetchUrl(url)
          .then(html => ({ page: p, games: parseArcadeGamesFromPage(html, p) }))
          .catch(err => {
            console.error(`Page ${p} failed:`, err.message);
            return { page: p, games: [] };
          })
      );
    }

    const results = await Promise.all(batch);
    for (const res of results) {
      for (const g of res.games) {
        if (!seenSlugs.has(g.slug)) {
          seenSlugs.add(g.slug);
          allGames.push(g);
        }
      }
    }
    console.log(`Processed up to page ${Math.min(i + batchSize - 1, totalPages)}/${totalPages} - Total games collected: ${allGames.length}`);
    await new Promise(r => setTimeout(r, 150));
  }

  const withNumId = allGames.filter(g => g.numId !== null).length;
  console.log(`\nALL DONE! Total Arcade games: ${allGames.length}`);
  console.log(`With numeric ID in poster: ${withNumId} / ${allGames.length} (${((withNumId / allGames.length) * 100).toFixed(1)}%)`);
  console.log(`Without numeric ID: ${allGames.length - withNumId}`);

  const outDir = path.join(__dirname, '..', 'public', 'data');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  fs.writeFileSync(path.join(outDir, 'arcadeRawList.json'), JSON.stringify(allGames, null, 2), 'utf-8');
  console.log(`Saved raw list to ${path.join(outDir, 'arcadeRawList.json')}`);
}

scrapeAll().catch(console.error);
