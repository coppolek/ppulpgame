const https = require('https');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
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
  });
}

function parseArcadeGamesFromPage(html) {
  const games = [];
  const blockRegex = /class="post-thumb\s+arcade-thumb"[\s\S]*?<\/div>\s*<div class="post-des">[\s\S]*?<\/div>/gi;
  let blockMatch;
  while ((blockMatch = blockRegex.exec(html)) !== null) {
    const block = blockMatch[0];
    const posterMatch = block.match(/data-poster="([^"]+)"/) || block.match(/data-src="([^"]+)"/) || block.match(/src="([^"]+)"/);
    const poster = posterMatch ? posterMatch[1] : '';
    const linkMatch = block.match(/href="https:\/\/www\.retrogames\.cc\/arcade-games\/([^.]+)\.html"/);
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

fetchUrl('https://www.retrogames.cc/arcade-games').then(html => {
  const games = parseArcadeGamesFromPage(html);
  console.log(`Found ${games.length} games on page 1:`);
  console.log("Sample 3 games:", JSON.stringify(games.slice(0, 3), null, 2));
}).catch(console.error);
