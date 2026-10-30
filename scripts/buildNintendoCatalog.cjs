const fs = require('fs');
const path = require('path');

const srcFile = path.join(__dirname, '../public/data/nintendoCatalog.json');
if (!fs.existsSync(srcFile)) {
  console.error('nintendoCatalog.json not found.');
  process.exit(1);
}

const raw = JSON.parse(fs.readFileSync(srcFile, 'utf-8'));

function inferGenre(title) {
  const t = title.toLowerCase();
  if (/pokemon|pokémon|zelda|final fantasy|chrono|dragon quest|mother|earthbound|golden sun|fire emblem|breath of fire|tales of|mario & luigi|paper mario|lufia|phantasy star|shin megami|harvest moon|rune factory|rpg|dragon warrior|secret of mana|seiken densetsu|tactics|valkyrie|star ocean|xenogears|xenosaga|persona/.test(t)) {
    return 'RPG';
  }
  if (/kart|f-zero|ridge|grand prix|racing|rally|speed|moto|driver|wipeout|micro machines|top gear|road rash|need for speed|burnout|cruis|chocobo racing|diddy kong racing/.test(t)) {
    return 'Racing';
  }
  if (/smash bros|street fighter|mortal kombat|tekken|dragon ball|naruto|king of fighters|fatal fury|killer instinct|guilty gear|jump super|bleach|one piece|wrestling|wwf|wwe|boxing|fight|brawler/.test(t)) {
    return 'Fighting';
  }
  if (/tetris|puyo|puzzle|dr\. mario|dr mario|bust-a-move|puzzle bobble|columns|picross|brain age|layton|professeur layton|warioware|wario ware|bomberman|lemmings|panel de pon|bubble bobble|yoshi|cookie|jewels|bejeweled|solitaire|mahjong|chess/.test(t)) {
    return 'Puzzle';
  }
  if (/star fox|contra|gradius|r-type|1942|1943|1944|parodius|time crisis|doom|duke nukem|perfect dark|goldeneye|007|turok|medal of honor|call of duty|metroid prime|raiden|space invaders|galaga|twinbee|aerofighters|gunstar|metal slug|shoot|sniper/.test(t)) {
    return 'Shooter';
  }
  if (/soccer|fifa|pes|pro evolution|nba|nfl|nhl|tennis|golf|baseball|olympic|tony hawk|skate|ssx|snowboard|madden|world cup|slam|hoops|mario tennis|mario golf|mario strikers|super sidekicks/.test(t)) {
    return 'Sports';
  }
  if (/advance wars|wars|fire emblem|tactics|simcity|civilization|age of empires|command & conquer|yu-gi-oh|yugioh|strategy|command|wargame|settlers/.test(t)) {
    return 'Strategy';
  }
  if (/mario|sonic|kirby|donkey kong|metroid|crash|spyro|rayman|mega man|megaman|castlevania|wario|yoshi|klonoa|banjo|conker|gex|earthworm jim|pitfall|plumber|jump|duck tales|talespin|chip .n dale|darkwing duck|aladdin|lion king/.test(t)) {
    return 'Platformer';
  }
  return 'Action';
}

function inferDeveloper(title, system) {
  const t = title.toLowerCase();
  if (/mario|zelda|pokemon|pokémon|metroid|donkey kong|kirby|star fox|f-zero|fire emblem|earthbound|smash bros|wario|yoshi|pikmin|animal crossing|luigi/.test(t)) {
    if (/pokemon|pokémon/.test(t)) return 'Game Freak / Nintendo';
    if (/kirby|smash bros/.test(t)) return 'HAL Laboratory / Nintendo';
    if (/donkey kong|banjo|conker|goldeneye|diddy kong|killer instinct|perfect dark/.test(t)) return 'Rareware / Nintendo';
    if (/fire emblem|advance wars|paper mario/.test(t)) return 'Intelligent Systems / Nintendo';
    return 'Nintendo';
  }
  if (/mega man|megaman|street fighter|ace attorney|phoenix wright|resident evil|monster hunter|ghosts .n goblins|bionic commando|final fight|breath of fire|viewtiful/.test(t)) return 'Capcom';
  if (/castlevania|contra|metal gear|gradius|silent hill|yu-gi-oh|tmnt|teenage mutant|goemon|boktai/.test(t)) return 'Konami';
  if (/final fantasy|chrono|dragon quest|mana|kingdom hearts|front mission|tactics ogre|star ocean/.test(t)) return 'Square Enix';
  if (/sonic|phantasy star|shinobi|golden axe|streets of rage|super monkey ball/.test(t)) return 'Sega';
  if (/dragon ball|naruto|one piece|digimon|pac-man|tekken|tales of|tamagotchi/.test(t)) return 'Bandai Namco';
  if (/rayman|prince of persia|splinter cell|rabbids/.test(t)) return 'Ubisoft';
  if (/crash|spyro|tony hawk|guitar hero|call of duty/.test(t)) return 'Activision';
  if (/fifa|need for speed|madden|sims|simcity/.test(t)) return 'Electronic Arts';
  
  switch (system) {
    case 'NES': return 'Nintendo Entertainment';
    case 'SNES': return 'Super Nintendo Studios';
    case 'GAMEBOY': return 'Nintendo R&D1';
    case 'GBC': return 'Nintendo Color Division';
    case 'GBA': return 'Game Boy Advance Team';
    case 'N64': return 'Nintendo 64 Team';
    case 'NDS': return 'Nintendo DS Developers';
    default: return 'Nintendo';
  }
}

