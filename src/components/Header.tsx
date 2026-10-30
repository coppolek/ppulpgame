import React from 'react';
import { Volume2, VolumeX, Upload, Heart, Sparkles, Languages } from 'lucide-react';
import { retroAudio } from '../audio/retroAudio';
import { useLanguage } from '../i18n/LanguageContext';

interface HeaderProps {
  favoritesCount: number;
  onOpenFavorites: () => void;
  onOpenUploadRom: () => void;
  onSelectSystem: (system: string) => void;
  onPlayFeatured: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  favoritesCount,
  onOpenFavorites,
  onOpenUploadRom,
  onSelectSystem,
  onPlayFeatured,
  isMuted,
  onToggleMute,
}) => {
  const { language, setLanguage, t } = useLanguage();

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 lg:gap-8">
        
        {/* Zone 1: Wordmark / Brand */}
        <div className="flex items-center gap-3 shrink-0">
          <button 
            onClick={() => onSelectSystem('ALL')}
            className="flex items-center gap-2 text-left group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 rounded-sm"
          >
            <div className="w-8 h-8 rounded bg-gradient-to-br from-rose-600 via-rose-500 to-amber-500 flex items-center justify-center shadow-lg shadow-rose-950/50">
              <span className="font-pixel text-[11px] text-white tracking-tighter">RG</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-pixel text-sm sm:text-base tracking-wider text-rose-500 group-hover:text-rose-400 transition-colors whitespace-nowrap">
                RETROGAMES<span className="text-amber-400">.CC</span>
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: Clean single-line text links */}
        <nav className="hidden lg:flex items-center gap-5 text-xs font-semibold tracking-wider uppercase text-slate-300">
          <button
            onClick={() => {
              retroAudio.playSelect();
              onSelectSystem('ALL');
            }}
            className="hover:text-rose-400 transition-colors whitespace-nowrap cursor-pointer"
          >
            {t('nav.all')}
          </button>
          <button
            onClick={() => {
              retroAudio.playSelect();
              onSelectSystem('ARCADE');
            }}
            className="hover:text-rose-400 transition-colors whitespace-nowrap cursor-pointer"
          >
            {t('nav.arcade')}
          </button>
          <button
            onClick={() => {
              retroAudio.playSelect();
              onSelectSystem('NES');
            }}
            className="hover:text-rose-400 transition-colors whitespace-nowrap cursor-pointer"
          >
            NES
          </button>
          <button
            onClick={() => {
              retroAudio.playSelect();
              onSelectSystem('SNES');
            }}
            className="hover:text-rose-400 transition-colors whitespace-nowrap cursor-pointer"
          >
            SNES
          </button>
          <button
            onClick={() => {
              retroAudio.playSelect();
              onSelectSystem('GBA');
            }}
            className="hover:text-rose-400 transition-colors whitespace-nowrap cursor-pointer"
          >
            GBA
          </button>
          <button
            onClick={() => {
              retroAudio.playSelect();
              onSelectSystem('N64');
            }}
            className="hover:text-rose-400 transition-colors whitespace-nowrap cursor-pointer"
          >
            N64
          </button>
          <button
            onClick={() => {
              retroAudio.playSelect();
              onSelectSystem('NDS');
            }}
            className="hover:text-rose-400 transition-colors whitespace-nowrap cursor-pointer"
          >
            NDS
          </button>
          <button
            onClick={() => {
              retroAudio.playSelect();
              onSelectSystem('GENESIS');
            }}
            className="hover:text-rose-400 transition-colors whitespace-nowrap cursor-pointer"
          >
            Genesis
          </button>
          <button
            onClick={() => {
              retroAudio.playSelect();
              onSelectSystem('PS1');
            }}
            className="hover:text-rose-400 transition-colors whitespace-nowrap cursor-pointer"
          >
            PS1
          </button>
          <button
            onClick={() => {
              retroAudio.playSelect();
              onSelectSystem('HACKS');
            }}
            className="text-amber-400 hover:text-amber-300 font-bold transition-colors whitespace-nowrap cursor-pointer"
          >
            {t('nav.hacks')}
          </button>
        </nav>

        {/* Zone 3: Language Selector + Utilities + Primary Action */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          
          {/* Language Switcher (IT / EN) */}
          <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded-lg p-0.5 text-xs font-mono font-bold shadow-inner">
            <button
              onClick={() => {
                retroAudio.playSelect();
                setLanguage('it');
              }}
              className={`px-2 py-1 rounded transition-all cursor-pointer flex items-center gap-1 ${
                language === 'it'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Passa a Italiano"
              aria-label="Lingua Italiana"
            >
              <span>🇮🇹</span>
              <span className="text-[11px]">IT</span>
            </button>
            <button
              onClick={() => {
                retroAudio.playSelect();
                setLanguage('en');
              }}
              className={`px-2 py-1 rounded transition-all cursor-pointer flex items-center gap-1 ${
                language === 'en'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Switch to English"
              aria-label="English Language"
            >
              <span>🇬🇧</span>
              <span className="text-[11px]">EN</span>
            </button>
          </div>

          {/* Mute Button */}
          <button
            onClick={() => {
              onToggleMute();
              retroAudio.playSelect();
            }}
            title={isMuted ? t('header.unmute') : t('header.mute')}
            className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            aria-label="Toggle Audio"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* Favorites */}
          <button
            onClick={() => {
              retroAudio.playSelect();
              onOpenFavorites();
            }}
            className="relative p-2 text-slate-300 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
            title={t('header.favorites')}
          >
            <Heart className="w-4 h-4 text-rose-500 fill-rose-500/20" />
            {favoritesCount > 0 && (
              <span className="font-mono text-xs font-bold text-rose-400 tabular-nums">
                {favoritesCount}
              </span>
            )}
          </button>

          {/* Upload ROM */}
          <button
            onClick={() => {
              retroAudio.playSelect();
              onOpenUploadRom();
            }}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800/90 hover:bg-slate-700 hover:text-white border border-slate-700 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-sky-400" />
            <span>{t('header.uploadRom')}</span>
          </button>

          {/* Primary Action: Gioca Subito */}
          <button
            onClick={() => {
              retroAudio.playStartChime();
              onPlayFeatured();
            }}
            className="flex items-center gap-2 px-3.5 sm:px-4 py-2 text-xs font-bold uppercase tracking-wider text-white bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 rounded-lg shadow-md shadow-rose-950/60 hover:shadow-rose-900/80 transition-all transform active:scale-95 whitespace-nowrap cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span>{t('header.featured')}</span>
          </button>
        </div>

      </div>
    </header>
  );
};
