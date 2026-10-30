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
    req.setTimeout(20000, () => {
      req.destroy();
      reject(new Error(`Timeout fetching ${url}`));
    });
  });
}

function parseGamesFromPage(html) {
  const games = [];
  const blockRegex = /class="post-thumb\s+psx-thumb"[\s\S]*?<\/div>\s*<div class="post-des">[\s\S]*?<\/div>/gi;
  let blockMatch;
  while ((blockMatch = blockRegex.exec(html)) !== null) {
    const block = blockMatch[0];
    const posterMatch = block.match(/data-poster="([^"]+)"/) || block.match(/data-src="([^"]+)"/);
    const poster = posterMatch ? posterMatch[1] : '';
    const linkMatch = block.match(/href="https:\/\/www\.retrogames\.cc\/psx-games\/([^.]+)\.html"/);
    const slug = linkMatch ? linkMatch[1] : '';
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

    if (slug && title) {
      const fullPoster = poster.startsWith('//') ? `https:${poster}` : poster;
      const iframeUrl = numId 
        ? `https://www.retrogames.cc/embed/${numId}-${slug}.html`
        : `https://www.retrogames.cc/embed/${slug}.html`;

      games.push({
        numId: numId || slug,
        slug,
        title,
        coverUrl: fullPoster,
        iframeUrl,
        likes
      });
    }
  }
  return games;
}

async function scrapeAll() {
  const allGames = [];
  const seenSlugs = new Set();
  const totalPages = 22;

  const outDir = path.join(__dirname, '..', 'public', 'data');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  console.log(`Starting scrape of all ${totalPages} PSX pages from RetroGames.cc...`);

  for (let p = 1; p <= totalPages; p++) {
    const url = p === 1 ? 'https://www.retrogames.cc/psx-games' : `https://www.retrogames.cc/psx-games/page/${p}.html`;
    try {
      const html = await fetchUrl(url);
      const list = parseGamesFromPage(html);
      let pageNew = 0;
      for (const g of list) {
        if (!seenSlugs.has(g.slug)) {
          seenSlugs.add(g.slug);
          allGames.push(g);
          pageNew++;
        }
      }
      console.log(`Page ${p}/${totalPages}: fetched ${list.length} games (${pageNew} unique added, total: ${allGames.length})`);
    } catch (err) {
      console.error(`Page ${p} failed:`, err.message);
    }
    // slight delay
    await new Promise(r => setTimeout(r, 200));
  }

  console.log(`\nCOMPLETED! Total unique PlayStation games collected: ${allGames.length}`);
  const destPath = path.join(outDir, 'psxCatalog.json');
  fs.writeFileSync(destPath, JSON.stringify(allGames, null, 2), 'utf-8');
  console.log(`Saved catalog to ${destPath}`);
}

scrapeAll().catch(console.error);
