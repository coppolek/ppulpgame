import { RetroEngineInstance, EngineStats } from './engineTypes';
import { retroAudio } from '../audio/retroAudio';

export function createRetroKartEngine(): RetroEngineInstance {
  let score = 0;
  let highScore = 35000;
  let lives = 3;
  let level = 1;
  let gameOver = false;
  let win = false;
  let isPaused = false;

  let cheats = {
    max_speed: false,
    grip_master: false,
  };

  let player = {
    x: 0, // -1 to 1 across track width
    speed: 0,
    maxSpeed: 8,
    accel: 0.15,
    lap: 1,
    progress: 0,
    trackLength: 2000,
    coins: 0,
  };

  interface RivalKart {
    x: number;
    progress: number;
    speed: number;
    color: string;
  }

  let rivals: RivalKart[] = [
    { x: -0.4, progress: 200, speed: 5.5, color: '#ef4444' },
    { x: 0.3, progress: 450, speed: 5.8, color: '#3b82f6' },
    { x: -0.2, progress: 700, speed: 6.0, color: '#10b981' },
    { x: 0.5, progress: 950, speed: 6.2, color: '#f59e0b' },
  ];

  interface BoostPad {
    progress: number;
    x: number;
  }

  const boostPads: BoostPad[] = [
    { progress: 300, x: 0 },
    { progress: 800, x: -0.3 },
    { progress: 1300, x: 0.3 },
    { progress: 1700, x: 0 },
  ];

  let curveAngle = 0;
  let boostTimer = 0;

  return {
    update(inputs: Record<string, boolean>, dt: number) {
      if (isPaused || gameOver) return;

      const topSpeed = cheats.max_speed ? 12 : (boostTimer > 0 ? 11 : 8);

      // Accelerate
      if (inputs.up || inputs.a || inputs.b) {
        if (player.speed < topSpeed) {
          player.speed += player.accel;
        }
      } else {
        player.speed *= 0.95;
      }

      // Brake / reverse
      if (inputs.down) {
        player.speed *= 0.85;
      }

      // Steering with road grip
      const steerPower = cheats.grip_master ? 0.05 : 0.035;
      if (player.speed > 0.5) {
        if (inputs.left) player.x -= steerPower * (player.speed / 5);
        if (inputs.right) player.x += steerPower * (player.speed / 5);
      }

      // Off-road slow down
      if (!cheats.grip_master && Math.abs(player.x) > 0.75) {
        player.speed = Math.min(player.speed, 3.5);
      }

      // Curving track calculation
      curveAngle = Math.sin(player.progress * 0.005) * 1.5;
      player.x -= curveAngle * 0.005 * player.speed;

      // Advance progress
      player.progress += player.speed;
      score += Math.floor(player.speed);

      if (boostTimer > 0) boostTimer--;

      // Check boost pads
      for (const pad of boostPads) {
        if (Math.abs(player.progress % player.trackLength - pad.progress) < 30 && Math.abs(player.x - pad.x) < 0.3) {
          boostTimer = 45;
          retroAudio.playPowerUp();
        }
      }

      // Rivals update
      for (const rival of rivals) {
        rival.progress += rival.speed;

        // Collision with player
        const dist = Math.abs(player.progress - rival.progress);
        if (dist < 20 && Math.abs(player.x - rival.x) < 0.25) {
          // Bump
          player.speed *= 0.8;
          retroAudio.playExplosion();
        }
      }

      // Lap completion
      if (player.progress >= player.trackLength * player.lap) {
        player.lap++;
        retroAudio.playCoin();
        if (player.lap > 3) {
          win = true;
          score += 10000;
          retroAudio.playStartChime();
        }
      }
    },

    render(ctx: CanvasRenderingContext2D, width: number, height: number) {
      // Sky with clouds
      const skyGrad = ctx.createLinearGradient(0, 0, 0, 130);
      skyGrad.addColorStop(0, '#0284c7');
      skyGrad.addColorStop(1, '#7dd3fc');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, 130);

      // Distant retro mountains
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.moveTo(0, 130);
      for (let i = 0; i < width; i += 40) {
        ctx.lineTo(i + 20, 95 + Math.sin(i + curveAngle * 10) * 15);
        ctx.lineTo(i + 40, 130);
      }
      ctx.fill();

      // Pseudo Mode 7 Road Projection
      const horizon = 120;
      for (let y = horizon; y < height; y++) {
        const perspective = (y - horizon) / (height - horizon);
        const roadWidth = perspective * 340;
        const roadCenter = width / 2 - player.x * roadWidth * 0.7 + Math.sin((player.progress + y * 2) * 0.02) * 20 * perspective;

        // Alternating grass stripes
        const stripe = Math.floor((player.progress + (height - y) * 3) / 20) % 2 === 0;
        ctx.fillStyle = stripe ? '#15803d' : '#16a34a';
        ctx.fillRect(0, y, width, 1);

        // Track surface
        ctx.fillStyle = stripe ? '#334155' : '#1e293b';
        ctx.fillRect(roadCenter - roadWidth / 2, y, roadWidth, 1);

        // Curbs (red/white)
        const curbWidth = 14 * perspective;
        ctx.fillStyle = stripe ? '#dc2626' : '#ffffff';
        ctx.fillRect(roadCenter - roadWidth / 2 - curbWidth, y, curbWidth, 1);
        ctx.fillRect(roadCenter + roadWidth / 2, y, curbWidth, 1);
      }

      // Rivals on track
      for (const rival of rivals) {
        const relDist = rival.progress - player.progress;
        if (relDist > 0 && relDist < 800) {
          const p = 1 - relDist / 800;
          const ry = horizon + p * (height - horizon - 30);
          const rw = p * 340;
          const rx = width / 2 - player.x * rw * 0.7 + rival.x * rw * 0.7;
          const kSize = Math.max(8, 32 * p);

          ctx.fillStyle = rival.color;
          ctx.fillRect(rx - kSize / 2, ry - kSize, kSize, kSize * 0.7);
          ctx.fillStyle = '#000000';
          ctx.fillRect(rx - kSize / 2 - 2, ry - kSize * 0.4, 3, 6);
          ctx.fillRect(rx + kSize / 2 - 1, ry - kSize * 0.4, 3, 6);
        }
      }

      // Player Kart (Foreground)
      const kX = width / 2;
      const kY = height - 35;
      const boostGlow = boostTimer > 0;

      if (boostGlow) {
        ctx.fillStyle = '#f97316';
        ctx.fillRect(kX - 22, kY - 14, 44, 28);
      }

      // Kart body
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(kX - 16, kY - 8, 32, 18);
      // Wheels
      ctx.fillStyle = '#020617';
      ctx.fillRect(kX - 20, kY - 10, 6, 12);
      ctx.fillRect(kX + 14, kY - 10, 6, 12);
      ctx.fillRect(kX - 20, kY + 4, 6, 12);
      ctx.fillRect(kX + 14, kY + 4, 6, 12);
      // Helmet
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(kX, kY - 4, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(kX - 4, kY - 7, 8, 4);

      // HUD
      ctx.fillStyle = '#ffffff';
      ctx.font = '10px "Press Start 2P", monospace';
      ctx.fillText(`LAP ${Math.min(3, player.lap)}/3`, 20, 25);
      ctx.fillText(`SPEED ${Math.floor(player.speed * 20)} KM/H`, 20, 42);

      ctx.fillStyle = '#facc15';
      ctx.fillText(`SCORE: ${score}`, 220, 25);

      if (boostGlow) {
        ctx.fillStyle = '#f97316';
        ctx.fillText(`TURBO BOOST!`, width / 2 - 60, 60);
      }

      if (win) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = '#facc15';
        ctx.font = '16px "Press Start 2P", monospace';
        ctx.fillText('1° CLASSIFICATO!', width / 2 - 100, height / 2 - 10);
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px "Press Start 2P", monospace';
        ctx.fillText('HAI VINTO IL GRAN PREMIO!', width / 2 - 120, height / 2 + 15);
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
      player.lap = 1;
      player.progress = 0;
      player.speed = 0;
      player.x = 0;
      gameOver = false;
      win = false;
    },

    getState() {
      return { score, player: { ...player }, rivals: rivals.map(r => ({ ...r })) };
    },

    loadState(state: any) {
      if (!state) return;
      score = state.score || 0;
      if (state.player) Object.assign(player, state.player);
      if (state.rivals) rivals = state.rivals;
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
        lives: 3,
        level: player.lap,
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
