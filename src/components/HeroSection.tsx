import React from 'react';
import { Play, Sparkles, Tv, ShieldCheck, Zap, HardDrive } from 'lucide-react';
import { RetroGame } from '../types/game';
import { retroAudio } from '../audio/retroAudio';
import { useLanguage } from '../i18n/LanguageContext';

interface HeroSectionProps {
  featuredGame: RetroGame;
  onPlayGame: (game: RetroGame) => void;
  onOpenUploadRom: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  featuredGame,
  onPlayGame,
  onOpenUploadRom,
}) => {
  const { t } = useLanguage();

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 border-b border-slate-800/80 pt-8 pb-12">
      {/* Background Retro Grid Matrix Subtle Glow */}
      <div 
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to right, #334155 1px, transparent 1px), linear-gradient(to bottom, #334155 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Heading, Pitch & CTAs */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Editorial Title */}
            <div className="space-y-3">
              <div className="text-xs font-mono font-semibold tracking-widest uppercase text-rose-400">
                {t('hero.badge')}
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight text-balance leading-tight">
                {t('hero.title')}
              </h1>
              <p className="text-base text-slate-300 max-w-2xl leading-relaxed">
                {t('hero.description', { count: '29.500' })}
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-4 pt-1">
              <a
                href={`?game=${encodeURIComponent(featuredGame.id)}`}
                onClick={(e) => {
                  if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                    e.preventDefault();
                    retroAudio.playStartChime();
                    onPlayGame(featuredGame);
                  }
                }}
                className="flex items-center gap-2.5 px-6 py-3.5 bg-rose-600 hover:bg-rose-500 text-white text-sm font-bold uppercase tracking-wider rounded-lg shadow-lg shadow-rose-950/80 hover:shadow-rose-900/90 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>{t('hero.playNow', { title: featuredGame.title })}</span>
              </a>

              <button
                onClick={() => {
                  retroAudio.playSelect();
                  onOpenUploadRom();
                }}
                className="flex items-center gap-2 px-5 py-3.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-sm font-semibold rounded-lg transition-colors cursor-pointer"
              >
                <HardDrive className="w-4 h-4 text-sky-400" />
                <span>{t('hero.uploadRom')}</span>
              </button>
            </div>

            {/* Platform Highlights (Clean unboxed metadata) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-800/60 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Tv className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{t('hero.featureCrt')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{t('hero.featureSaves')}</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{t('hero.featureController')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-sky-400 shrink-0" />
                <span>{t('hero.featureCheats')}</span>
              </div>
            </div>

          </div>

          {/* Right Column: Featured CRT Cabinet Showcase */}
          <div className="lg:col-span-5">
            <div className="relative mx-auto max-w-md lg:max-w-none rounded-2xl bg-gradient-to-b from-slate-800/70 to-slate-900/90 p-4 border border-slate-700/60 shadow-2xl shadow-black/80">
              
              {/* Header inside Cabinet frame */}
              <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-700/50 text-xs">
                <div className="flex items-center gap-2 font-mono text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  <span className="font-semibold uppercase">{t('hero.featuredOfDay')}</span>
                </div>
                <div className="text-amber-400 font-pixel text-[10px]">
                  ★ 4.9 / 5.0
                </div>
              </div>

              {/* CRT Simulation Screen */}
              <div className="relative overflow-hidden rounded-xl border-4 border-slate-950 bg-black aspect-4/3 flex items-center justify-center group">
                
                {/* Cover Art / Scene Simulation */}
                {featuredGame.coverImage ? (
                  <img
                    src={featuredGame.coverImage}
                    alt={featuredGame.title}
                    referrerPolicy="no-referrer"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-[#5c94fc] flex flex-col justify-between p-4">
                    {/* Retro Clouds & Score */}
                    <div className="flex justify-between items-start">
                      <div className="font-pixel text-[9px] text-white space-y-0.5">
                        <div>MARIO</div>
                        <div className="text-amber-300">014250</div>
                      </div>
                      <div className="font-pixel text-[9px] text-white">
                        WORLD 1-1
                      </div>
                      <div className="font-pixel text-[9px] text-white">
                        TIME 368
                      </div>
                    </div>

                    {/* Pixel scene center */}
                    <div className="relative h-28 w-full flex items-end justify-center">
                      <div className="absolute bottom-16 flex gap-1">
                        <div className="w-7 h-7 bg-[#d04800] border border-black" />
                        <div className="w-7 h-7 bg-[#fcb040] border border-[#884400] flex items-center justify-center font-pixel text-xs text-white">?</div>
                        <div className="w-7 h-7 bg-[#d04800] border border-black" />
                        <div className="w-7 h-7 bg-[#fcb040] border border-[#884400] flex items-center justify-center font-pixel text-xs text-white">?</div>
                      </div>

                      <div className="absolute right-8 bottom-0 w-12 h-14 bg-[#00a800] border-2 border-[#005000]" />

                      <div className="absolute left-16 bottom-0 flex flex-col items-center">
                        <div className="w-6 h-4 bg-[#e52521] rounded-t-sm" />
                        <div className="w-5 h-4 bg-[#fcd8a8]" />
                        <div className="w-6 h-6 bg-[#0024f8]" />
                      </div>

                      <div className="absolute left-40 bottom-0 w-6 h-6 bg-[#a84000] rounded-t-lg" />
                    </div>

                    <div className="h-6 w-full bg-[#d04800] border-t-2 border-black -mx-4 -mb-4 flex items-center justify-center">
                      <span className="font-pixel text-[8px] text-amber-200">{t('hero.pressStart')}</span>
                    </div>
                  </div>
                )}

                {/* CRT Scanline Filter Overlay */}
                <div className="absolute inset-0 crt-scanlines opacity-75 pointer-events-none" />

                {/* Play Button Overlay */}
                <a
                  href={`?game=${encodeURIComponent(featuredGame.id)}`}
                  onClick={(e) => {
                    if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                      e.preventDefault();
                      retroAudio.playStartChime();
                      onPlayGame(featuredGame);
                    }
                  }}
                  className="relative z-10 p-5 rounded-full bg-rose-600/90 text-white shadow-xl shadow-rose-950 hover:bg-rose-500 hover:scale-110 transition-all cursor-pointer group-hover:ring-4 group-hover:ring-rose-500/30 inline-flex items-center justify-center"
                  aria-label={`Avvia ${featuredGame.title}`}
                >
                  <Play className="w-8 h-8 fill-white ml-0.5" />
                </a>
              </div>

              {/* Game Info Bottom Strip */}
              <div className="mt-3.5 flex items-center justify-between text-xs text-slate-300">
                <div>
                  <h3 className="font-bold text-white text-sm">{featuredGame.title}</h3>
                  <div className="flex items-center gap-2 text-slate-400 text-[11px] mt-0.5">
                    <span>{featuredGame.system}</span>
                    <span>·</span>
                    <span>{featuredGame.genre}</span>
                    <span>·</span>
                    <span>{featuredGame.year}</span>
                  </div>
                </div>
                <div className="font-mono text-xs text-emerald-400 font-semibold tabular-nums">
                  142.5k Giocate
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
