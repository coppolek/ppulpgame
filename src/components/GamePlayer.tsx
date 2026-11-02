import React, { useEffect, useRef, useState } from 'react';
import { 
  ArrowLeft, Play, Pause, RotateCcw, Camera, Maximize, 
  Volume2, VolumeX, Save, Download, Settings, Flame, 
  Tv, Sparkles, Check, ChevronRight, Zap, Copy, Globe, Terminal, Heart,
  Link2, ExternalLink
} from 'lucide-react';
import { RetroGame, CrtFilter, SaveStateSnapshot, ControllerMapping } from '../types/game';
import { getEngineInstance } from '../games/engineFactory';
import { RetroEngineInstance, EngineStats } from '../games/engineTypes';
import { retroAudio } from '../audio/retroAudio';
import { VirtualGamepad } from './VirtualGamepad';
import { RomFileInfo } from '../games/customRomEngine';
import { getGameShareUrl, getRetroGamesDetailUrl, copyTextToClipboard } from '../utils/urlHelper';
import { useLanguage } from '../i18n/LanguageContext';

interface GamePlayerProps {
  game: RetroGame;
  customRomInfo?: RomFileInfo | null;
  onBack: () => void;
}

const DEFAULT_KEY_MAP: ControllerMapping = {
  up: 'ArrowUp',
  down: 'ArrowDown',
  left: 'ArrowLeft',
  right: 'ArrowRight',
  a: 'KeyZ',
  b: 'KeyX',
  x: 'KeyA',
  y: 'KeyS',
  start: 'Enter',
  select: 'ShiftRight',
  turboA: 'KeyC',
  turboB: 'Space',
};

