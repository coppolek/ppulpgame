import React, { useState } from 'react';
import { Play, Heart, Star, Users, Globe, Link2, Check } from 'lucide-react';
import { RetroGame } from '../types/game';
import { retroAudio } from '../audio/retroAudio';
import { getGameQueryUrl, getGameShareUrl, copyTextToClipboard } from '../utils/urlHelper';
import { useLanguage } from '../i18n/LanguageContext';

interface GameCardProps {
  game: RetroGame;
  isFavorite: boolean;
  onToggleFavorite: (gameId: string) => void;
  onPlay: (game: RetroGame) => void;
}

export const GameCard: React.FC<GameCardProps> = ({
  game,
  isFavorite,
  onToggleFavorite,
  onPlay,
}) => {
  const [imageError, setImageError] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const { t } = useLanguage();

  const gameUrl = getGameQueryUrl(game.id);

  const handleCardClick = (e: React.MouseEvent) => {
    // If standard left click without modifier keys, use client-side fast route
    if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
      e.preventDefault();
      retroAudio.playStartChime();
      onPlay(game);
    }
  };

  const handleCopyLink = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const fullUrl = getGameShareUrl(game.id);
    copyTextToClipboard(fullUrl).then(() => {
      setIsCopied(true);
      retroAudio.playCoin();
      setTimeout(() => setIsCopied(false), 2200);
    });
  };

  return (
    <div className="group relative flex flex-col bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 rounded-xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-black/60 transition-all duration-200">
      
      {/* Thumbnail Cartridge Screen */}
      <div className="relative aspect-4/3 w-full overflow-hidden bg-slate-950 flex items-center justify-center">
        
        {/* Cover Image from RetroGames.cc or High-Res Artwork */}
        {game.coverImage && !imageError ? (
          <img
            src={game.coverImage}
            alt={game.title}
            referrerPolicy="no-referrer"
            loading="lazy"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          /* Procedural Pixel Game Screen Fallback Container */
          <div 
            className="absolute inset-0 flex flex-col items-center justify-center p-4 transition-transform duration-300 group-hover:scale-105"
            style={{
              background: `linear-gradient(135deg, ${game.coverAccent}25 0%, #020617 100%)`,
            }}
          >
            <div 
              className="w-16 h-16 rounded-lg flex items-center justify-center shadow-inner border"
              style={{
                borderColor: `${game.coverAccent}66`,
                backgroundColor: `${game.coverAccent}15`,
              }}
            >
              <span 
                className="font-pixel text-xl tracking-tighter"
                style={{ color: game.coverAccent }}
              >
                {game.title.slice(0, 2).toUpperCase()}
              </span>
            </div>

            <div className="mt-2 text-center">
              <span className="font-pixel text-[9px] tracking-wider text-slate-300">
                {game.system}
              </span>
            </div>
          </div>
        )}

        {/* Scanlines Effect */}
        <div className="absolute inset-0 crt-scanlines opacity-40 pointer-events-none" />

        {/* System Tag (Top-Left) */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
          <span className="px-2 py-0.5 rounded bg-slate-950/85 backdrop-blur-md border border-slate-700/60 text-[10px] font-mono font-bold text-slate-200 tracking-wider">
            {game.system}
          </span>
          {game.iframeUrl && (
            <span className="px-1.5 py-0.5 rounded bg-rose-600/85 backdrop-blur-md text-[9px] font-mono font-bold text-white tracking-tighter flex items-center gap-1" title={t('card.officialIframe')}>
              <Globe className="w-2.5 h-2.5" />
              <span>IFRAME</span>
            </span>
          )}
        </div>

        {/* Top-Right Action Buttons: Copy Link & Favorite */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-20">
          {/* Copy Direct Game Link Button */}
          <button
            onClick={handleCopyLink}
            className={`p-1.5 sm:p-2 rounded-lg backdrop-blur-md transition-all cursor-pointer ${
              isCopied
                ? 'bg-emerald-500/80 text-white'
                : 'bg-slate-900/70 text-slate-300 hover:text-white hover:bg-slate-800/90'
            }`}
            title={isCopied ? t('card.linkCopied') : t('card.copyLinkTitle')}
            aria-label="Copia link"
          >
            {isCopied ? (
              <Check className="w-3.5 h-3.5 text-white" />
            ) : (
              <Link2 className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Favorite Heart Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              retroAudio.playSelect();
              onToggleFavorite(game.id);
            }}
            className={`p-1.5 sm:p-2 rounded-lg backdrop-blur-md transition-colors cursor-pointer ${
              isFavorite
                ? 'bg-rose-500/30 text-rose-400 hover:bg-rose-500/40'
                : 'bg-slate-900/70 text-slate-400 hover:text-white hover:bg-slate-800/90'
            }`}
            title={isFavorite ? t('card.removeFavorite') : t('card.addFavorite')}
            aria-label="Toggle Favorite"
          >
            <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
          </button>
        </div>

        {/* Copied Feedback Banner */}
        {isCopied && (
          <div className="absolute bottom-2 inset-x-2 z-20 py-1 px-2 rounded bg-emerald-600/90 backdrop-blur-md text-center text-[10px] font-bold text-white shadow-lg animate-in fade-in">
            {t('card.linkCopied')}
          </div>
        )}

        {/* Hover Play Button Overlay with Native Anchor */}
        <a
          href={gameUrl}
          onClick={handleCardClick}
          className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10 cursor-pointer"
        >
          <div className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-lg shadow-rose-950 transition-transform active:scale-95">
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>{t('card.playIframe')}</span>
          </div>
        </a>

      </div>

      {/* Card Body */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-3">
        <div>
          <a
            href={gameUrl}
            onClick={handleCardClick}
            className="font-bold text-slate-100 group-hover:text-rose-400 text-base leading-snug transition-colors cursor-pointer line-clamp-1 block"
            title={game.title}
          >
            {game.title}
          </a>

          {/* Clean Unboxed Metadata with · separator */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
            <span>{game.genre}</span>
            <span aria-hidden="true">·</span>
            <span>{game.developer}</span>
            <span aria-hidden="true">·</span>
            <span>{game.year}</span>
          </div>

          <p className="text-xs text-slate-400 line-clamp-2 mt-2 leading-relaxed">
            {game.description}
          </p>
        </div>

        {/* Footer info: Rating, Plays and Direct Link Indicator */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
          <div className="flex items-center gap-1 text-amber-400 font-semibold font-mono tabular-nums">
            <Star className="w-3.5 h-3.5 fill-amber-400" />
            <span>{game.rating.toFixed(1)}</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-slate-400 font-mono tabular-nums">
              <Users className="w-3 h-3 text-slate-500" />
              <span>{t('card.plays', { count: (game.playsCount / 1000).toFixed(0) })}</span>
            </div>

            <button
              onClick={handleCopyLink}
              className="text-[11px] text-slate-400 hover:text-rose-400 flex items-center gap-1 font-mono transition-colors cursor-pointer"
              title={t('card.copyLinkTitle')}
            >
              <Link2 className="w-3 h-3" />
              <span>{t('card.copyLink')}</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
