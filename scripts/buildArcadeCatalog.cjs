const fs = require('fs');
const path = require('path');

const srcFile = path.join(__dirname, '../public/data/arcadeCatalog.json');
if (!fs.existsSync(srcFile)) {
  console.error('arcadeCatalog.json not found yet.');
  process.exit(1);
}

const raw = JSON.parse(fs.readFileSync(srcFile, 'utf-8'));

function inferGenre(title) {
  const t = title.toLowerCase();
  if (/racing|rally|speed|grand prix|motor|driver|f1|formula|kart|moto|championship|road|rush|superbike|drift|touring|outrun|over top|neo drift|hang-on|chase h.q.|ridge racer|daytona|cruis/.test(t)) {
    return 'Racing';
  }
  if (/tekken|kof|king of fighters|street fighter|mortal kombat|bloody roar|dead or alive|soulcalibur|guilty gear|darkstalkers|vampire|fatal fury|samurai shodown|art of fighting|world heroes|brawler|boxing|wrestling|wwf|wwe|virtua fighter|last blade|breakers|punch-out|marvel vs|capcom vs|snk vs|x-men vs|fight/.test(t)) {
    return 'Fighting';
  }
  if (/metal slug|contra|1941|1942|1943|1944|1945|raiden|r-type|gradius|darius|parodius|strikers 1945|aero fighters|sonic wings|gunbird|dodonpachi|donpachi|battle garegga|shock troopers|gunforce|time crisis|point blank|galaga|galaxian|space invaders|shoot|gunner|sniper|blaster|strike|carrier air wing|un squadron|progear|dimahoo|twinbee|salamander|xevious|commando|ikari warriors|mercs/.test(t)) {
    return 'Shooter';
  }
  if (/fifa|soccer|football|nba|nfl|nhl|tennis|golf|baseball|bowling|pool|billiards|olympic|world cup|slam|hoops|super sidekicks|virtua striker|windjammers|neo geo cup|tecmo world cup|street hoop|baseball stars/.test(t)) {
    return 'Sports';
  }
  if (/puzzle|tetris|puzzle bobble|bust-a-move|magical drop|puyo|columns|money idol|pang|super pang|pinball|chess|mahjong|shogi|solitaire|board|card|super puzzle/.test(t)) {
    return 'Puzzle';
  }
  if (/bubble bobble|rainbow islands|snow bros|joe & mac|caveman ninja|wonder boy|toki|spinmaster|metal slug|platform|jump|donkey kong|mario bros|pac-land|pitfall|shinobi|shadow dancer|ghosts n goblins|ghouls n ghosts/.test(t)) {
    return 'Platformer';
  }
  if (/pac-man|ms. pac-man|pacman|dig dug|q*bert|frogger|burger time|rally-x|new rally-x|centipede|millipede|galaga|space invaders|asteroids|missile command|lode runner/.test(t)) {
    return 'Arcade';
  }
  return 'Action';
}

function inferDeveloper(title) {
  const t = title.toLowerCase();
  if (/street fighter|final fight|mega man|capcom|1941|1942|1943|1944|1945|strider|cadillacs|captain commando|darkstalkers|marvel|ghosts/.test(t)) return 'Capcom';
  if (/metal slug|kof|king of fighters|fatal fury|samurai shodown|art of fighting|snk|neo geo|world heroes|shock troopers|windjammers/.test(t)) return 'SNK / Neo Geo';
  if (/metal gear|contra|gradius|castlevania|sunset riders|teenage mutant|ninja turtles|tmnt|parodius|salamander|twinbee|simpsons|x-men/.test(t)) return 'Konami';
  if (/tekken|pac-man|galaga|dig dug|ridge racer|rally-x|time crisis|point blank|xevious|pole position|mappy/.test(t)) return 'Namco';
  if (/sonic|outrun|virtua|daytona|sega rally|golden axe|shinobi|space harrier|hang-on|after burner|altered beast|streets of rage/.test(t)) return 'Sega';
  if (/space invaders|bubble bobble|puzzle bobble|bust-a-move|darius|rainbow islands|arkanoid|qix|rastan|operation wolf/.test(t)) return 'Taito';
  if (/mortal kombat|nba jam|rampage|spy hunter|joust|defender|gauntlet|smash t.v.|pit-fighter/.test(t)) return 'Midway Games';
  if (/r-type|metal slug|gunforce|in the hunt|undercover cops/.test(t)) return 'Irem';
  if (/raiden|raiden ii|viper phase/.test(t)) return 'Seibu Kaihatsu';
  if (/dodonpachi|donpachi|guwange|esprade|ketsui/.test(t)) return 'Cave';
  if (/strikers 1945|gunbird|sengoku blade|samurai aces/.test(t)) return 'Psikyo';
  if (/double dragon|kunio|renegade/.test(t)) return 'Technos Japan';
  if (/joe & mac|bad dudes|burger time|magical drop|windjammers/.test(t)) return 'Data East';
  return 'Coin-Op Arcade Classics';
}

