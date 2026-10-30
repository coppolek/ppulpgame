const https = require('https');
const fs = require('fs');
const path = require('path');

const outPath = path.join(__dirname, '../public/data/nintendoCatalog.json');

const NINTENDO_CATEGORIES = [
  { cat: 'nes-games', system: 'NES', maxPage: 60 },
  { cat: 'snes-games', system: 'SNES', maxPage: 78 },
  { cat: 'gameboy-games', system: 'GAMEBOY', maxPage: 32 },
  { cat: 'gameboycolor-games', system: 'GBC', maxPage: 27 },
  { cat: 'gameboyadvance-games', system: 'GBA', maxPage: 61 },
  { cat: 'n64-games', system: 'N64', maxPage: 28 },
  { cat: 'nds-games', system: 'NDS', maxPage: 116 },
];

const agent = new https.Agent({ keepAlive: true, maxSockets: 30 });

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      agent,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      }
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchPage(res.headers.location).then(resolve).catch(reject);
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

function parseGamesFromPage(html, catInfo, pageNum) {
  const games = [];
  const blockRegex = /class="post-thumb\s+[^"]*thumb"[\s\S]*?<\/div>\s*<div class="post-des">[\s\S]*?<\/div>/gi;
  let blockMatch;
  while ((blockMatch = blockRegex.exec(html)) !== null) {
    const block = blockMatch[0];
    const posterMatch = block.match(/data-poster="([^"]+)"/) || block.match(/data-src="([^"]+)"/) || block.match(/src="([^"]+)"/);
    const poster = posterMatch ? posterMatch[1] : '';
    
    // Match game link
    const linkMatch = block.match(new RegExp(`href="https://www\\.retrogames\\.cc/${catInfo.cat}/([^"]+)\\.html"`, 'i'));
    const rawSlug = linkMatch ? linkMatch[1] : '';
    if (!rawSlug || rawSlug.includes('/index')) continue;

    const titleMatch = block.match(/<h6><a[^>]*>([\s\S]*?)<\/a><\/h6>/) || block.match(/alt="([^"]+)"/);
    let title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : '';
    title = title.replace(/&amp;/g, '&').replace(/&#039;/g, "'").replace(/&quot;/g, '"');

    let numId = null;
    const idMatch = poster.match(/\/(\d+)(?:_[a-f0-9]+)?\.(?:jpg|png)/i);
    if (idMatch) {
      numId = idMatch[1];
    }

    const likesMatch = block.match(/fa-thumbs-o-up"><\/i>\s*([\d,]+)/);
    const likes = likesMatch ? parseInt(likesMatch[1].replace(/,/g, ''), 10) : 50;

    const fullPoster = poster.startsWith('//') ? `https:${poster}` : poster;

    const iframeUrl = numId 
      ? `https://www.retrogames.cc/embed/${numId}-${rawSlug}.html`
      : `https://www.retrogames.cc/embed/${rawSlug}.html`;

    games.push({
      numId,
      slug: rawSlug,
      title: title || rawSlug,
      coverUrl: fullPoster,
      iframeUrl,
      likes,
      system: catInfo.system,
      category: catInfo.cat,
      page: pageNum
    });
  }
  return games;
}

async function scrapeAll() {
  console.log('Starting Nintendo scraping across 7 categories...');
  
  // Build list of URLs to scrape
  const tasks = [];
  for (const catInfo of NINTENDO_CATEGORIES) {
    for (let p = 1; p <= catInfo.maxPage; p++) {
      const url = p === 1
        ? `https://www.retrogames.cc/${catInfo.cat}`
        : `https://www.retrogames.cc/${catInfo.cat}/page/${p}.html`;
      tasks.push({ url, catInfo, pageNum: p });
    }
  }
  console.log(`Total listing pages to fetch: ${tasks.length}`);

  const allGames = [];
  const seenSlugs = new Set();
  const CONCURRENCY = 20;
  let activeIndex = 0;
  let completed = 0;

  async function worker() {
    while (activeIndex < tasks.length) {
      const index = activeIndex++;
      const task = tasks[index];
      try {
        const html = await fetchPage(task.url);
        const parsed = parseGamesFromPage(html, task.catInfo, task.pageNum);
        for (const g of parsed) {
          const key = `${g.system}:${g.slug}`;
          if (!seenSlugs.has(key)) {
            seenSlugs.add(key);
            allGames.push(g);
          }
        }
      } catch (err) {
        console.error(`Error on ${task.url}: ${err.message}`);
        // Retry once
        try {
          const html = await fetchPage(task.url);
          const parsed = parseGamesFromPage(html, task.catInfo, task.pageNum);
          for (const g of parsed) {
            const key = `${g.system}:${g.slug}`;
            if (!seenSlugs.has(key)) {
              seenSlugs.add(key);
              allGames.push(g);
            }
          }
        } catch (e) {
          console.error(`Retry failed on ${task.url}: ${e.message}`);
        }
      }
      completed++;
      if (completed % 40 === 0 || completed === tasks.length) {
        console.log(`Progress: ${completed}/${tasks.length} pages scraped (${allGames.length} games found so far)...`);
      }
    }
  }

  const workers = Array.from({ length: CONCURRENCY }, () => worker());
  await Promise.all(workers);

  console.log(`Scraping complete! Total unique Nintendo games: ${allGames.length}`);

  // Summary by system
  const countsBySys = {};
  for (const g of allGames) {
    countsBySys[g.system] = (countsBySys[g.system] || 0) + 1;
  }
  console.log('Breakdown by system:', countsBySys);

  // Check if any game lacks numId
  const missingNumId = allGames.filter(g => !g.numId);
  console.log(`Games with missing numeric ID: ${missingNumId.length}`);

  fs.writeFileSync(outPath, JSON.stringify(allGames, null, 2), 'utf-8');
  console.log(`Saved to ${outPath}`);
  process.exit(0);
}

scrapeAll().catch(err => {
  console.error('Fatal scrape error:', err);
  process.exit(1);
});
