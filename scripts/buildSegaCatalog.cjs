const fs = require('fs');
const path = require('path');

const srcFile = path.join(__dirname, '../public/data/segaCatalog.json');
if (!fs.existsSync(srcFile)) {
  console.error('segaCatalog.json not found.');
  process.exit(1);
}

const raw = JSON.parse(fs.readFileSync(srcFile, 'utf-8'));

function inferGenre(title) {
  const t = title.toLowerCase();
  if (/phantasy star|shining force|shining in the darkness|sword of vermilion|ys|crusader of centy|beyond oasis|landstalker|shadowrun|dungeons & dragons|arcanum|rpg|dragon|quest|fantasy|sorcerer/.test(t)) {
    return 'RPG';
  }
  if (/out run|outrun|super monaco gp|virtua racing|road rash|f1|formula one|lotus|micro machines|chase hq|hang-on|super hang on|racing|rally|speed|grand prix|top gear|burnout|need for speed|skitchin/.test(t)) {
    return 'Racing';
  }
  if (/street fighter|mortal kombat|virtua fighter|fatal fury|king of fighters|samurai shodown|art of fighting|eternal champions|primal rage|world heroes|wwf|wwe|boxing|fight|brawler|tekken/.test(t)) {
    return 'Fighting';
  }
  if (/columns|puyo puyo|dr robotnik|mean bean machine|tetris|klax|baku baku|bubble bobble|puzzle|brain|blockout|marble madness|pac-attack|zoop|lemmings|chess|shogi|mahjong/.test(t)) {
    return 'Puzzle';
  }
  if (/gunstar heroes|thunder force|contra|hard corps|alien soldier|space harrier|vector blast|after burner|twinbee|raiden|aerofighters|desert strike|jungle strike|urban strike|sub-terrania|truxton|zero wing|fire shark|vapour trail|shmup|shooter|shoot|sniper|doom/.test(t)) {
    return 'Shooter';
  }
  if (/fifa|nba|nfl|nhl|world series baseball|virtua tennis|pga tour|tennis|soccer|sensible soccer|olympic|golf|madden|mutant league|football|slam|hoops/.test(t)) {
    return 'Sports';
  }
  if (/wars|master of monsters|populous|dune|command|civilization|tactics|strategy|risk|nobunaga|romance of the three kingdoms/.test(t)) {
    return 'Strategy';
  }
  if (/sonic|alex kidd|shinobi|shadow dancer|streets of rage|bare knuckle|golden axe|earthworm jim|vectorman|ristar|aladdin|lion king|mickey mouse|castle of illusion|quackshot|world of illusion|pitfall|comix zone|wonder boy|monster world|kid chameleon|rocket knight|sparkster|strider|splatterhouse|bonanza bros|toejam & earl|toejam and earl|flintstones|tiny toon|gargoyles|animaniacs|turtles|ninja turtles/.test(t)) {
    return 'Platformer';
  }
  return 'Action';
}

function inferDeveloper(title, system) {
  const t = title.toLowerCase();
  if (/sonic|alex kidd|shinobi|golden axe|streets of rage|phantasy star|out run|virtua|after burner|space harrier|aladdin|ristar|vectorman|daytona|sega rally|wonder boy/.test(t)) {
    if (/sonic/.test(t)) return 'Sonic Team / Sega';
    if (/streets of rage|golden axe|shinobi/.test(t)) return 'Sega R&D2 / AM2';
    if (/virtua|out run|after burner|space harrier/.test(t)) return 'Sega AM2';
    return 'Sega Enterprise';
  }
  if (/gunstar heroes|alien soldier|dynamite headdy|yu yu hakusho/.test(t)) return 'Treasure / Sega';
  if (/contra|castlevania|tmnt|turtles|sunset riders|tiny toon|rocket knight|sparkster/.test(t)) return 'Konami';
  if (/street fighter|mega man|megaman|strider|ghouls .n ghosts|mercs|final fight|forgotten worlds/.test(t)) return 'Capcom';
  if (/mortal kombat|nba jam|primal rage|terminator/.test(t)) return 'Midway / Acclaim';
  if (/earthworm jim|mickey mania|aladdin|lion king/.test(t)) return 'Shiny / Virgin Interactive';
  if (/fifa|madden|nhl|road rash|strike|desert strike|jungle strike/.test(t)) return 'Electronic Arts';
  if (/dragon ball|pac-man|splatterhouse/.test(t)) return 'Namco / Bandai';
  
  switch (system) {
    case 'GENESIS': return 'Sega Mega Drive Studios';
    case 'MASTERSYSTEM': return 'Sega Master System R&D';
    case 'GAMEGEAR': return 'Sega Portable Team';
    case 'SEGA32X': return 'Sega 32X Division';
    case 'SEGACD': return 'Sega CD Media Group';
    default: return 'Sega';
  }
}

