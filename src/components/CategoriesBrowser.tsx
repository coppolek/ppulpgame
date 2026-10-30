import React, { useState } from 'react';
import { 
  Tv, Disc, Smartphone, Radio, Zap, Flame, Shield, 
  Gamepad2, Cpu, Sparkles, Filter, ChevronRight, Layers, Tag
} from 'lucide-react';
import { RetroSystem, RetroGenre, HardwareManufacturer } from '../types/game';
import { ALL_RETRO_SYSTEMS } from '../data/gamesCatalog';
import { retroAudio } from '../audio/retroAudio';
import { useLanguage } from '../i18n/LanguageContext';
import { TranslationKey } from '../i18n/translations';

interface CategoriesBrowserProps {
  selectedSystem: RetroSystem;
  selectedGenre: RetroGenre;
  selectedLetter: string;
  onSelectSystem: (system: RetroSystem) => void;
  onSelectGenre: (genre: RetroGenre) => void;
  onSelectLetter: (letter: string) => void;
  gamesCountBySystem: Record<string, number>;
  gamesCountByGenre: Record<string, number>;
}

const MANUFACTURERS: HardwareManufacturer[] = [
  'Nintendo',
  'Sega',
  'Sony',
  'Arcade',
  'Atari',
  'SNK / NEC',
  'Community Hacks',
];

const GENRES_KEYS: { id: RetroGenre; key: TranslationKey }[] = [
  { id: 'ALL', key: 'genre.all' },
  { id: 'Platformer', key: 'genre.platformer' },
  { id: 'Action', key: 'genre.action' },
  { id: 'Shooter', key: 'genre.shooter' },
  { id: 'Fighting', key: 'genre.fighting' },
  { id: 'RPG', key: 'genre.rpg' },
  { id: 'Racing', key: 'genre.racing' },
  { id: 'Puzzle', key: 'genre.puzzle' },
  { id: 'Sports', key: 'genre.sports' },
  { id: 'Hack', key: 'genre.hack' },
];

