import { RetroEngineInstance, EngineStats } from './engineTypes';
import { retroAudio } from '../audio/retroAudio';

export interface RomFileInfo {
  name: string;
  size: number;
  type: string;
  headerInfo: {
    system: string;
    title: string;
    mapperOrType: string;
    prgSize?: string;
    chrSize?: string;
    checksum?: string;
  };
  hexPreview: string[];
}

export function createCustomRomEngine(romInfo: RomFileInfo | null): RetroEngineInstance {
  let score = 0;
  let highScore = 20000;
  let lives = 3;
  let level = 1;
  let gameOver = false;
  let win = false;
  let isPaused = false;

  let player = {
    x: 180,
    y: 220,
    vx: 0,
    vy: 0,
    speed: 3.5,
  };

  interface BitEntity {
    x: number;
    y: number;
    val: string;
    vy: number;
  }

  let matrixBits: BitEntity[] = [];
  let cycleCounter = 0;

  for (let i = 0; i < 20; i++) {
    matrixBits.push({
      x: 30 + Math.random() * 320,
      y: Math.random() * 200,
      val: (Math.random() > 0.5 ? '1' : '0'),
      vy: 1 + Math.random() * 1.5,
    });
  }

  return {
    update(inputs: Record<string, boolean>, dt: number) {
      if (isPaused || gameOver) return;

      cycleCounter++;

      // Move player cursor
      if (inputs.left && player.x > 25) player.x -= player.speed;
      if (inputs.right && player.x < 355) player.x += player.speed;
      if (inputs.up && player.y > 40) player.y -= player.speed;
      if (inputs.down && player.y < 260) player.y += player.speed;

      // Shoot / Action
      if (inputs.a || inputs.b) {
        retroAudio.playLaser();
      }

      // Matrix bitstream falling
      for (const bit of matrixBits) {
        bit.y += bit.vy;
        if (bit.y > 280) {
          bit.y = 20;
          bit.x = 30 + Math.random() * 320;
          bit.val = Math.random() > 0.5 ? '1' : '0';
        }

        // Collect bit
        if (Math.hypot(player.x - bit.x, player.y - bit.y) < 16) {
          score += 50;
          bit.y = 20;
          bit.x = 30 + Math.random() * 320;
          retroAudio.playCoin();
        }
      }
    },

    render(ctx: CanvasRenderingContext2D, width: number, height: number) {
      // Dark cyber cartridge test screen
      ctx.fillStyle = '#030712';
      ctx.fillRect(0, 0, width, height);

      // Cartridge Header Banner
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(10, 10, width - 20, 48);
      ctx.strokeStyle = '#4338ca';
      ctx.lineWidth = 1;
      ctx.strokeRect(10, 10, width - 20, 48);

      ctx.fillStyle = '#38bdf8';
      ctx.font = '8px "Press Start 2P", monospace';
      ctx.fillText(`ROM: ${romInfo ? romInfo.name.slice(0, 24) : 'TEST_CARTRIDGE.BIN'}`, 20, 25);

      ctx.fillStyle = '#a5b4fc';
      ctx.fillText(`SYS: ${romInfo ? romInfo.headerInfo.system : 'NES / GB HYBRID'}  MAPPER: ${romInfo ? romInfo.headerInfo.mapperOrType : 'MMC1'}`, 20, 38);
      ctx.fillText(`SIZE: ${romInfo ? (romInfo.size / 1024).toFixed(1) + ' KB' : '256 KB'}  CYCLES: ${cycleCounter}`, 20, 51);

      // Falling bits
      ctx.fillStyle = '#22c55e';
      ctx.font = '10px "JetBrains Mono", monospace';
      for (const bit of matrixBits) {
        ctx.fillText(bit.val, bit.x, bit.y);
      }

      // Player Cartridge Reader Node
      ctx.fillStyle = '#ec4899';
      ctx.fillRect(player.x - 10, player.y - 10, 20, 20);
      ctx.fillStyle = '#fdf2f8';
      ctx.fillRect(player.x - 6, player.y - 6, 12, 12);

      // Bottom Hex Stream Peek
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(10, 230, width - 20, 55);
      ctx.strokeStyle = '#334155';
      ctx.strokeRect(10, 230, width - 20, 55);

      ctx.fillStyle = '#64748b';
      ctx.font = '8px "JetBrains Mono", monospace';
      ctx.fillText(`HEX MONITOR [PC: 0x80${(cycleCounter % 256).toString(16).padStart(2, '0').toUpperCase()}]:`, 18, 244);

      const sampleHex = romInfo?.hexPreview?.slice(0, 2).join(' ') || '4E 45 53 1A 02 01 01 00 00 00 00 00 00 00 00 00';
      ctx.fillStyle = '#38bdf8';
      ctx.fillText(sampleHex.slice(0, 46), 18, 260);
      ctx.fillText(sampleHex.slice(46, 92) || 'A9 00 8D 00 20 A9 FF 8D 01 20 4C 10 80', 18, 274);

      if (isPaused) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = '#38bdf8';
        ctx.font = '14px "Press Start 2P", monospace';
        ctx.fillText('PAUSA', width / 2 - 35, height / 2);
      }
    },

    reset() {
      score = 0;
      cycleCounter = 0;
      gameOver = false;
      win = false;
    },

    getState() {
      return { score, cycleCounter, player: { ...player } };
    },

    loadState(state: any) {
      if (!state) return;
      score = state.score || 0;
      cycleCounter = state.cycleCounter || 0;
      if (state.player) Object.assign(player, state.player);
      gameOver = false;
    },

    setCheat(cheatId: string, enabled: boolean) {},

    getStats(): EngineStats {
      return {
        score,
        lives,
        level: 1,
        gameOver,
        win,
        isPaused,
        highScore,
      };
    },

    togglePause() {
      isPaused = !isPaused;
      return isPaused;
    },
  };
}
