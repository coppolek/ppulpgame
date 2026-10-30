import React, { useState, useMemo, useEffect } from 'react';
import { Search, Heart, RotateCcw, Filter, Flame, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { RetroGame, RetroSystem, RetroGenre } from '../types/game';
import { ALL_RETRO_SYSTEMS } from '../data/gamesCatalog';
import { GameCard } from './GameCard';
import { retroAudio } from '../audio/retroAudio';
import { useLanguage } from '../i18n/LanguageContext';
import { TranslationKey } from '../i18n/translations';

interface GameCatalogProps {
  games: RetroGame[];
  favorites: string[];
  selectedSystem: RetroSystem;
  selectedGenre: RetroGenre;
  selectedLetter: string;
  onSelectSystem: (system: RetroSystem) => void;
  onSelectGenre: (genre: RetroGenre) => void;
  onSelectLetter: (letter: string) => void;
  onToggleFavorite: (gameId: string) => void;
  onPlayGame: (game: RetroGame) => void;
}

const ITEMS_PER_PAGE = 36;

const GENRES_KEYS: { id: RetroGenre; key: TranslationKey }[] = [
  { id: 'ALL', key: 'genre.all' },
  { id: 'Platformer', key: 'genre.platformer' },
  { id: 'Action', key: 'genre.action' },
  { id: 'Shooter', key: 'genre.shooter' },
  { id: 'RPG', key: 'genre.rpg' },
  { id: 'Fighting', key: 'genre.fighting' },
  { id: 'Racing', key: 'genre.racing' },
  { id: 'Puzzle', key: 'genre.puzzle' },
  { id: 'Sports', key: 'genre.sports' },
  { id: 'Strategy', key: 'genre.strategy' },
  { id: 'Hack', key: 'genre.hack' },
];

export const GameCatalog: React.FC<GameCatalogProps> = ({
  games,
  favorites,
  selectedSystem,
  selectedGenre,
  selectedLetter,
  onSelectSystem,
  onSelectGenre,
  onSelectLetter,
  onToggleFavorite,
  onPlayGame,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'popular' | 'rating' | 'year' | 'alpha'>('popular');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const { t, language } = useLanguage();

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedSystem, selectedGenre, selectedLetter, searchQuery, showFavoritesOnly, sortBy]);

  // Active System Info Metadata
  const activeSystemMeta = useMemo(() => {
    return ALL_RETRO_SYSTEMS.find(s => s.id === selectedSystem);
  }, [selectedSystem]);

  // Filter & Sort logic
  const filteredGames = useMemo(() => {
    return games
      .filter((game) => {
        // System match
        if (selectedSystem !== 'ALL' && game.system !== selectedSystem) {
          return false;
        }
        // Genre match
        if (selectedGenre !== 'ALL' && game.genre !== selectedGenre) {
          return false;
        }
        // Letter match (A-Z or #)
        if (selectedLetter !== 'ALL') {
          const firstChar = game.title.trim().charAt(0).toUpperCase();
          if (selectedLetter === '#') {
            if (/[A-Z]/.test(firstChar)) return false;
          } else {
            if (firstChar !== selectedLetter) return false;
          }
        }
        // Favorite filter
        if (showFavoritesOnly && !favorites.includes(game.id)) {
          return false;
        }
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = game.title.toLowerCase().includes(q);
          const matchDev = game.developer.toLowerCase().includes(q);
          const matchDesc = game.description.toLowerCase().includes(q);
          const matchSys = game.system.toLowerCase().includes(q);
          return matchTitle || matchDev || matchDesc || matchSys;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'popular') {
          return b.playsCount - a.playsCount;
        }
        if (sortBy === 'rating') {
          return b.rating - a.rating;
        }
        if (sortBy === 'year') {
          return b.year - a.year;
        }
        if (sortBy === 'alpha') {
          return a.title.localeCompare(b.title);
        }
        return 0;
      });
  }, [games, selectedSystem, selectedGenre, selectedLetter, showFavoritesOnly, favorites, searchQuery, sortBy]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredGames.length / ITEMS_PER_PAGE);
  const paginatedGames = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredGames.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredGames, currentPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    retroAudio.playSelect();
    const catalogEl = document.getElementById('catalog');
    if (catalogEl) {
      catalogEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Generate pagination items
  const paginationRange = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | string)[] = [1];
    const left = Math.max(2, currentPage - 1);
    const right = Math.min(totalPages - 1, currentPage + 1);

    if (left > 2) pages.push('...');
    for (let p = left; p <= right; p++) {
      pages.push(p);
    }
    if (right < totalPages - 1) pages.push('...');
    pages.push(totalPages);
    return pages;
  }, [totalPages, currentPage]);

  return (
    <section id="catalog" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Active System Spotlight Banner (if a category is picked) */}
      {activeSystemMeta && (
        <div className="mb-8 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-400 mb-1">
              <span className="uppercase" style={{ color: activeSystemMeta.accentColor }}>{activeSystemMeta.manufacturer}</span>
              <span>·</span>
              <span>{activeSystemMeta.era}</span>
              <span>·</span>
              <span>{t('catalog.launchYear')} {activeSystemMeta.yearIntroduced}</span>
            </div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <span>{activeSystemMeta.name}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              {activeSystemMeta.description}
            </p>
          </div>

          <button
            onClick={() => {
              retroAudio.playSelect();
              onSelectSystem('ALL');
            }}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg self-start md:self-auto cursor-pointer transition-colors"
          >
            {t('catalog.showAllSystems')}
          </button>
        </div>
      )}

      {/* Search Bar & Primary Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('catalog.searchPlaceholder')}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        {/* Secondary controls: Genre dropdown, Sort dropdown, Favorites toggle */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Genre selector */}
          <select
            value={selectedGenre}
            onChange={(e) => {
              retroAudio.playSelect();
              onSelectGenre(e.target.value as RetroGenre);
            }}
            className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-medium text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
          >
            {GENRES_KEYS.map((g) => (
              <option key={g.id} value={g.id}>
                {t(g.key)}
              </option>
            ))}
          </select>

          {/* Sort By selector */}
          <select
            value={sortBy}
            onChange={(e) => {
              retroAudio.playSelect();
              setSortBy(e.target.value as any);
            }}
            className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-medium text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
          >
            <option value="popular">{t('catalog.sortPopular')}</option>
            <option value="rating">{t('catalog.sortRating')}</option>
            <option value="year">{t('catalog.sortYear')}</option>
            <option value="alpha">{t('catalog.sortAlpha')}</option>
          </select>

          {/* Favorites Only Toggle */}
          <button
            onClick={() => {
              retroAudio.playSelect();
              setShowFavoritesOnly(!showFavoritesOnly);
            }}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
              showFavoritesOnly
                ? 'bg-rose-600/20 text-rose-300 border-rose-500/50'
                : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${showFavoritesOnly ? 'fill-rose-500 text-rose-500' : ''}`} />
            <span>{t('catalog.favoritesOnly', { count: favorites.length })}</span>
          </button>

        </div>
      </div>

      {/* Systems Segmented Quick Ribbon (All retrogames.cc consoles) */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto mb-8 scrollbar-none">
        <button
          onClick={() => {
            retroAudio.playSelect();
            onSelectSystem('ALL');
          }}
          className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all whitespace-nowrap cursor-pointer ${
            selectedSystem === 'ALL'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          {t('catalog.allGames')}
        </button>

        {ALL_RETRO_SYSTEMS.map((sys) => {
          const isActive = selectedSystem === sys.id;
          return (
            <button
              key={sys.id}
              onClick={() => {
                retroAudio.playSelect();
                onSelectSystem(sys.id);
              }}
              className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {sys.shortName}
            </button>
          );
        })}
      </div>

      {/* Results Header count */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 text-xs text-slate-400 font-mono">
        <div>
          {t('catalog.resultsCount', {
            from: filteredGames.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1,
            to: Math.min(filteredGames.length, currentPage * ITEMS_PER_PAGE),
            total: filteredGames.length,
          })}
          {selectedSystem !== 'ALL' && <span>{t('catalog.filterSystem', { system: selectedSystem })}</span>}
          {selectedGenre !== 'ALL' && <span>{t('catalog.filterGenre', { genre: selectedGenre })}</span>}
          {selectedLetter !== 'ALL' && <span>{t('catalog.filterLetter', { letter: selectedLetter })}</span>}
        </div>
        {(searchQuery || selectedGenre !== 'ALL' || showFavoritesOnly || selectedSystem !== 'ALL' || selectedLetter !== 'ALL') && (
          <button
            onClick={() => {
              retroAudio.playSelect();
              setSearchQuery('');
              onSelectGenre('ALL');
              onSelectLetter('ALL');
              setShowFavoritesOnly(false);
              onSelectSystem('ALL');
            }}
            className="flex items-center gap-1 text-rose-400 hover:text-rose-300 transition-colors cursor-pointer self-start sm:self-auto"
          >
            <RotateCcw className="w-3 h-3" />
            <span>{t('catalog.resetFilters')}</span>
          </button>
        )}
      </div>

      {/* Grid of Game Cards */}
      {paginatedGames.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {paginatedGames.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                isFavorite={favorites.includes(game.id)}
                onToggleFavorite={onToggleFavorite}
                onPlay={onPlayGame}
              />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-800">
              <div className="text-xs text-slate-400 font-mono">
                {language === 'it' 
                  ? `Pagina ${currentPage} di ${totalPages} (${filteredGames.length} giochi totali)`
                  : `Page ${currentPage} of ${totalPages} (${filteredGames.length} total games)`}
              </div>

              <div className="flex items-center gap-1">
                {/* First page */}
                <button
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 transition-colors"
                  title={language === 'it' ? 'Prima pagina' : 'First page'}
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>

                {/* Prev page */}
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold text-slate-200 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>{t('catalog.paginationPrev')}</span>
                </button>

                {/* Page numbers */}
                <div className="hidden sm:flex items-center gap-1 mx-2">
                  {paginationRange.map((p, idx) => {
                    if (p === '...') {
                      return (
                        <span key={`dots-${idx}`} className="px-2 text-slate-500 font-mono text-xs">
                          ...
                        </span>
                      );
                    }
                    const pageNum = p as number;
                    const isActive = pageNum === currentPage;
                    return (
                      <button
                        key={`page-${pageNum}`}
                        onClick={() => handlePageChange(pageNum)}
                        className={`min-w-8 h-8 px-2 text-xs font-mono font-bold rounded-lg transition-all ${
                          isActive
                            ? 'bg-rose-600 text-white shadow-md shadow-rose-950'
                            : 'bg-slate-800/80 hover:bg-slate-750 text-slate-300 hover:text-white'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                {/* Next page */}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold text-slate-200 transition-colors"
                >
                  <span>{t('catalog.paginationNext')}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>

                {/* Last page */}
                <button
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 transition-colors"
                  title={language === 'it' ? 'Ultima pagina' : 'Last page'}
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          )}
        </>
      ) : (
        /* Empty State */
        <div className="py-16 text-center bg-slate-900/40 border border-slate-800/80 rounded-2xl p-8">
          <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-4">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">{t('catalog.noResultsTitle')}</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-6">
            {t('catalog.noResultsDesc')}
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              onSelectGenre('ALL');
              onSelectLetter('ALL');
              setShowFavoritesOnly(false);
              onSelectSystem('ALL');
            }}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            {t('catalog.allGames')}
          </button>
        </div>
      )}

    </section>
  );
};