const ALPHABET = ['ALL', '#', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')];

export const CategoriesBrowser: React.FC<CategoriesBrowserProps> = ({
  selectedSystem,
  selectedGenre,
  selectedLetter,
  onSelectSystem,
  onSelectGenre,
  onSelectLetter,
  gamesCountBySystem,
  gamesCountByGenre,
}) => {
  const [activeTab, setActiveTab] = useState<'systems' | 'genres' | 'atoz'>('systems');
  const [selectedManufacturer, setSelectedManufacturer] = useState<string>('ALL');
  const { t, language } = useLanguage();

  return (
    <section className="bg-slate-900/90 border-y border-slate-800 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-rose-500 font-mono text-xs font-bold uppercase tracking-wider mb-1">
              <Layers className="w-4 h-4" />
              <span>{t('categories.badge')}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {t('categories.title')}
            </h2>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-xl">
            <button
              onClick={() => {
                retroAudio.playSelect();
                setActiveTab('systems');
              }}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                activeTab === 'systems' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t('categories.tabSystems')} ({ALL_RETRO_SYSTEMS.length})
            </button>

            <button
              onClick={() => {
                retroAudio.playSelect();
                setActiveTab('genres');
              }}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                activeTab === 'genres' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t('categories.tabGenres')} ({GENRES_KEYS.length - 1})
            </button>

            <button
              onClick={() => {
                retroAudio.playSelect();
                setActiveTab('atoz');
              }}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                activeTab === 'atoz' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t('categories.tabAtoz')}
            </button>
          </div>
        </div>

        {/* 1. Systems & Consoles Grid View */}
        {activeTab === 'systems' && (
          <div className="space-y-6">
            {/* Manufacturer filter chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
              <span className="text-slate-500 font-mono text-[11px] uppercase mr-1 shrink-0">
                {t('categories.manufacturer')}
              </span>
              <button
                onClick={() => {
                  retroAudio.playSelect();
                  setSelectedManufacturer('ALL');
                }}
                className={`px-3 py-1.5 rounded-lg border font-medium whitespace-nowrap cursor-pointer transition-colors ${
                  selectedManufacturer === 'ALL'
                    ? 'bg-slate-100 text-slate-900 border-slate-100 font-semibold'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
                }`}
              >
                {t('categories.allManufacturers')}
              </button>
              {MANUFACTURERS.map(mfg => (
                <button
                  key={mfg}
                  onClick={() => {
                    retroAudio.playSelect();
                    setSelectedManufacturer(mfg);
                  }}
                  className={`px-3 py-1.5 rounded-lg border font-medium whitespace-nowrap cursor-pointer transition-colors ${
                    selectedManufacturer === mfg
                      ? 'bg-slate-100 text-slate-900 border-slate-100 font-semibold'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {mfg}
                </button>
              ))}
            </div>

            {/* Systems Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
              {ALL_RETRO_SYSTEMS.filter(s => selectedManufacturer === 'ALL' || s.manufacturer === selectedManufacturer).map(sys => {
                const count = gamesCountBySystem[sys.id] || 0;
                const isSelected = selectedSystem === sys.id;

                return (
                  <button
                    key={sys.id}
                    onClick={() => {
                      retroAudio.playSelect();
                      onSelectSystem(isSelected ? 'ALL' : sys.id);
                    }}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer group flex flex-col justify-between ${
                      isSelected
                        ? 'bg-rose-950/40 border-rose-500 shadow-md ring-1 ring-rose-500/50'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-950'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span 
                          className="font-pixel text-[10px] tracking-wider font-bold"
                          style={{ color: sys.accentColor }}
                        >
                          {sys.shortName}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                          {sys.yearIntroduced}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-white group-hover:text-rose-400 transition-colors leading-snug line-clamp-1">
                        {sys.name}
                      </h4>

                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {sys.description}
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                      <span className="text-[11px]">{sys.era}</span>
                      <span className="font-mono font-bold text-rose-400">
                        {count === 1 
                          ? t('categories.singleGameCount')
                          : t('categories.gamesCount', { count })}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. Genres & Themes Grid */}
        {activeTab === 'genres' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {GENRES_KEYS.map(g => {
              const count = g.id === 'ALL' ? Object.values(gamesCountByGenre).reduce((a, b) => a + b, 0) : (gamesCountByGenre[g.id] || 0);
              const isSelected = selectedGenre === g.id;

              return (
                <button
                  key={g.id}
                  onClick={() => {
                    retroAudio.playSelect();
                    onSelectGenre(g.id);
                  }}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-rose-950/40 border-rose-500 shadow-md ring-1 ring-rose-500/50'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-950'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Tag className={`w-4 h-4 ${isSelected ? 'text-rose-400' : 'text-slate-400'}`} />
                    <span className="font-mono text-xs font-bold text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      {count}
                    </span>
                  </div>

                  <div className="font-bold text-sm text-slate-100 leading-tight">
                    {t(g.key)}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* 3. A-Z Alphabetical Directory (Iconic RetroGames.cc feature) */}
        {activeTab === 'atoz' && (
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-bold text-white uppercase tracking-wider">
                {language === 'it' ? 'Indice Alfabetico Titoli (Directory A-Z)' : 'A-Z Title Directory'}
              </span>
              <span>{language === 'it' ? 'Filtra i titoli per lettera iniziale' : 'Filter titles by initial letter'}</span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {ALPHABET.map(letter => {
                const isSelected = selectedLetter === letter;
                return (
                  <button
                    key={letter}
                    onClick={() => {
                      retroAudio.playSelect();
                      onSelectLetter(letter);
                    }}
                    className={`w-9 h-9 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                      isSelected
                        ? 'bg-rose-600 text-white shadow-md shadow-rose-950'
                        : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    {letter}
                  </button>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </section>
  );
};
