import React from 'react';
import { X, Heart, Play, Trash2, Download, Link2 } from 'lucide-react';
import { RetroGame } from '../types/game';
import { retroAudio } from '../audio/retroAudio';
import { useLanguage } from '../i18n/LanguageContext';

interface FavoritesModalProps {
  isOpen: boolean;
  onClose: () => void;
  favorites: string[];
  games: RetroGame[];
  onRemoveFavorite: (gameId: string) => void;
  onPlayGame: (game: RetroGame) => void;
}

export const FavoritesModal: React.FC<FavoritesModalProps> = ({
  isOpen,
  onClose,
  favorites,
  games,
  onRemoveFavorite,
  onPlayGame,
}) => {
  const { t } = useLanguage();
  if (!isOpen) return null;

  const favGames = games.filter(g => favorites.includes(g.id));

  // Export all local save data
  const handleExportData = () => {
    const backup: Record<string, any> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('retrogames_')) {
        backup[key] = localStorage.getItem(key);
      }
    }
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `retrogames-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    retroAudio.playCoin();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative">
        
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
            <Heart className="w-5 h-5 fill-rose-500/30" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{t('modal.favoritesTitle')}</h3>
            <p className="text-xs text-slate-400">{t('modal.favoritesCount', { count: favGames.length })}</p>
          </div>
        </div>

        {favGames.length > 0 ? (
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {favGames.map(game => (
              <div
                key={game.id}
                className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center font-pixel text-xs font-bold border"
                    style={{
                      backgroundColor: `${game.coverAccent}15`,
                      borderColor: `${game.coverAccent}50`,
                      color: game.coverAccent,
                    }}
                  >
                    {game.title.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white leading-tight">{game.title}</h4>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                      <span>{game.system}</span>
                      <span>·</span>
                      <span>{game.genre}</span>
                      <span>·</span>
                      <span>★ {game.rating.toFixed(1)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const fullUrl = `${window.location.origin}${window.location.pathname}?game=${encodeURIComponent(game.id)}`;
                      navigator.clipboard.writeText(fullUrl);
                      retroAudio.playCoin();
                    }}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                    title={t('modal.copyGameLink')}
                  >
                    <Link2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      retroAudio.playStartChime();
                      onPlayGame(game);
                      onClose();
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>{t('modal.play')}</span>
                  </button>

                  <button
                    onClick={() => {
                      retroAudio.playSelect();
                      onRemoveFavorite(game.id);
                    }}
                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                    title={t('modal.remove')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-slate-400">
            {t('modal.noFavorites')}
          </div>
        )}

        {/* Footer Backup tools */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
          <button
            onClick={handleExportData}
            className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t('modal.exportBackup')}</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold cursor-pointer"
          >
            {t('modal.close')}
          </button>
        </div>

      </div>
    </div>
  );
};