function inferYear(system, slug) {
  const hash = Math.abs(slug.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0));
  switch (system) {
    case 'GENESIS': return 1989 + (hash % 8); // 1989 - 1996
    case 'MASTERSYSTEM': return 1986 + (hash % 8); // 1986 - 1993
    case 'GAMEGEAR': return 1991 + (hash % 6); // 1991 - 1996
    case 'SEGA32X': return 1994 + (hash % 2); // 1994 - 1995
    case 'SEGACD': return 1992 + (hash % 4); // 1992 - 1995
    default: return 1992;
  }
}

const SYSTEM_STYLES = {
  GENESIS: { accent: '#0ea5e9', badge: 'bg-sky-500/20 text-sky-400 border-sky-500/30' },
  MASTERSYSTEM: { accent: '#3b82f6', badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  GAMEGEAR: { accent: '#14b8a6', badge: 'bg-teal-500/20 text-teal-400 border-teal-500/30' },
  SEGA32X: { accent: '#f59e0b', badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  SEGACD: { accent: '#a855f7', badge: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
};

const FEATURED_PATTERNS = /sonic the hedgehog|streets of rage|golden axe|shinobi|phantasy star|gunstar heroes|out run|vectorman|comix zone|earthworm jim|aladdin|wonder boy|virtua fighter|shining force|castlevania: bloodlines|contra: hard corps|knuckles/i;

console.log(`Formatting ${raw.length} Sega games...`);

const formatted = raw.map((g) => {
  const genre = inferGenre(g.title);
  const developer = inferDeveloper(g.title, g.system);
  const year = inferYear(g.system, g.slug);
  const styles = SYSTEM_STYLES[g.system] || SYSTEM_STYLES.GENESIS;
  
  const isFeatured = FEATURED_PATTERNS.test(g.title) && (g.likes > 80 || g.slug.includes('sonic') || g.slug.includes('streets-of-rage'));

  const rating = Math.min(5.0, Math.max(4.5, +(4.6 + (Math.log10(g.likes + 1) * 0.11)).toFixed(1)));
  const playsCount = (g.likes || 10) * 190 + 3800;

  const gameId = `${g.system.toLowerCase()}-${g.slug.replace(/\s+/g, '-')}`;

  const desc = `Classico immortale Sega per ${g.system}. Vivi l'esperienza originale a 16-bit / 8-bit certificata RetroGames con supporto comandi completo e salvataggi.`;

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
    story: `Vivi l'azione ad alta velocità di ${g.title} su console ${g.system}.`,
    instructions: ['Frecce direzionali o D-Pad per il movimento', 'Tasti A, B, C (Z, X, C) per saltare, attaccare e interagire'],
    controlsTip: 'Frecce per muoverti · Z = A · X = B · C = C · Invio = START',
    cheats: [],
    ...(isFeatured ? { featured: true } : {})
  };
});

const outJsonPath = path.join(__dirname, '../src/data/segaCatalogData.json');
fs.writeFileSync(outJsonPath, JSON.stringify(formatted), 'utf-8');
console.log(`Saved ${formatted.length} Sega games to ${outJsonPath}`);

const stats = fs.statSync(outJsonPath);
console.log(`File size: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);
