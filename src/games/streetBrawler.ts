import { RetroEngineInstance, EngineStats } from './engineTypes';
import { retroAudio } from '../audio/retroAudio';

export function createStreetBrawlerEngine(): RetroEngineInstance {
  let score = 0;
  let highScore = 68000;
  let level = 1;
  let gameOver = false;
  let win = false;
  let isPaused = false;

  let cheats = {
    inf_hp: false,
    super_meter: false,
  };

  interface Fighter {
    x: number;
    y: number;
    hp: number;
    maxHp: number;
    vx: number;
    vy: number;
    grounded: boolean;
    state: 'idle' | 'walk' | 'punch' | 'kick' | 'hadouken' | 'hit';
    stateTimer: number;
    facing: 1 | -1;
  }

  let player: Fighter = {
    x: 80,
    y: 210,
    hp: 100,
    maxHp: 100,
    vx: 0,
    vy: 0,
    grounded: true,
    state: 'idle',
    stateTimer: 0,
    facing: 1,
  };

  let opponent: Fighter = {
    x: 280,
    y: 210,
    hp: 100,
    maxHp: 100,
    vx: 0,
    vy: 0,
    grounded: true,
    state: 'idle',
    stateTimer: 0,
    facing: -1,
  };

  interface Projectile {
    x: number;
    y: number;
    vx: number;
    fromPlayer: boolean;
  }

  let projectiles: Projectile[] = [];
  let sparks: { x: number; y: number; life: number }[] = [];

  return {
    update(inputs: Record<string, boolean>, dt: number) {
      if (isPaused || gameOver || win) return;

      if (cheats.inf_hp) player.hp = 100;

      // Player timers
      if (player.stateTimer > 0) {
        player.stateTimer--;
        if (player.stateTimer === 0) player.state = 'idle';
      }

      // Opponent timers & AI
      if (opponent.stateTimer > 0) {
        opponent.stateTimer--;
        if (opponent.stateTimer === 0) opponent.state = 'idle';
      } else {
        // AI Logic
        const dist = opponent.x - player.x;
        if (Math.abs(dist) > 90) {
          opponent.x -= 1.8;
          opponent.state = 'walk';
        } else if (Math.random() < 0.04) {
          opponent.state = Math.random() < 0.5 ? 'punch' : 'kick';
          opponent.stateTimer = 16;
          // Hit player?
          if (Math.abs(dist) < 45 && player.state !== 'hit') {
            if (!cheats.inf_hp) {
              player.hp -= 10;
              player.state = 'hit';
              player.stateTimer = 12;
              retroAudio.playExplosion();
              sparks.push({ x: player.x + 15, y: player.y + 20, life: 10 });
              if (player.hp <= 0) {
                gameOver = true;
              }
            }
          }
        }
      }

      // Player input actions (only when not locked in animation)
      if (player.state === 'idle' || player.state === 'walk') {
        if (inputs.left && player.x > 30) {
          player.x -= 2.6;
          player.state = 'walk';
        } else if (inputs.right && player.x < 330) {
          player.x += 2.6;
          player.state = 'walk';
        } else {
          player.state = 'idle';
        }

        // Punch
        if (inputs.a || inputs.x) {
          player.state = 'punch';
          player.stateTimer = 14;
          retroAudio.playJump();

          const dist = Math.abs(player.x - opponent.x);
          if (dist < 50 && opponent.state !== 'hit') {
            opponent.hp -= 12;
            opponent.x += 12;
            opponent.state = 'hit';
            opponent.stateTimer = 14;
            score += 250;
            retroAudio.playExplosion();
            sparks.push({ x: opponent.x + 10, y: opponent.y + 15, life: 12 });
            if (opponent.hp <= 0) {
              win = true;
              score += 10000;
              retroAudio.playStartChime();
            }
          }
        }
        // Kick
        else if (inputs.b || inputs.y) {
          player.state = 'kick';
          player.stateTimer = 18;
          retroAudio.playJump();

          const dist = Math.abs(player.x - opponent.x);
          if (dist < 60 && opponent.state !== 'hit') {
            opponent.hp -= 18;
            opponent.x += 18;
            opponent.state = 'hit';
            opponent.stateTimer = 16;
            score += 400;
            retroAudio.playExplosion();
            sparks.push({ x: opponent.x + 10, y: opponent.y + 25, life: 14 });
            if (opponent.hp <= 0) {
              win = true;
              score += 10000;
              retroAudio.playStartChime();
            }
          }
        }
        // Hadouken Energy Wave
        else if (inputs.turboA || inputs.turboB || inputs.up) {
          player.state = 'hadouken';
          player.stateTimer = 22;
          retroAudio.playLaser();
          projectiles.push({
            x: player.x + 28,
            y: player.y + 16,
            vx: 5.5,
            fromPlayer: true,
          });
        }
      }

      // Update projectiles
      for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        p.x += p.vx;

        // Collision with opponent
        if (p.fromPlayer && Math.abs(p.x - opponent.x) < 20) {
          opponent.hp -= 25;
          opponent.state = 'hit';
          opponent.stateTimer = 20;
          opponent.x += 25;
          score += 1000;
          retroAudio.playExplosion();
          sparks.push({ x: opponent.x, y: opponent.y + 16, life: 16 });
          projectiles.splice(i, 1);

          if (opponent.hp <= 0) {
            win = true;
            score += 10000;
            retroAudio.playStartChime();
          }
          continue;
        }

        if (p.x > 380 || p.x < -20) {
          projectiles.splice(i, 1);
        }
      }

      // Update sparks
      sparks.forEach(s => s.life--);
      sparks = sparks.filter(s => s.life > 0);
    },

    render(ctx: CanvasRenderingContext2D, width: number, height: number) {
      // Dojo / Street Dojo Dojo arena backdrop
      const wallGrad = ctx.createLinearGradient(0, 0, 0, 220);
      wallGrad.addColorStop(0, '#1e1b4b');
      wallGrad.addColorStop(1, '#312e81');
      ctx.fillStyle = wallGrad;
      ctx.fillRect(0, 0, width, 220);

      // Wooden beams
      ctx.fillStyle = '#451a03';
      for (let i = 0; i < width; i += 60) {
        ctx.fillRect(i, 0, 8, 220);
      }
      ctx.fillRect(0, 100, width, 10);

      // Stone Floor
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(0, 220, width, height - 220);
      ctx.fillStyle = '#292524';
      for (let x = 0; x < width; x += 40) {
        ctx.fillRect(x, 220, 2, height - 220);
      }

      // Top HP Bars (Ryu vs Ken style)
      // Player HP (Left)
      ctx.fillStyle = '#ffffff';
      ctx.font = '9px "Press Start 2P", monospace';
      ctx.fillText('RYU', 25, 20);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(25, 26, 140, 14);
      ctx.fillStyle = player.hp > 30 ? '#eab308' : '#ef4444';
      ctx.fillRect(25, 26, (player.hp / player.maxHp) * 140, 14);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.strokeRect(25, 26, 140, 14);

      // KO Crest
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(width / 2 - 16, 20, 32, 22);
      ctx.fillStyle = '#ffffff';
      ctx.font = '10px "Press Start 2P", monospace';
      ctx.fillText('KO', width / 2 - 10, 35);

      // Opponent HP (Right)
      ctx.fillStyle = '#ffffff';
      ctx.fillText('KEN', width - 60, 20);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(width - 165, 26, 140, 14);
      ctx.fillStyle = opponent.hp > 30 ? '#eab308' : '#ef4444';
      ctx.fillRect(width - 165 + (140 - (opponent.hp / opponent.maxHp) * 140), 26, (opponent.hp / opponent.maxHp) * 140, 14);
      ctx.strokeRect(width - 165, 26, 140, 14);

      // Draw Player Fighter (White Gi)
      drawFighter(ctx, player, '#f8fafc', '#dc2626', '#b91c1c');

      // Draw Opponent Fighter (Red Gi)
      drawFighter(ctx, opponent, '#dc2626', '#1e293b', '#fbbf24');

      // Projectiles (Hadouken Blue Flame)
      for (const p of projectiles) {
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(p.x + 2, p.y, 6, 0, Math.PI * 2);
        ctx.fill();
      }

      // Hit Sparks
      for (const s of sparks) {
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(s.x, s.y, 8, 0, Math.PI * 2);
        ctx.fill();
      }

      // Win / Game Over
      if (win) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = '#facc15';
        ctx.font = '18px "Press Start 2P", monospace';
        ctx.fillText('YOU WIN! PERFECT', width / 2 - 120, height / 2 - 10);
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px "Press Start 2P", monospace';
        ctx.fillText(`PUNTEGGIO: ${score}`, width / 2 - 70, height / 2 + 20);
      } else if (gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = '#ef4444';
        ctx.font = '18px "Press Start 2P", monospace';
        ctx.fillText('YOU LOSE!', width / 2 - 65, height / 2);
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
      player.hp = 100;
      opponent.hp = 100;
      player.x = 80;
      opponent.x = 280;
      projectiles = [];
      gameOver = false;
      win = false;
    },

    getState() {
      return { score, player: { ...player }, opponent: { ...opponent } };
    },

    loadState(state: any) {
      if (!state) return;
      score = state.score || 0;
      if (state.player) Object.assign(player, state.player);
      if (state.opponent) Object.assign(opponent, state.opponent);
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
        lives: player.hp > 0 ? 1 : 0,
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

function drawFighter(ctx: CanvasRenderingContext2D, f: any, giColor: string, beltColor: string, hairColor: string) {
  const x = f.x;
  const y = f.y;
  const dir = f.facing;

  // Head
  ctx.fillStyle = '#fed7aa'; // skin
  ctx.fillRect(x + 4, y - 24, 16, 16);
  // Hair
  ctx.fillStyle = hairColor;
  ctx.fillRect(x + 2, y - 28, 20, 8);
  // Headband / eye
  ctx.fillStyle = beltColor;
  ctx.fillRect(x + 3, y - 20, 18, 3);

  // Torso / Gi
  ctx.fillStyle = giColor;
  ctx.fillRect(x + 2, y - 8, 20, 24);
  // Belt
  ctx.fillStyle = beltColor;
  ctx.fillRect(x + 2, y + 4, 20, 4);

  // Arms according to state
  if (f.state === 'punch') {
    ctx.fillStyle = giColor;
    ctx.fillRect(x + (dir === 1 ? 22 : -16), y - 6, 18, 8);
    ctx.fillStyle = '#fed7aa';
    ctx.fillRect(x + (dir === 1 ? 38 : -22), y - 6, 6, 8);
  } else if (f.state === 'hadouken') {
    ctx.fillStyle = giColor;
    ctx.fillRect(x + (dir === 1 ? 18 : -14), y - 4, 16, 12);
  }

  // Legs according to state
  if (f.state === 'kick') {
    ctx.fillStyle = giColor;
    ctx.fillRect(x + (dir === 1 ? 16 : -22), y + 8, 26, 8);
  } else {
    ctx.fillStyle = giColor;
    ctx.fillRect(x + 2, y + 16, 8, 16);
    ctx.fillRect(x + 14, y + 16, 8, 16);
  }
}
