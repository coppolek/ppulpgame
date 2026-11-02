import React, { useState, useRef } from 'react';
import { X, Upload, FileCode, CheckCircle2, AlertCircle, Play } from 'lucide-react';
import { RomFileInfo } from '../games/customRomEngine';
import { RetroGame } from '../types/game';
import { retroAudio } from '../audio/retroAudio';
import { useLanguage } from '../i18n/LanguageContext';

interface CustomRomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchRom: (romGame: RetroGame, romInfo: RomFileInfo) => void;
}

export const CustomRomModal: React.FC<CustomRomModalProps> = ({
  isOpen,
  onClose,
  onLaunchRom,
}) => {
  const { t } = useLanguage();
  const [dragActive, setDragActive] = useState(false);
  const [loadedRom, setLoadedRom] = useState<RomFileInfo | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFile = (file: File) => {
    setErrorMsg(null);
    const validExts = ['.nes', '.gb', '.gbc', '.gba', '.smd', '.bin', '.zip', '.smc'];
    const hasValidExt = validExts.some(ext => file.name.toLowerCase().endsWith(ext));

    if (!hasValidExt) {
      setErrorMsg(`Formato non supportato. Trascina un file con estensione: ${validExts.join(', ')}`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        const bytes = new Uint8Array(buffer);

        // Parse header
        let detectedSystem = 'Piattaforma Retro Sconosciuta';
        let detectedTitle = file.name.replace(/\.[^/.]+$/, '');
        let mapperOrType = 'Generico / Flat';
        let prgSize = '';
        let chrSize = '';

        // NES iNES Header check (Magic: 0x4E 0x45 0x53 0x1A => "NES\x1a")
        if (bytes.length >= 16 && bytes[0] === 0x4E && bytes[1] === 0x45 && bytes[2] === 0x53 && bytes[3] === 0x1A) {
          detectedSystem = 'Nintendo NES (8-bit)';
          const prgUnits = bytes[4];
          const chrUnits = bytes[5];
          const mapperLow = bytes[6] >> 4;
          const mapperHigh = bytes[7] & 0xF0;
          const mapper = mapperHigh | mapperLow;
          mapperOrType = `Mapper #${mapper} (MMC${mapper > 0 ? mapper : '0'})`;
          prgSize = `${prgUnits * 16} KB PRG`;
          chrSize = `${chrUnits * 8} KB CHR`;
        }
        // Game Boy Nintendo Logo check (0x0104 - 0x0133)
        else if (bytes.length > 0x150 && (file.name.toLowerCase().endsWith('.gb') || file.name.toLowerCase().endsWith('.gbc'))) {
          detectedSystem = file.name.toLowerCase().endsWith('.gbc') ? 'Game Boy Color' : 'Game Boy Classic (8-bit)';
          // Title from 0x0134 to 0x0143
          let titleAscii = '';
          for (let i = 0x0134; i <= 0x0143; i++) {
            if (bytes[i] === 0) break;
            titleAscii += String.fromCharCode(bytes[i]);
          }
          if (titleAscii.trim()) detectedTitle = titleAscii.trim();
          const cartTypeByte = bytes[0x0147];
          const cartTypes: Record<number, string> = {
            0x00: 'ROM ONLY',
            0x01: 'MBC1',
            0x02: 'MBC1+RAM',
            0x03: 'MBC1+RAM+BATTERY',
            0x13: 'MBC3+RAM+BATTERY',
            0x19: 'MBC5',
          };
          mapperOrType = cartTypes[cartTypeByte] || `Cartridge 0x${cartTypeByte.toString(16)}`;
        }
        // GBA check
        else if (file.name.toLowerCase().endsWith('.gba')) {
          detectedSystem = 'Game Boy Advance (32-bit)';
          mapperOrType = 'GBA ARM7TDMI 16.78 MHz';
        }
        // Genesis check
        else if (file.name.toLowerCase().endsWith('.smd') || file.name.toLowerCase().endsWith('.bin')) {
          detectedSystem = 'Sega Mega Drive (16-bit)';
          mapperOrType = 'Motorola 68000 + Z80';
        }

        // Generate hex preview of first 32 bytes
        const hexRows: string[] = [];
        for (let i = 0; i < Math.min(64, bytes.length); i += 16) {
          const slice = bytes.slice(i, i + 16);
          const hex = Array.from(slice).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
          hexRows.push(hex);
        }

        const romInfo: RomFileInfo = {
          name: file.name,
          size: file.size,
          type: file.type || 'application/octet-stream',
          headerInfo: {
            system: detectedSystem,
            title: detectedTitle,
            mapperOrType,
            prgSize,
            chrSize,
          },
          hexPreview: hexRows,
        };

        setLoadedRom(romInfo);
        retroAudio.playCoin();
      } catch (err: any) {
        setErrorMsg('Errore nella lettura del file binario: ' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleStartGame = () => {
    if (!loadedRom) return;
    
    // Construct virtual game entry
    const romGame: RetroGame = {
      id: `custom_${Date.now()}`,
      title: loadedRom.headerInfo.title || loadedRom.name,
      system: loadedRom.headerInfo.system.includes('NES') ? 'NES' : loadedRom.headerInfo.system.includes('GBA') ? 'GBA' : 'GAMEBOY',
      genre: 'Action',
      year: 1990,
      developer: 'Custom Homebrew / User ROM',
      rating: 5.0,
      playsCount: 1,
      coverAccent: '#38bdf8',
      badgeColor: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
      engineKey: 'custom_rom',
      description: `ROM caricata dall'utente: ${loadedRom.name} (${(loadedRom.size / 1024).toFixed(1)} KB). Esecuzione in sandbox retro-hardware.`,
      story: `Cartuccia emulata: ${loadedRom.name}. Informazioni header: ${loadedRom.headerInfo.mapperOrType}.`,
      instructions: [
        'Usa Frecce Direzionali per navigare nel banco di memoria',
        'Premi Spazio / Z per eseguire cicli del processore',
        'Premi F1 per effettuare un salvataggio di stato istantaneo'
      ],
      controlsTip: 'Frecce per navigare · Z/Spazio per azione',
      cheats: [],
    };

    retroAudio.playStartChime();
    onLaunchRom(romGame, loadedRom);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400">
            <Upload className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{t('modal.uploadTitle')}</h3>
            <p className="text-xs text-slate-400">{t('modal.uploadDesc')}</p>
          </div>
        </div>

        {/* Drag & Drop Area */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragActive(false);
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
              handleFile(e.dataTransfer.files[0]);
            }
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
            dragActive
              ? 'border-rose-500 bg-rose-500/10'
              : 'border-slate-700 bg-slate-950/60 hover:border-slate-500 hover:bg-slate-950'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".nes,.gb,.gbc,.gba,.smd,.bin,.smc,.zip"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFile(e.target.files[0]);
              }
            }}
            className="hidden"
          />

          <FileCode className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-200">
            {t('hero.uploadRom')}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Support: .NES, .GB / .GBC, .GBA, .SMD, .BIN, .ZIP
          </p>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="mt-4 p-3 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Loaded ROM Header Breakdown */}
        {loadedRom && (
          <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 font-mono text-xs">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Cartridge OK!</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-slate-500 block">Title:</span>
                <span className="text-white font-bold">{loadedRom.headerInfo.title}</span>
              </div>
              <div>
                <span className="text-slate-500 block">System:</span>
                <span className="text-amber-400 font-bold">{loadedRom.headerInfo.system}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Mapper / Type:</span>
                <span className="text-sky-300">{loadedRom.headerInfo.mapperOrType}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Size:</span>
                <span className="text-slate-300">{(loadedRom.size / 1024).toFixed(1)} KB</span>
              </div>
            </div>

            {/* Hex Preview */}
            <div className="pt-2 border-t border-slate-800">
              <div className="text-slate-500 text-[10px] mb-1">HEADER HEX PREVIEW:</div>
              <div className="bg-slate-900 p-2 rounded text-[10px] text-slate-300 leading-relaxed font-mono-code overflow-x-auto">
                {loadedRom.hexPreview.map((row, i) => (
                  <div key={i}>{row}</div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
          >
            {t('modal.close')}
          </button>

          <button
            onClick={handleStartGame}
            disabled={!loadedRom}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              loadedRom
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{t('modal.play')}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
