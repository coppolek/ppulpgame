import React from 'react';
import { RetroSystem } from '../types/game';
import { retroAudio } from '../audio/retroAudio';
import { useLanguage } from '../i18n/LanguageContext';

interface FooterProps {
  onSelectSystem: (system: RetroSystem) => void;
  onOpenUploadRom: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onSelectSystem, onOpenUploadRom }) => {
  const { t } = useLanguage();

  return (
    <footer className="bg-slate-950 border-t border-slate-800 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          {/* Brand Info */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-rose-600 flex items-center justify-center font-pixel text-[9px] text-white">
                RG
              </div>
              <span className="font-pixel text-xs text-rose-500 tracking-wider">
                RETROGAMES<span className="text-amber-400">.CC</span>
              </span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              {t('footer.desc')}
            </p>
          </div>

          {/* Console Systems */}
          <div className="space-y-2">
            <div className="font-bold uppercase tracking-wider text-slate-200 text-xs">
              {t('footer.supportedSystems')}
            </div>
            <ul className="space-y-1.5 text-slate-400">
              <li>
                <button 
                  onClick={() => { retroAudio.playSelect(); onSelectSystem('NES'); }}
                  className="hover:text-rose-400 transition-colors cursor-pointer"
                >
                  Nintendo Entertainment System (NES)
                </button>
              </li>
              <li>
                <button 
                  onClick={() => { retroAudio.playSelect(); onSelectSystem('SNES'); }}
                  className="hover:text-rose-400 transition-colors cursor-pointer"
                >
                  Super Nintendo (SNES)
                </button>
              </li>
              <li>
                <button 
                  onClick={() => { retroAudio.playSelect(); onSelectSystem('GBA'); }}
                  className="hover:text-rose-400 transition-colors cursor-pointer"
                >
                  Game Boy Advance (GBA)
                </button>
              </li>
              <li>
                <button 
                  onClick={() => { retroAudio.playSelect(); onSelectSystem('ARCADE'); }}
                  className="hover:text-rose-400 transition-colors cursor-pointer"
                >
                  Arcade & Neo-Geo Coin-Op
                </button>
              </li>
              <li>
                <button 
                  onClick={() => { retroAudio.playSelect(); onSelectSystem('GENESIS'); }}
                  className="hover:text-rose-400 transition-colors cursor-pointer"
                >
                  Sega Mega Drive / Genesis (16-Bit)
                </button>
              </li>
              <li>
                <button 
                  onClick={() => { retroAudio.playSelect(); onSelectSystem('MASTERSYSTEM'); }}
                  className="hover:text-rose-400 transition-colors cursor-pointer"
                >
                  Sega Master System (8-Bit)
                </button>
              </li>
              <li>
                <button 
                  onClick={() => { retroAudio.playSelect(); onSelectSystem('GAMEGEAR'); }}
                  className="hover:text-rose-400 transition-colors cursor-pointer"
                >
                  Sega Game Gear (Portable)
                </button>
              </li>
              <li>
                <button 
                  onClick={() => { retroAudio.playSelect(); onSelectSystem('SEGA32X'); }}
                  className="hover:text-rose-400 transition-colors cursor-pointer"
                >
                  Sega 32X (32-Bit)
                </button>
              </li>
              <li>
                <button 
                  onClick={() => { retroAudio.playSelect(); onSelectSystem('SEGACD'); }}
                  className="hover:text-rose-400 transition-colors cursor-pointer"
                >
                  Sega Mega-CD / Sega CD
                </button>
              </li>
              <li>
                <button 
                  onClick={() => { retroAudio.playSelect(); onSelectSystem('PS1'); }}
                  className="hover:text-rose-400 transition-colors cursor-pointer"
                >
                  Sony PlayStation 1 (PSX)
                </button>
              </li>
              <li>
                <button 
                  onClick={() => { retroAudio.playSelect(); onSelectSystem('N64'); }}
                  className="hover:text-rose-400 transition-colors cursor-pointer"
                >
                  Nintendo 64 (N64)
                </button>
              </li>
              <li>
                <button 
                  onClick={() => { retroAudio.playSelect(); onSelectSystem('NEOGEO'); }}
                  className="hover:text-rose-400 transition-colors cursor-pointer"
                >
                  SNK Neo Geo (MVS/AES)
                </button>
              </li>
              <li>
                <button 
                  onClick={() => { retroAudio.playSelect(); onSelectSystem('HACKS'); }}
                  className="text-amber-400 hover:text-amber-300 transition-colors font-semibold cursor-pointer"
                >
                  ROM Hacks & Fan Translations
                </button>
              </li>
            </ul>
          </div>

          {/* Features */}
          <div className="space-y-2">
            <div className="font-bold uppercase tracking-wider text-slate-200 text-xs">
              {t('footer.featuresTitle')}
            </div>
            <ul className="space-y-1.5 text-slate-400">
              <li>Save States (F1 / F3)</li>
              <li>Realistic CRT Scanlines & Filters</li>
              <li>USB & Bluetooth Gamepad API</li>
              <li>Integrated Cheat Codes</li>
              <li>
                <button 
                  onClick={() => { retroAudio.playSelect(); onOpenUploadRom(); }}
                  className="text-sky-400 hover:underline cursor-pointer"
                >
                  {t('hero.uploadRom')}
                </button>
              </li>
            </ul>
          </div>

          {/* Legal / Preservation */}
          <div className="space-y-2">
            <div className="font-bold uppercase tracking-wider text-slate-200 text-xs">
              {t('footer.legalTitle')}
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              {t('footer.legalDisclaimer')}
            </p>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div>
            © {new Date().getFullYear()} RetroGames.cc Web Platform · {t('footer.rights')}
          </div>
          <div className="flex items-center gap-4">
            <span>Web Audio API Chiptune Synth</span>
            <span>·</span>
            <span>60 FPS Canvas Engine</span>
            <span>·</span>
            <span>Local State IndexedDB/Storage</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
