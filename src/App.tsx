import React, { useState, useMemo, useEffect } from 'react';
import { RetroGame, RetroSystem, RetroGenre } from './types/game';
import { RETRO_GAMES } from './data/gamesCatalog';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { CategoriesBrowser } from './components/CategoriesBrowser';
import { GameCatalog } from './components/GameCatalog';
import { GamePlayer } from './components/GamePlayer';
import { CustomRomModal } from './components/CustomRomModal';
import { FavoritesModal } from './components/FavoritesModal';
import { Footer } from './components/Footer';
import { RomFileInfo } from './games/customRomEngine';
import { retroAudio } from './audio/retroAudio';

export default function App() {
  const [activeGame, setActiveGame] = useState<RetroGame | null>(null);
  const [customRomInfo, setCustomRomInfo] = useState<RomFileInfo | null>(null);
  const [selectedSystem, setSelectedSystem] = useState<RetroSystem>('ALL');
  const [selectedGenre, setSelectedGenre] = useState<RetroGenre>('ALL');
  const [selectedLetter, setSelectedLetter] = useState<string>('ALL');

  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('retrogames_favorites');
      return saved ? JSON.parse(saved) : ['super-jump-bros', 'tetris-block-master', 'pokemon-radical-red'];
    } catch {
      return ['super-jump-bros', 'tetris-block-master', 'pokemon-radical-red'];
    }
  });

  const [isUploadRomModalOpen, setIsUploadRomModalOpen] = useState(false);
  const [isFavoritesModalOpen, setIsFavoritesModalOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Fast O(1) game lookup map by ID and slug
  const gameLookupMap = useMemo(() => {
    const map = new Map<string, RetroGame>();
    for (const g of RETRO_GAMES) {
      map.set(g.id.toLowerCase(), g);
      // Also index by slug without system prefix (e.g. 'sonic-the-hedgehog')
      const hyphenIdx = g.id.indexOf('-');
      if (hyphenIdx !== -1) {
        const rawSlug = g.id.slice(hyphenIdx + 1).toLowerCase();
        if (!map.has(rawSlug)) {
          map.set(rawSlug, g);
        }
      }
    }
    return map;
  }, []);

  // Compute counts
  const gamesCountBySystem = useMemo(() => {
    const counts: Record<string, number> = {};
    RETRO_GAMES.forEach(g => {
      counts[g.system] = (counts[g.system] || 0) + 1;
    });
    return counts;
  }, []);

  const gamesCountByGenre = useMemo(() => {
    const counts: Record<string, number> = {};
    RETRO_GAMES.forEach(g => {
      counts[g.genre] = (counts[g.genre] || 0) + 1;
    });
    return counts;
  }, []);

  // Synchronize state with URL search params and hash (Deep Linking)
  useEffect(() => {
    const handleUrlChange = () => {
      const params = new URLSearchParams(window.location.search);
      const gameParam = params.get('game') || params.get('g') || params.get('id');
      const systemParam = params.get('system') as RetroSystem | null;

      if (systemParam && ['ALL', 'ARCADE', 'NES', 'SNES', 'GBA', 'GBC', 'GAMEBOY', 'N64', 'NDS', 'GENESIS', 'MASTERSYSTEM', 'GAMEGEAR', 'SEGA32X', 'SEGACD', 'PS1', 'ATARI2600', 'ATARI7800', 'NEOGEO', 'TURBOGRAFX', 'HACKS'].includes(systemParam)) {
        setSelectedSystem(systemParam);
      }

      if (gameParam) {
        const found = gameLookupMap.get(gameParam.toLowerCase().trim());
        if (found) {
          setActiveGame(found);
          document.title = `${found.title} - Gioca Online su RetroGames.cc`;
          return;
        }
      }

      // Check hash router fallback (#/game/xxx or #xxx)
      const hash = window.location.hash.replace(/^#\/?(game\/)?/, '').trim();
      if (hash) {
        const found = gameLookupMap.get(hash.toLowerCase());
        if (found) {
          setActiveGame(found);
          document.title = `${found.title} - Gioca Online su RetroGames.cc`;
          return;
        }
      }

      setActiveGame(null);
      document.title = 'RetroGames - Play Classic Retro Video Games Online';
    };

    handleUrlChange();
    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);

    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, [gameLookupMap]);

  // Sync favorites with LocalStorage
  const handleToggleFavorite = (gameId: string) => {
    setFavorites(prev => {
      const exists = prev.includes(gameId);
      const next = exists ? prev.filter(id => id !== gameId) : [...prev, gameId];
      localStorage.setItem('retrogames_favorites', JSON.stringify(next));
      return next;
    });
  };

  const handlePlayGame = (game: RetroGame) => {
    setActiveGame(game);
    setCustomRomInfo(null);
    const currentParams = new URLSearchParams(window.location.search);
    currentParams.set('game', game.id);
    const newUrl = `?${currentParams.toString()}`;
    window.history.pushState({ gameId: game.id }, '', newUrl);
    document.title = `${game.title} - Gioca Online su RetroGames.cc`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToCatalog = () => {
    setActiveGame(null);
    setCustomRomInfo(null);
    const currentParams = new URLSearchParams(window.location.search);
    currentParams.delete('game');
    const newQuery = currentParams.toString();
    const newUrl = newQuery ? `?${newQuery}` : window.location.pathname;
    window.history.pushState(null, '', newUrl);
    document.title = 'RetroGames - Play Classic Retro Video Games Online';
  };

  const handleLaunchRom = (romGame: RetroGame, romInfo: RomFileInfo) => {
    setCustomRomInfo(romInfo);
    setActiveGame(romGame);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleMute = () => {
    const muted = retroAudio.toggleMute();
    setIsMuted(muted);
  };

  const handleSelectSystem = (sys: RetroSystem) => {
    setSelectedSystem(sys);
    setSelectedGenre('ALL');
    setSelectedLetter('ALL');
    if (activeGame) {
      setActiveGame(null);
    }
    const currentParams = new URLSearchParams();
    if (sys !== 'ALL') {
      currentParams.set('system', sys);
    }
    const newQuery = currentParams.toString();
    const newUrl = newQuery ? `?${newQuery}` : window.location.pathname;
    window.history.pushState(null, '', newUrl);
    document.title = 'RetroGames - Play Classic Retro Video Games Online';
    const catalogEl = document.getElementById('catalog');
    if (catalogEl) {
      catalogEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const featuredGame = RETRO_GAMES.find(g => g.featured) || RETRO_GAMES[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-rose-500 selection:text-white">
      
      {/* 3-Zone Header */}
      <Header
        favoritesCount={favorites.length}
        onOpenFavorites={() => setIsFavoritesModalOpen(true)}
        onOpenUploadRom={() => setIsUploadRomModalOpen(true)}
        onSelectSystem={(sys) => handleSelectSystem(sys as RetroSystem)}
        onPlayFeatured={() => handlePlayGame(featuredGame)}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
      />

      {/* Main View: Game Player OR Catalog View */}
      <main className="flex-1">
        {activeGame ? (
          <GamePlayer
            game={activeGame}
            customRomInfo={customRomInfo}
            onBack={handleBackToCatalog}
          />
        ) : (
          <>
            {/* Hero Banner */}
            <HeroSection
              featuredGame={featuredGame}
              onPlayGame={handlePlayGame}
              onOpenUploadRom={() => setIsUploadRomModalOpen(true)}
            />

            {/* Categories & Systems Browser (Replicating all categories of retrogames.cc) */}
            <CategoriesBrowser
              selectedSystem={selectedSystem}
              selectedGenre={selectedGenre}
              selectedLetter={selectedLetter}
              onSelectSystem={setSelectedSystem}
              onSelectGenre={setSelectedGenre}
              onSelectLetter={setSelectedLetter}
              gamesCountBySystem={gamesCountBySystem}
              gamesCountByGenre={gamesCountByGenre}
            />

            {/* Catalog Grid & Filters */}
            <GameCatalog
              games={RETRO_GAMES}
              favorites={favorites}
              selectedSystem={selectedSystem}
              selectedGenre={selectedGenre}
              selectedLetter={selectedLetter}
              onSelectSystem={setSelectedSystem}
              onSelectGenre={setSelectedGenre}
              onSelectLetter={setSelectedLetter}
              onToggleFavorite={handleToggleFavorite}
              onPlayGame={handlePlayGame}
            />
          </>
        )}
      </main>

      {/* Footer */}
      <Footer
        onSelectSystem={handleSelectSystem}
        onOpenUploadRom={() => setIsUploadRomModalOpen(true)}
      />

      {/* Modals */}
      <CustomRomModal
        isOpen={isUploadRomModalOpen}
        onClose={() => setIsUploadRomModalOpen(false)}
        onLaunchRom={handleLaunchRom}
      />

      <FavoritesModal
        isOpen={isFavoritesModalOpen}
        onClose={() => setIsFavoritesModalOpen(false)}
        favorites={favorites}
        games={RETRO_GAMES}
        onRemoveFavorite={handleToggleFavorite}
        onPlayGame={handlePlayGame}
      />

    </div>
  );
}
