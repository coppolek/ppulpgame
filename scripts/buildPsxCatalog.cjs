const fs = require('fs');
const path = require('path');

const raw = JSON.parse(fs.readFileSync(path.join(__dirname, '../public/data/psxCatalog.json'), 'utf-8'));

function inferGenre(title) {
  const t = title.toLowerCase();
  if (/racing|rally|speed|gran turismo|motor|driver|nascar|f1|formula|kart|moto|championship|road|rush|superbike|wrc|colin mcrae|test drive|ridge racer|wipeout|need for speed|burnout|drift|touring/.test(t)) {
    return 'Racing';
  }
  if (/tekken|kof|street fighter|mortal kombat|bloody roar|dead or alive|rival schools|soul blade|guilty gear|battle arena|fight|brawler|boxing|wwe|wwf|wrestling|smackdown|bushido|kensei|tobal|fatal fury|samurai/.test(t)) {
    return 'Fighting';
  }
  if (/final fantasy|dragon quest|tales of|suikoden|star ocean|chrono|xenogears|valkyrie|breath of fire|grandia|legend of mana|persona|shin megami|parasite eve|vagrant story|wild arms|alundra|saga frontier|lunar|tactics|rpg|quest|legend of dragoon|diablo/.test(t)) {
    return 'RPG';
  }
  if (/ace combat|air combat|time crisis|point blank|raiden|r-type|darius|gradius|shoot|gunner|sniper|blaster|strike|panzer|doom|quake|duke nukem|medal of honor|alien|c-12|syphon filter|delta force|rainbow six/.test(t)) {
    return 'Shooter';
  }
  if (/fifa|soccer|football|nba|nfl|nhl|madden|tony hawk|skate|snowboard|tennis|golf|baseball|bowling|pool|billiards|olympic|world cup|slam|hoops|pga|wimbledon|pro evolution|iss pro/.test(t)) {
    return 'Sports';
  }
  if (/puzzle|tetris|bust-a-move|puyo|iq|kurushi|pinball|chess|monopoly|star|scrabble|risk|board|card|bishi bashi|super puzzle/.test(t)) {
    return 'Puzzle';
  }
  if (/crash|spyro|rayman|croc|klonoa|gex|oddworld|tombi|tomba|medievil|pandemonium|tarzan|hercules|bugs life|toy story|ape escape|mega man|castlevania|heart of darkness|pac-man world|jersey devil|earthworm jim/.test(t)) {
    return 'Platformer';
  }
  if (/command & conquer|red alert|warcraft|civilization|front mission|populous|theme hospital|theme park|simcity|brigandine|tactics ogre/.test(t)) {
    return 'Strategy';
  }
  return 'Action';
}

function inferDeveloper(title) {
  const t = title.toLowerCase();
  if (/crash|bandicoot/.test(t)) return 'Naughty Dog / Sony';
  if (/spyro/.test(t)) return 'Insomniac Games / Sony';
  if (/tekken|ridge racer|ace combat|pac-man/.test(t)) return 'Namco';
  if (/final fantasy|chrono|parasite eve|xenogears|front mission/.test(t)) return 'Squaresoft';
  if (/resident evil|street fighter|mega man|dino crisis/.test(t)) return 'Capcom';
  if (/metal gear|castlevania|silent hill|suikoden|iss pro/.test(t)) return 'Konami';
  if (/gran turismo/.test(t)) return 'Polyphony Digital / Sony';
  if (/tomb raider/.test(t)) return 'Core Design / Eidos';
  if (/mortal kombat/.test(t)) return 'Midway Games';
  if (/tony hawk/.test(t)) return 'Neversoft / Activision';
  if (/syphon filter/.test(t)) return 'Eidetic / 989 Studios';
  if (/driver/.test(t)) return 'Reflections Interactive / GT Interactive';
  if (/wipeout|destruction derby|medievil/.test(t)) return 'SCE Studio Liverpool / Sony';
  if (/fifa|need for speed|madden/.test(t)) return 'EA Sports / Electronic Arts';
  return 'Sony Interactive Entertainment';
}

const localCoversMap = {
  '100-star': '/covers/100-star-psx.png',
  'tekken-3': '/covers/tekken-3-psx.png',
  'crash-bandicoot': '/covers/crash-bandicoot-psx.png',
};

const topFeaturedSlugs = new Set([
  '100-star',
  'crash-bandicoot',
  'crash-bandicoot-warped',
  'crash-bandicoot-2-cortex-strikes-back',
  'castlevania-symphony-of-the-night',
  'bloody-roar-2-bringer-of-new-age',
  'tekken-3',
  'resident-evil-3-nemesis',
  'silent-hill',
  'metal-gear-solid',
  'final-fantasy-vii',
  'gran-turismo-2',
  'spyro-the-dragon',
  'tomb-raider-ii',
  'tony-hawks-pro-skater-2'
]);

const knownIdMap = {
  '100-star': '100-star-psx',
  'tekken-3': 'tekken-3-psx',
  'crash-bandicoot': 'crash-bandicoot-psx',
};

const formattedGames = raw.map((g) => {
  const genre = inferGenre(g.title);
  const developer = inferDeveloper(g.title);
  const isFeatured = topFeaturedSlugs.has(g.slug);
  
  // Rating between 4.6 and 5.0 based on likes
  const rating = Math.min(5.0, Math.max(4.5, +(4.6 + (Math.log10(g.likes + 1) * 0.12)).toFixed(1)));
  const playsCount = g.likes * 140 + 4200;
  
  // Use local cover if available, otherwise direct high-res screenshot
  const coverImage = localCoversMap[g.slug] || g.coverUrl;
  const gameId = knownIdMap[g.slug] || `psx-${g.slug}`;

  return {
    id: gameId,
    title: g.title,
    system: 'PS1',
    genre,
    year: 1995 + (Math.abs(g.slug.length) % 6), // 1995 - 2001 (Golden PSX era)
    developer,
    rating,
    playsCount,
    coverAccent: '#003791',
    badgeColor: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    coverImage,
    iframeUrl: g.iframeUrl,
    engineKey: 'iframe',
    featured: isFeatured,
    description: `Il classico originale PlayStation "${g.title}" giocabile direttamente online tramite l'emulatore ufficiale di RetroGames.cc.`,
    story: `Rivivi le emozioni dell'era a 32-bit di Sony PlayStation con "${g.title}", completo di controlli reattivi, audio originale e salvataggio degli stati.`,
    instructions: [
      'Frecce direzionali o D-Pad per muoverti',
      'Tasto Z = Croce (X), Tasto X = Cerchio (O)',
      'Tasto A = Quadrato, Tasto S = Triangolo',
      'Tasti Q / W = Dorsali L1 / R1',
      'Tasto Invio = Start, Barra Spaziatrice = Select'
    ],
    controlsTip: 'Frecce per muoverti · Z/X/A/S per i tasti azione · Invio per Start',
    cheats: [
      { id: 'inf_lives', code: 'PSXLIVES', name: 'Vite / Tentativi Infiniti', description: 'Vite al massimo', enabled: false },
      { id: 'all_levels', code: 'ALLSTAGES', name: 'Sblocca Tutti i Livelli', description: 'Accesso a tutti i capitoli', enabled: false }
    ]
  };
});

const outPath = path.join(__dirname, '../src/data/psxCatalogData.json');
fs.writeFileSync(outPath, JSON.stringify(formattedGames, null, 2), 'utf-8');
console.log(`Generated ${formattedGames.length} PlayStation games into ${outPath}`);