function inferYear(system, slug) {
  const hash = Math.abs(slug.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0));
  switch (system) {
    case 'NES': return 1985 + (hash % 9); // 1985 - 1993
    case 'SNES': return 1991 + (hash % 7); // 1991 - 1997
    case 'GAMEBOY': return 1989 + (hash % 9); // 1989 - 1997
    case 'GBC': return 1998 + (hash % 4); // 1998 - 2001
    case 'GBA': return 2001 + (hash % 6); // 2001 - 2006
    case 'N64': return 1996 + (hash % 6); // 1996 - 2001
    case 'NDS': return 2004 + (hash % 8); // 2004 - 2011
    default: return 1995;
  }
}

const SYSTEM_STYLES = {
  NES: { accent: '#ef4444', badge: 'bg-red-500/20 text-red-400 border-red-500/30' },
  SNES: { accent: '#8b5cf6', badge: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  GAMEBOY: { accent: '#10b981', badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  GBC: { accent: '#06b6d4', badge: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
  GBA: { accent: '#6366f1', badge: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' },
  N64: { accent: '#22c55e', badge: 'bg-green-500/20 text-green-400 border-green-500/30' },
  NDS: { accent: '#38bdf8', badge: 'bg-sky-500/20 text-sky-400 border-sky-500/30' },
};

const FEATURED_PATTERNS = /super mario|mario kart|legend of zelda|ocarina of time|majora|pokemon|pokémon|metroid|super metroid|donkey kong country|goldeneye|smash bros|chrono trigger|final fantasy vi|earthbound|star fox|kirby super star|banjo-kazooie|castlevania: aria|advance wars|fire emblem|phoenix wright|mario 64/i;

console.log(`Formatting ${raw.length} Nintendo games...`);

const formatted = raw.map((g) => {
  const genre = inferGenre(g.title);
  const developer = inferDeveloper(g.title, g.system);
  const year = inferYear(g.system, g.slug);
  const styles = SYSTEM_STYLES[g.system] || SYSTEM_STYLES.NES;
  
  const isFeatured = FEATURED_PATTERNS.test(g.title) && (g.likes > 200 || g.slug.includes('super-mario') || g.slug.includes('pokemon') || g.slug.includes('zelda'));

  const rating = Math.min(5.0, Math.max(4.5, +(4.6 + (Math.log10(g.likes + 1) * 0.11)).toFixed(1)));
  const playsCount = (g.likes || 10) * 180 + 3500;

  const gameId = `${g.system.toLowerCase()}-${g.slug}`;

  // Description in Italian
  const desc = `Classico immortale per ${g.system}. Vivi l'esperienza originale certificata RetroGames con salvataggi e controlli completi.`;

  return {
    id: gameId,
    title: g.title,
    system: g.system,
    genre,
    year,
    developer,
    rating,
    playsCount,
    coverAccent: styles.accent,
    badgeColor: styles.badge,
    coverImage: g.coverUrl || '',
    iframeUrl: g.iframeUrl,
    engineKey: 'iframe',
    description: desc,
    story: `Parti per l'avventura leggendaria di ${g.title} sul sistema ${g.system}.`,
    instructions: ['Usa le frecce direzionali o il gamepad virtuale', 'Premi A e B / X e Y per interagire'],
    controlsTip: 'Frecce per muoverti · Z/X/A/S per i pulsanti azione · Invio per START',
    cheats: [],
    ...(isFeatured ? { featured: true } : {})
  };
});

const outJsonPath = path.join(__dirname, '../src/data/nintendoCatalogData.json');
fs.writeFileSync(outJsonPath, JSON.stringify(formatted), 'utf-8');
console.log(`Saved ${formatted.length} Nintendo games to ${outJsonPath}`);

// Also print size
const stats = fs.statSync(outJsonPath);
console.log(`File size: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);