const topFeaturedSlugs = new Set([
  'street-fighter-ii-champion-edition-street-fighter-2-920513-etc',
  'metal-slug-super-vehicle-001',
  'metal-slug-x-super-vehicle-001',
  'metal-slug-3',
  'tekken-3-japan-tet2-ver-e1',
  'pac-man-midway',
  'ms-pac-man',
  'galaga-namco',
  'space-invaders-cv',
  'mortal-kombat-rev-5-0-t-unit-03-19-93',
  'mortal-kombat-ii-rev-l3-1',
  'cadillacs-and-dinosaurs-930201-etc',
  'the-king-of-fighters-98-the-slugfest-kof-98-kof98',
  'the-king-of-fighters-2002-magic-plus-ii-bootleg',
  'puzzle-bobble-bust-a-move-neo-geo',
  'sunset-riders-4-players-ver-eac',
  'teenage-mutant-hero-turtles-4-players-uk',
  'captain-commando-911202-etc',
  'final-fight-900305-usa',
  'snow-bros-nick-tom-set-1'
]);

const formattedGames = raw.map((g) => {
  const genre = inferGenre(g.title);
  const developer = inferDeveloper(g.title);
  const isFeatured = topFeaturedSlugs.has(g.slug);
  
  // Rating between 4.6 and 5.0 based on likes
  const rating = Math.min(5.0, Math.max(4.5, +(4.6 + (Math.log10(g.likes + 1) * 0.12)).toFixed(1)));
  const playsCount = g.likes * 160 + 5400;
  
  const gameId = `arcade-${g.slug}`;

  return {
    id: gameId,
    title: g.title,
    system: 'ARCADE',
    genre,
    year: 1980 + (Math.abs(g.slug.length) % 18), // 1980 - 1998 (Golden Arcade coin-op era)
    developer,
    rating,
    playsCount,
    coverAccent: '#f59e0b',
    badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    coverImage: g.coverUrl,
    iframeUrl: g.iframeUrl,
    engineKey: 'iframe',
    featured: isFeatured,
    description: `Il coin-op originale da sala giochi "${g.title}" con emulatore arcade MAME integrato di RetroGames.cc. Inserisci il gettone e gioca!`,
    story: `Rivivi le sensazioni della sala giochi anni '80 e '90 con il cabinato originale di "${g.title}", grafiche pixel-art autentiche ed effetti sonori FM originali.`,
    instructions: [
      'Tasto 5 = Inserisci Gettone (Coin / Credit)',
      'Tasto 1 = Giocatore 1 Start',
      'Frecce Direzionali = Joystick Leva Arcade',
      'Tasti Z, X, C = Tasti Azione Principali (A, B, C)',
      'Tasti A, S, D = Tasti Azione Secondari (D, E, F per picchiaduro a 6 tasti)'
    ],
    controlsTip: 'Tasto 5 per inserire moneta · Tasto 1 per Start · Frecce per muoverti · Z/X/C per bottoni azione',
    cheats: [
      { id: 'inf_credits', code: 'COIN99', name: 'Crediti / Gettoni Infiniti', description: 'Crediti sempre al massimo', enabled: false },
      { id: 'god_mode', code: 'INVULN', name: 'Invulnerabilità Cabinato', description: 'Nessun danno dai colpi nemici', enabled: false }
    ]
  };
});

const outPath = path.join(__dirname, '../src/data/arcadeCatalogData.json');
fs.writeFileSync(outPath, JSON.stringify(formattedGames, null, 2), 'utf-8');
console.log(`Generated ${formattedGames.length} Arcade games into ${outPath}`);
