import { RetroEngineInstance, EngineStats } from './engineTypes';
import { retroAudio } from '../audio/retroAudio';

export function createSonicSpeedEngine(): RetroEngineInstance {
  let score = 0;
  let highScore = 54000;
  let lives = 3;
  let rings = 0;
  let level = 1;
  let gameOver = false;
  let win = false;
  let isPaused = false;

  let cheats = {
    inf_rings: false,
    super_sonic: false,
  };

  let player = {
    x: 60,
    y: 220,
    vx: 0,
    vy: 0,
    isSpinning: false,
    facing: 1 as 1 | -1,
  };

  interface Ring {
    x: number;
    y: number;
    collected: boolean;
  }

  interface Badnik {
    x: number;
    y: number;
    vx: number;
    alive: boolean;
  }

  let ringList: Ring[] = [];
  let badniks: Badnik[] = [];
  let cameraX = 0;

  function initLevel() {
    rings = cheats.inf_rings ? 99 : 0;
    cameraX = 0;
    player.x = 60;
    player.y = 220;
    player.vx = 0;
    player.vy = 0;
    player.isSpinning = false;

    ringList = [];
    for (let i = 0; i < 35; i++) {
      ringList.push({
        x: 140 + i * 40 + Math.sin(i * 0.8) * 15,
        y: 220 - (i % 5 === 0 ? 40 : 0),
        collected: false,
      });
    }

    badniks = [
      { x: 300, y: 226, vx: -1.2, alive: true },
      { x: 550, y: 226, vx: -1.0, alive: true },
      { x: 800, y: 226, vx: 1.1, alive: true },
      { x: 1100, y: 226, vx: -1.3, alive: true },
    ];
  }

  initLevel();

  return {
    update(inputs: Record<string, boolean>, dt: number) {
      if (isPaused || gameOver || win) return;

      if (cheats.inf_rings) rings = 99;

      const topSpeed = cheats.super_sonic ? 8.5 : 5.5;

      // Sonic Acceleration
      if (inputs.left) {
        player.vx = Math.max(-topSpeed, player.vx - 0.35);
        player.facing = -1;
      } else if (inputs.right) {
        player.vx = Math.min(topSpeed, player.vx + 0.35);
        player.facing = 1;
      } else {
        player.vx *= 0.94;
        if (Math.abs(player.vx) < 0.1) player.vx = 0;
      }

      // Spin dash
      if (inputs.down && Math.abs(player.vx) > 1.5) {
        player.isSpinning = true;
      } else if (player.y >= 220) {
        player.isSpinning = false;
      }

      // Jump
      if ((inputs.up || inputs.a || inputs.b) && player.y >= 220) {
        player.vy = -8.5;
        player.isSpinning = true;
        retroAudio.playJump();
      }

      // Physics
      player.vy += 0.45;
      player.y += player.vy;
      player.x += player.vx;

      if (player.y > 220) {
        player.y = 220;
        player.vy = 0;
      }

      // Camera
      if (player.x - cameraX > 200) cameraX = player.x - 200;

      // Ring collection
      for (const r of ringList) {
        if (!r.collected && Math.hypot(player.x - r.x, player.y - r.y) < 18) {
          r.collected = true;
          rings++;
          score += 100;
          retroAudio.playCoin();
        }
      }

      // Badniks
      for (const b of badniks) {
        if (!b.alive) continue;
        b.x += b.vx;
        if (b.x < 150 || b.x > 1400) b.vx *= -1;

        if (Math.hypot(player.x - b.x, player.y - b.y) < 20) {
          if (player.isSpinning || player.vy > 0) {
            b.alive = false;
            player.vy = -6;
            score += 500;
            retroAudio.playExplosion();
          } else {
            // Hit! Loose rings
            if (rings > 0) {
              rings = 0;
              retroAudio.playExplosion();
              player.vy = -5;
              player.vx = -player.facing * 4;
            } else {
              lives--;
              retroAudio.playExplosion();
              if (lives <= 0) gameOver = true;
              else initLevel();
            }
          }
        }
      }

      // Level goal
      if (player.x >= 1450) {
        win = true;
        score += 10000;
        retroAudio.playStartChime();
      }
    },

    render(ctx: CanvasRenderingContext2D, width: number, height: number) {
      // Green Hill Zone sky & checkerboard hills
      const skyGrad = ctx.createLinearGradient(0, 0, 0, 160);
      skyGrad.addColorStop(0, '#0284c7');
      skyGrad.addColorStop(1, '#67e8f9');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, 160);

      ctx.save();
      ctx.translate(-cameraX, 0);

      // Water & Background Mountains
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(0, 140, 2000, 30);

      // Green grass & Brown checkerboard ground
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(0, 236, 2000, 12);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(0, 248, 2000, height - 248);

      // Checkerboard tiles
      for (let x = 0; x < 2000; x += 24) {
        for (let y = 248; y < height; y += 24) {
          if ((x / 24 + y / 24) % 2 === 0) {
            ctx.fillStyle = '#92400e';
            ctx.fillRect(x, y, 24, 24);
          }
        }
      }

      // Rotating Golden Rings
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 3;
      for (const r of ringList) {
        if (r.collected) continue;
        ctx.beginPath();
        ctx.ellipse(r.x, r.y, 7, 7, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Badniks (Crabmeat robot)
      for (const b of badniks) {
        if (!b.alive) continue;
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(b.x - 10, b.y - 8, 20, 16);
        ctx.fillStyle = '#020617';
        ctx.fillRect(b.x - 12, b.y - 12, 6, 6);
        ctx.fillRect(b.x + 6, b.y - 12, 6, 6);
      }

      // Sonic Player (Blue hedgehog)
      const px = player.x;
      const py = player.y;

      if (player.isSpinning) {
        ctx.fillStyle = '#2563eb';
        ctx.beginPath();
        ctx.arc(px, py - 4, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.arc(px, py - 4, 6, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Sonic Standing / Running
        ctx.fillStyle = '#2563eb'; // blue
        ctx.fillRect(px - 8, py - 16, 16, 18);
        // Spikes back
        ctx.fillRect(px - (player.facing === 1 ? 14 : -8), py - 18, 6, 12);
        // Face peach
        ctx.fillStyle = '#fed7aa';
        ctx.fillRect(px + (player.facing === 1 ? 2 : -8), py - 14, 8, 8);
        // Red shoes with white stripe
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(px - 10, py + 2, 9, 6);
        ctx.fillRect(px + 1, py + 2, 9, 6);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(px - 6, py + 2, 2, 6);
        ctx.fillRect(px + 4, py + 2, 2, 6);
      }

      // Goal sign at 1450
      ctx.fillStyle = '#475569';
      ctx.fillRect(1450, 170, 8, 70);
      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.arc(1454, 160, 18, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // Top HUD
      ctx.fillStyle = '#facc15';
      ctx.font = '9px "Press Start 2P", monospace';
      ctx.fillText(`SCORE`, 20, 20);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`${score}`, 85, 20);

      ctx.fillStyle = '#facc15';
      ctx.fillText(`RINGS`, 20, 38);
      ctx.fillStyle = rings > 0 ? '#ffffff' : '#ef4444';
      ctx.fillText(`${rings}`, 85, 38);

      ctx.fillStyle = '#facc15';
      ctx.fillText(`LIVES`, 20, 56);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`${lives}`, 85, 56);

      if (win) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = '#38bdf8';
        ctx.font = '16px "Press Start 2P", monospace';
        ctx.fillText('SONIC GOT THROUGH ACT 1!', width / 2 - 140, height / 2);
      } else if (gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = '#ef4444';
        ctx.font = '16px "Press Start 2P", monospace';
        ctx.fillText('GAME OVER', width / 2 - 65, height / 2);
      } else if (isPaused) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = '#38bdf8';
        ctx.font = '14px "Press Start 2P", monospace';
        ctx.fillText('PAUSA', width / 2 - 35, height / 2);
      }
    },

    reset() {
      score = 0;
      lives = 3;
      level = 1;
      gameOver = false;
      win = false;
      initLevel();
    },

    getState() {
      return { score, lives, rings, player: { ...player } };
    },

    loadState(state: any) {
      if (!state) return;
      score = state.score || 0;
      lives = state.lives || 3;
      rings = state.rings || 0;
      if (state.player) Object.assign(player, state.player);
      gameOver = false;
      win = false;
    },

    setCheat(cheatId: string, enabled: boolean) {
      if (cheatId in cheats) {
        (cheats as any)[cheatId] = enabled;
      }
    },

    getStats(): EngineStats {
      return {
        score,
        lives,
        level,
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