export const GamePlayer: React.FC<GamePlayerProps> = ({
  game,
  customRomInfo,
  onBack,
}) => {
  const { t, language } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const engineRef = useRef<RetroEngineInstance | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Play Mode: 'iframe' (Official RetroGames.cc Embed) vs 'canvas' (Offline Native Engine)
  const [playMode, setPlayMode] = useState<'iframe' | 'canvas'>(
    game.iframeUrl ? 'iframe' : 'canvas'
  );
  const [iframeLoaded, setIframeLoaded] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const [crtFilter, setCrtFilter] = useState<CrtFilter>('scanlines');
  const [isTurbo, setIsTurbo] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [stats, setStats] = useState<EngineStats>({
    score: 0,
    lives: 3,
    level: 1,
    gameOver: false,
    win: false,
    isPaused: false,
    highScore: 0,
  });

  const [activeTab, setActiveTab] = useState<'embed' | 'controls' | 'cheats' | 'saves' | 'story'>('embed');
  const [saveSlots, setSaveSlots] = useState<Record<number, SaveStateSnapshot>>({});
  const [cheats, setCheats] = useState(game.cheats || []);
  const [keyMap, setKeyMap] = useState<ControllerMapping>(() => {
    const saved = localStorage.getItem('retrogames_keymap');
    return saved ? JSON.parse(saved) : DEFAULT_KEY_MAP;
  });

  const [activeKeys, setActiveKeys] = useState<Record<string, boolean>>({
    up: false,
    down: false,
    left: false,
    right: false,
    a: false,
    b: false,
    x: false,
    y: false,
    start: false,
    select: false,
    turboA: false,
    turboB: false,
  });

  const [showRemapModal, setShowRemapModal] = useState<boolean>(false);
  const [remapTarget, setRemapTarget] = useState<keyof ControllerMapping | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const [isLinkCopied, setIsLinkCopied] = useState<boolean>(false);
  const gameDirectUrl = getGameShareUrl(game.id);
  const retroGamesDetailUrl = getRetroGamesDetailUrl(game);

  // Embed code snippet generator (exact match from user screenshot)
  const embedCodeSnippet = `<iframe src="${game.iframeUrl || `https://www.retrogames.cc/embed/${game.id}.html`}" width="600" height="450" frameborder="no" allowfullscreen="true" webkitallowfullscreen="true" mozallowfullscreen="true" scrolling="no" allow="cross-origin-isolated"></iframe>`;

  const handleCopyEmbedCode = () => {
    navigator.clipboard.writeText(embedCodeSnippet).then(() => {
      setIsCopied(true);
      retroAudio.playCoin();
      showToast('Codice Iframe copiato negli appunti!');
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const handleCopyDirectLink = () => {
    copyTextToClipboard(gameDirectUrl).then(() => {
      setIsLinkCopied(true);
      retroAudio.playCoin();
      showToast(t('player.toastLinkCopied'));
      setTimeout(() => setIsLinkCopied(false), 2200);
    });
  };

  // Load save states from LocalStorage for this game
  useEffect(() => {
    const raw = localStorage.getItem(`retrogames_saves_${game.id}`);
    if (raw) {
      try {
        setSaveSlots(JSON.parse(raw));
      } catch {}
    }
  }, [game.id]);

  // Initialize Canvas Game Engine if playMode === 'canvas'
  useEffect(() => {
    if (playMode !== 'canvas') {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    const engine = getEngineInstance(game.engineKey, customRomInfo);
    engineRef.current = engine;

    cheats.forEach(c => {
      engine.setCheat(c.id, c.enabled);
    });

    retroAudio.startChiptuneMusic(game.system === 'ARCADE' ? 'arcade' : 'action');

    return () => {
      retroAudio.stopChiptuneMusic();
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [game.id, game.engineKey, customRomInfo, playMode]);

  // Main 60FPS Game Loop for Canvas Engine
  useEffect(() => {
    if (playMode !== 'canvas') return;

    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = Math.min(32, time - lastTime);
      lastTime = time;

      // Poll Gamepad API
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      const gp = gamepads[0];
      const currentInputs = { ...activeKeys };

      if (gp) {
        if (gp.axes[1] < -0.4 || gp.buttons[12]?.pressed) currentInputs.up = true;
        if (gp.axes[1] > 0.4 || gp.buttons[13]?.pressed) currentInputs.down = true;
        if (gp.axes[0] < -0.4 || gp.buttons[14]?.pressed) currentInputs.left = true;
        if (gp.axes[0] > 0.4 || gp.buttons[15]?.pressed) currentInputs.right = true;
        if (gp.buttons[0]?.pressed) currentInputs.a = true;
        if (gp.buttons[1]?.pressed) currentInputs.b = true;
        if (gp.buttons[2]?.pressed) currentInputs.x = true;
        if (gp.buttons[3]?.pressed) currentInputs.y = true;
        if (gp.buttons[9]?.pressed) currentInputs.start = true;
        if (gp.buttons[8]?.pressed) currentInputs.select = true;
      }

      if (engineRef.current && canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          engineRef.current.update(currentInputs, dt);
          if (isTurbo) {
            engineRef.current.update(currentInputs, dt);
          }
          engineRef.current.render(ctx, canvasRef.current.width, canvasRef.current.height);
          setStats(engineRef.current.getStats());
        }
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [activeKeys, isTurbo, playMode]);

  // Keyboard Event Handlers for Canvas Mode
  useEffect(() => {
    if (playMode !== 'canvas') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (remapTarget) {
        e.preventDefault();
        setKeyMap(prev => {
          const next = { ...prev, [remapTarget]: e.code };
          localStorage.setItem('retrogames_keymap', JSON.stringify(next));
          return next;
        });
        setRemapTarget(null);
        retroAudio.playCoin();
        return;
      }

      if (e.code === 'KeyP') {
        togglePause();
        return;
      }
      if (e.code === 'F1') {
        e.preventDefault();
        handleSaveState(1);
        return;
      }
      if (e.code === 'F3') {
        e.preventDefault();
        handleLoadState(1);
        return;
      }

      const keys = { ...activeKeys };
      let matched = false;

      if (e.code === keyMap.up || e.code === 'KeyW' || e.code === 'ArrowUp') { keys.up = true; matched = true; }
      if (e.code === keyMap.down || e.code === 'KeyS' || e.code === 'ArrowDown') { keys.down = true; matched = true; }
      if (e.code === keyMap.left || e.code === 'KeyA' || e.code === 'ArrowLeft') { keys.left = true; matched = true; }
      if (e.code === keyMap.right || e.code === 'KeyD' || e.code === 'ArrowRight') { keys.right = true; matched = true; }

      if (e.code === keyMap.a || e.code === 'KeyJ' || e.code === 'KeyZ') { keys.a = true; matched = true; }
      if (e.code === keyMap.b || e.code === 'KeyK' || e.code === 'KeyX') { keys.b = true; matched = true; }
      if (e.code === keyMap.x || e.code === 'KeyU') { keys.x = true; matched = true; }
      if (e.code === keyMap.y || e.code === 'KeyI') { keys.y = true; matched = true; }
      if (e.code === keyMap.start || e.code === 'Enter') { keys.start = true; matched = true; }
      if (e.code === keyMap.select || e.code === 'ShiftRight' || e.code === 'Space') { keys.select = true; matched = true; }

      if (matched) {
        e.preventDefault();
        setActiveKeys(keys);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const keys = { ...activeKeys };
      if (e.code === keyMap.up || e.code === 'KeyW' || e.code === 'ArrowUp') keys.up = false;
      if (e.code === keyMap.down || e.code === 'KeyS' || e.code === 'ArrowDown') keys.down = false;
      if (e.code === keyMap.left || e.code === 'KeyA' || e.code === 'ArrowLeft') keys.left = false;
      if (e.code === keyMap.right || e.code === 'KeyD' || e.code === 'ArrowRight') keys.right = false;

      if (e.code === keyMap.a || e.code === 'KeyJ' || e.code === 'KeyZ') keys.a = false;
      if (e.code === keyMap.b || e.code === 'KeyK' || e.code === 'KeyX') keys.b = false;
      if (e.code === keyMap.x || e.code === 'KeyU') keys.x = false;
      if (e.code === keyMap.y || e.code === 'KeyI') keys.y = false;
      if (e.code === keyMap.start || e.code === 'Enter') keys.start = false;
      if (e.code === keyMap.select || e.code === 'ShiftRight' || e.code === 'Space') keys.select = false;

      setActiveKeys(keys);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [keyMap, activeKeys, remapTarget, playMode]);

  // Pause / Resume
  const togglePause = () => {
    if (engineRef.current) {
      const paused = engineRef.current.togglePause();
      setIsPaused(paused);
      retroAudio.playSelect();
      showToast(paused ? 'Gioco in Pausa' : 'Gioco Ripreso');
    }
  };

  // Reset Game
  const handleReset = () => {
    if (engineRef.current) {
      engineRef.current.reset();
      retroAudio.playSelect();
      showToast('Partita Reimpostata');
    }
  };

  // Save State
  const handleSaveState = (slot: number) => {
    if (!engineRef.current || !canvasRef.current) return;
    const stateData = engineRef.current.getState();
    const thumbnail = canvasRef.current.toDataURL('image/png', 0.6);
    const snapshot: SaveStateSnapshot = {
      id: `${game.id}_slot_${slot}`,
      gameId: game.id,
      slotNumber: slot,
      timestamp: Date.now(),
      thumbnail,
      score: stats.score,
      level: stats.level,
      stateData,
    };

    const nextSlots = { ...saveSlots, [slot]: snapshot };
    setSaveSlots(nextSlots);
    localStorage.setItem(`retrogames_saves_${game.id}`, JSON.stringify(nextSlots));
    retroAudio.playCoin();
    showToast(`Stato salvato nello Slot ${slot}`);
  };

  // Load State
  const handleLoadState = (slot: number) => {
    const snapshot = saveSlots[slot];
    if (!snapshot || !engineRef.current) {
      showToast(`Lo Slot ${slot} è vuoto!`);
      return;
    }
    engineRef.current.loadState(snapshot.stateData);
    retroAudio.playPowerUp();
    showToast(`Stato caricato dallo Slot ${slot}`);
  };

  // Download Screenshot
  const handleTakeScreenshot = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `${game.id}-retro-screenshot.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
    retroAudio.playCameraShutter();
    showToast('Screenshot salvato in PNG!');
  };

  // Toggle Fullscreen
  const handleToggleFullscreen = () => {
    if (containerRef.current) {
      if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  // Toggle Cheat
  const handleToggleCheat = (cheatId: string) => {
    setCheats(prev => {
      const next = prev.map(c => (c.id === cheatId ? { ...c, enabled: !c.enabled } : c));
      const target = next.find(c => c.id === cheatId);
      if (target && engineRef.current) {
        engineRef.current.setCheat(cheatId, target.enabled);
        retroAudio.playCoin();
        showToast(`Cheat ${target.name}: ${target.enabled ? 'ATTIVATO' : 'DISATTIVATO'}`);
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 px-4 py-2 bg-rose-600 text-white font-mono text-xs font-bold rounded-lg shadow-2xl border border-rose-400 flex items-center gap-2 animate-bounce">
          <Zap className="w-4 h-4 text-amber-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Strip */}
      <div className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <button
            onClick={() => {
              retroAudio.playSelect();
              onBack();
            }}
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('player.backToCatalog')}</span>
          </button>

          <div className="flex items-center gap-3">
            <span className="font-pixel text-xs text-rose-400">{game.title}</span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-300 border border-slate-700">
              {game.system}
            </span>
          </div>

          {/* Player Mode Switcher: Iframe Official vs Canvas Engine */}
          <div className="flex items-center gap-2">
            {game.iframeUrl && (
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                <button
                  onClick={() => {
                    retroAudio.playSelect();
                    setPlayMode('iframe');
                  }}
                  className={`px-3 py-1 rounded font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                    playMode === 'iframe'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>{t('player.iframeMode')}</span>
                </button>

                <button
                  onClick={() => {
                    retroAudio.playSelect();
                    setPlayMode('canvas');
                  }}
                  className={`px-3 py-1 rounded font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                    playMode === 'canvas'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>{t('player.canvasMode')}</span>
                </button>
              </div>
            )}

            {/* Copy Direct Game Link Button */}
            <button
              onClick={handleCopyDirectLink}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                isLinkCopied
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border-slate-700'
              }`}
              title={t('player.copyLink')}
            >
              {isLinkCopied ? <Check className="w-3.5 h-3.5 text-white" /> : <Link2 className="w-3.5 h-3.5 text-rose-400" />}
              <span className="hidden sm:inline">{isLinkCopied ? t('player.linkCopied') : t('player.copyLink')}</span>
            </button>

            <button
              onClick={() => {
                const muted = retroAudio.toggleMute();
                setIsMuted(muted);
              }}
              className="p-1.5 text-slate-400 hover:text-white rounded bg-slate-800"
              title={isMuted ? t('header.unmute') : t('header.mute')}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        
        {/* Main Emulator Stage Container */}
        <div 
          ref={containerRef}
          className="relative bg-slate-900 rounded-2xl border-2 border-slate-800 shadow-2xl overflow-hidden mb-6"
        >
          {/* Top Emulator Control Bar */}
          <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            
            {/* Status & Mode tag */}
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-mono text-[11px] text-slate-300 uppercase font-bold">
                {playMode === 'iframe' ? 'Puulp Online Iframe' : 'Puulp Canvas Engine Locale'}
              </span>
            </div>

            {/* Canvas specific controls: Pause, Reset, Turbo, States */}
            {playMode === 'canvas' && (
              <>
                <div className="flex items-center gap-2">
                  <button
                    onClick={togglePause}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors font-semibold cursor-pointer"
                  >
                    {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" /> : <Pause className="w-3.5 h-3.5 text-amber-400" />}
                    <span>{isPaused ? 'Riprendi' : 'Pausa'}</span>
                  </button>

                  <button
                    onClick={handleReset}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors font-semibold cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                    <span>Reset</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsTurbo(!isTurbo);
                      retroAudio.playSelect();
                      showToast(!isTurbo ? 'Velocità Turbo 2x ATTIVATA' : 'Velocità Normale');
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors font-semibold cursor-pointer ${
                      isTurbo
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    <Flame className={`w-3.5 h-3.5 ${isTurbo ? 'text-amber-400 fill-amber-400' : ''}`} />
                    <span>Turbo 2x</span>
                  </button>
                </div>

                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                  <span className="font-mono text-[10px] text-slate-500 px-2 uppercase font-bold">Stato:</span>
                  {[1, 2, 3, 4].map(slot => (
                    <div key={slot} className="flex items-center gap-0.5">
                      <button
                        onClick={() => handleSaveState(slot)}
                        className="px-2 py-1 text-[10px] font-mono font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded transition-colors cursor-pointer"
                        title={`Salva nello Slot ${slot} (F1)`}
                      >
                        S{slot}
                      </button>
                      <button
                        onClick={() => handleLoadState(slot)}
                        disabled={!saveSlots[slot]}
                        className={`px-2 py-1 text-[10px] font-mono font-bold rounded transition-colors cursor-pointer ${
                          saveSlots[slot]
                            ? 'bg-rose-600/30 text-rose-300 hover:bg-rose-600/50'
                            : 'bg-slate-800/40 text-slate-600 cursor-not-allowed'
                        }`}
                        title={`Carica Slot ${slot} (F3)`}
                      >
                        L{slot}
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Right Controls: Screenshot, Fullscreen */}
            <div className="flex items-center gap-2">
              {playMode === 'canvas' && (
                <div className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
                  <Tv className="w-3.5 h-3.5 text-rose-400" />
                  <select
                    value={crtFilter}
                    onChange={(e) => {
                      retroAudio.playSelect();
                      setCrtFilter(e.target.value as CrtFilter);
                    }}
                    className="bg-transparent text-xs text-slate-200 font-medium focus:outline-none cursor-pointer"
                  >
                    <option value="none" className="bg-slate-900">Pixel Pulito</option>
                    <option value="scanlines" className="bg-slate-900">Scanlines CRT</option>
                    <option value="curved" className="bg-slate-900">Tubo CRT Curvo</option>
                    <option value="gameboy" className="bg-slate-900">GameBoy Verde</option>
                    <option value="amber" className="bg-slate-900">Ambra Vintage</option>
                  </select>
                </div>
              )}

              {playMode === 'canvas' && (
                <button
                  onClick={handleTakeScreenshot}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="Salva Screenshot (PNG)"
                >
                  <Camera className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={handleToggleFullscreen}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold transition-colors cursor-pointer"
                title="Schermo Intero (Fullscreen come su RetroGames.cc)"
              >
                <Maximize className="w-3.5 h-3.5" />
                <span>FULLSCREEN</span>
              </button>
            </div>

          </div>

          {/* VIEWPORT: IFRAME OR CANVAS */}
          <div className="relative flex items-center justify-center p-2 sm:p-6 bg-black min-h-[460px]">
            
            {playMode === 'iframe' && game.iframeUrl ? (
              /* REAL RETROGAMES.CC IFRAME PLAYER */
              <div className="w-full max-w-[800px] aspect-4/3 relative rounded-xl overflow-hidden shadow-2xl bg-slate-950 border border-slate-800">
                <iframe
                  ref={iframeRef}
                  src={game.iframeUrl}
                  title={game.title}
                  width="100%"
                  height="100%"
                  frameBorder="no"
                  allowFullScreen={true}
                  scrolling="no"
                  allow="cross-origin-isolated; autoplay; gamepad; fullscreen"
                  onLoad={() => setIframeLoaded(true)}
                  className="w-full h-full block rounded-xl"
                />

                {!iframeLoaded && (
                  <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center gap-3">
                    <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
                    <span className="font-pixel text-xs text-rose-400">CARICAMENTO EMULATORE PUULP...</span>
                  </div>
                )}
              </div>
            ) : (
              /* NATIVE CRT CANVAS ENGINE */
              <div 
                className={`relative max-w-full overflow-hidden transition-all ${
                  crtFilter === 'curved' ? 'crt-curved ring-8 ring-slate-800' : 'rounded-lg'
                }`}
                style={{
                  filter: crtFilter === 'gameboy' 
                    ? 'sepia(1) hue-rotate(50deg) saturate(3) contrast(1.2)' 
                    : crtFilter === 'amber' 
                    ? 'sepia(1) hue-rotate(0deg) saturate(5) contrast(1.4)' 
                    : undefined,
                }}
              >
                <canvas
                  ref={canvasRef}
                  width={400}
                  height={300}
                  className="pixel-art block w-full max-w-[760px] aspect-4/3 bg-black shadow-2xl"
                />

                {(crtFilter === 'scanlines' || crtFilter === 'curved') && (
                  <div className="absolute inset-0 crt-scanlines opacity-55 pointer-events-none" />
                )}
              </div>
            )}

          </div>

          {/* Virtual Gamepad for Canvas Mode */}
          {playMode === 'canvas' && (
            <div className="bg-slate-950 p-4 border-t border-slate-800">
              <VirtualGamepad
                activeKeys={activeKeys}
                onPress={(key) => setActiveKeys(prev => ({ ...prev, [key]: true }))}
                onRelease={(key) => setActiveKeys(prev => ({ ...prev, [key]: false }))}
              />
            </div>
          )}

        </div>

        {/* Game Title & Cover Preview Bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6 flex flex-col sm:flex-row items-center gap-5">
          {/* Cover Art Image */}
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden border border-slate-700 shrink-0 bg-slate-950">
            {game.coverImage ? (
              <img
                src={game.coverImage}
                alt={game.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            ) : (
              <div 
                className="w-full h-full flex items-center justify-center font-pixel text-lg font-bold"
                style={{ backgroundColor: `${game.coverAccent}25`, color: game.coverAccent }}
              >
                {game.title.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>

          {/* Title & Stats */}
          <div className="flex-1 text-center sm:text-left space-y-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">{game.title}</h1>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-slate-400">
              <span className="font-mono text-rose-400 font-bold">{game.system}</span>
              <span>·</span>
              <span>{game.genre}</span>
              <span>·</span>
              <span>{game.developer} ({game.year})</span>
              <span>·</span>
              <span className="text-amber-400 font-mono font-bold">★ {game.rating.toFixed(1)} / 5.0</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
              {game.description}
            </p>
          </div>
        </div>

        {/* Detailed Tabs & Embed Code Container (Exact match to user's photo!) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          
          {/* Tab Navigation */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-4 mb-6 overflow-x-auto scrollbar-none">
            <button
              onClick={() => {
                retroAudio.playSelect();
                setActiveTab('embed');
              }}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'embed' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>{t('player.tabEmbed')}</span>
            </button>
            <button
              onClick={() => {
                retroAudio.playSelect();
                setActiveTab('controls');
              }}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'controls' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {t('player.tabControls')}
            </button>
            <button
              onClick={() => {
                retroAudio.playSelect();
                setActiveTab('cheats');
              }}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'cheats' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t('player.tabCheats')}</span>
            </button>
            <button
              onClick={() => {
                retroAudio.playSelect();
                setActiveTab('saves');
              }}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'saves' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {t('player.tabSaves')}
            </button>
            <button
              onClick={() => {
                retroAudio.playSelect();
                setActiveTab('story');
              }}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'story' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {t('player.tabStory')}
            </button>
          </div>

          {/* TAB: GAME LINK & EMBED CODE */}
          {activeTab === 'embed' && (
            <div className="space-y-6">
              {/* Sezione 1: Link Diretto del Gioco */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Link2 className="w-4 h-4 text-rose-400" />
                      <h4 className="font-bold text-white text-sm">{t('player.directLinkTitle')}</h4>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {t('player.directLinkDesc')}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={handleCopyDirectLink}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold tracking-wider uppercase transition-all shadow-md shadow-rose-950 cursor-pointer"
                    >
                      {isLinkCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span>{isLinkCopied ? t('player.linkCopied') : t('player.copyDirectLinkBtn')}</span>
                    </button>

                    <a
                      href={gameDirectUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 rounded-lg transition-colors cursor-pointer"
                      title={t('player.openNewTab')}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                {/* Direct Link Input Box */}
                <div className="relative">
                  <input
                    type="text"
                    readOnly
                    value={gameDirectUrl}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-lg font-mono text-xs text-rose-300 focus:outline-none focus:ring-1 focus:ring-rose-500 select-all"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-slate-400 font-mono">
                  <span>{t('player.gameUniqueId')} <strong className="text-slate-200">{game.id}</strong></span>
                  {game.iframeUrl && (
                    <a
                      href={retroGamesDetailUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-rose-400 transition-colors flex items-center gap-1 font-sans"
                    >
                      <span>{t('player.originalRetrogames')}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>

              {/* Sezione 2: Embed Code HTML (Iframe) */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-amber-400" />
                      <h4 className="font-bold text-white text-sm">{t('player.embedCodeTitle')}</h4>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {t('player.embedCodeDesc', { title: game.title })}
                    </p>
                  </div>

                  <button
                    onClick={handleCopyEmbedCode}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 rounded-lg text-xs font-bold tracking-wider uppercase transition-all cursor-pointer self-start sm:self-auto shrink-0"
                  >
                    {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{isCopied ? t('player.copied') : t('player.copyEmbedBtn')}</span>
                  </button>
                </div>

                {/* Textarea matching retrogames.cc style */}
                <div className="relative">
                  <textarea
                    readOnly
                    rows={3}
                    value={embedCodeSnippet}
                    onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                    className="w-full p-3.5 bg-slate-950 border border-slate-700 rounded-xl font-mono-code text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-slate-500">{t('player.iframeDirectUrl')}</span>{' '}
                    <span className="text-rose-400 font-mono select-all">
                      {game.iframeUrl || `https://www.retrogames.cc/embed/${game.id}.html`}
                    </span>
                  </div>
                  <span className="font-mono text-[11px] text-emerald-400 shrink-0">{t('player.standardSize')}</span>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Controlli */}
          {activeTab === 'controls' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white text-sm">{t('player.controlsTitle')}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {t('player.controlsDesc')}
                  </p>
                </div>
                <button
                  onClick={() => setShowRemapModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>{t('player.remapBtn')}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <div className="text-slate-400 text-[10px]">{t('player.movement')}</div>
                  <div className="text-rose-400 font-bold mt-1">Frecce / WASD</div>
                </div>
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <div className="text-slate-400 text-[10px]">{t('player.btnA')}</div>
                  <div className="text-amber-400 font-bold mt-1">{keyMap.a} (Z / Spazio)</div>
                </div>
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <div className="text-slate-400 text-[10px]">{t('player.btnB')}</div>
                  <div className="text-emerald-400 font-bold mt-1">{keyMap.b} (X)</div>
                </div>
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <div className="text-slate-400 text-[10px]">{t('player.startSelect')}</div>
                  <div className="text-sky-400 font-bold mt-1">Enter / Shift</div>
                </div>
              </div>

              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-2">
                <div className="font-bold text-white">{t('player.instructions')}: {game.title}</div>
                <ul className="list-disc list-inside space-y-1 text-slate-400">
                  {game.instructions.map((ins, i) => (
                    <li key={i}>{ins}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Tab 3: Cheats */}
          {activeTab === 'cheats' && (
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-white text-sm">{t('player.cheatsTitle')}</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  {t('player.cheatsDesc')}
                </p>
              </div>

              {cheats.length > 0 ? (
                <div className="space-y-3">
                  {cheats.map(cheat => (
                    <div
                      key={cheat.id}
                      onClick={() => handleToggleCheat(cheat.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        cheat.enabled
                          ? 'bg-rose-950/30 border-rose-500/50 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded flex items-center justify-center border ${
                          cheat.enabled ? 'bg-rose-600 border-rose-500 text-white' : 'border-slate-700 bg-slate-900'
                        }`}>
                          {cheat.enabled && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <div>
                          <div className="font-bold text-xs text-slate-200 flex items-center gap-2">
                            <span>{cheat.name}</span>
                            <span className="font-mono text-[10px] text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">
                              {cheat.code}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">{cheat.description}</div>
                        </div>
                      </div>

                      <div className={`text-xs font-mono font-bold ${cheat.enabled ? 'text-rose-400' : 'text-slate-600'}`}>
                        {cheat.enabled ? t('player.active') : t('player.inactive')}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500">{t('player.noCheats')}</p>
              )}
            </div>
          )}

          {/* Tab 4: Slot di Salvataggio */}
          {activeTab === 'saves' && (
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-white text-sm">{t('player.savesTitle')}</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  {t('player.savesDesc')}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(slot => {
                  const save = saveSlots[slot];
                  return (
                    <div key={slot} className="bg-slate-950 rounded-xl border border-slate-800 p-3 space-y-3">
                      <div className="flex items-center justify-between text-xs font-bold text-white">
                        <span>{t('player.slot', { num: slot })}</span>
                        {save ? (
                          <span className="text-[10px] text-emerald-400 font-mono">OK</span>
                        ) : (
                          <span className="text-[10px] text-slate-500 font-mono">{t('player.emptySlot')}</span>
                        )}
                      </div>

                      <div className="aspect-4/3 bg-slate-900 rounded-lg overflow-hidden border border-slate-800 flex items-center justify-center">
                        {save ? (
                          <img src={save.thumbnail} alt={`Slot ${slot}`} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[10px] font-mono text-slate-600">{t('player.emptySlot')}</span>
                        )}
                      </div>

                      {save && (
                        <div className="text-[11px] font-mono text-slate-400 space-y-0.5">
                          <div>Score: {save.score}</div>
                          <div>{new Date(save.timestamp).toLocaleTimeString()}</div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          onClick={() => handleSaveState(slot)}
                          className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-semibold cursor-pointer"
                        >
                          {t('player.saveBtn')}
                        </button>
                        <button
                          onClick={() => handleLoadState(slot)}
                          disabled={!save}
                          className={`px-2 py-1.5 rounded text-xs font-semibold cursor-pointer ${
                            save ? 'bg-rose-600 hover:bg-rose-500 text-white' : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                          }`}
                        >
                          {t('player.loadBtn')}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab 5: Storia e Lore */}
          {activeTab === 'story' && (
            <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
              <h4 className="font-bold text-white text-sm">{game.title} - {t('player.storyTitle')}</h4>
              <p>{game.story}</p>
              
              <div className="pt-4 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-[11px]">
                <div>
                  <span className="text-slate-500 block">Developer</span>
                  <span className="text-white font-bold">{game.developer}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Release Year</span>
                  <span className="text-white font-bold">{game.year}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Platform</span>
                  <span className="text-white font-bold">{game.system}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Genre</span>
                  <span className="text-white font-bold">{game.genre}</span>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Key Remapping Modal */}
      {showRemapModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Personalizza Configurazione Tasti</h3>
            <p className="text-xs text-slate-400 mb-4">
              Clicca su un pulsante e premi il nuovo tasto che desideri assegnare.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-6 font-mono text-xs">
              {(Object.keys(keyMap) as (keyof ControllerMapping)[]).map(key => (
                <div key={key} className="flex items-center justify-between p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-slate-400 uppercase">{key}:</span>
                  <button
                    onClick={() => setRemapTarget(key)}
                    className={`px-2.5 py-1 rounded text-xs font-bold cursor-pointer ${
                      remapTarget === key
                        ? 'bg-rose-600 text-white animate-pulse'
                        : 'bg-slate-800 text-amber-300 hover:bg-slate-700'
                    }`}
                  >
                    {remapTarget === key ? 'PREMI TASTO...' : keyMap[key]}
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setKeyMap(DEFAULT_KEY_MAP);
                  localStorage.removeItem('retrogames_keymap');
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Ripristina Default
              </button>
              <button
                onClick={() => setShowRemapModal(false)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg cursor-pointer"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
