import { RetroEngineInstance, EngineStats } from './engineTypes';
import { retroAudio } from '../audio/retroAudio';

export function createSuperPlumberEngine(): RetroEngineInstance {
  let score = 0;
  let highScore = 12500;
  let lives = 3;
  let level = 1;
  let gameOver = false;
  let win = false;
  let isPaused = false;

  let cheats = {
    inf_lives: false,
    moon_jump: false,
    god_mode: false,
  };

  // World physics & player
  let cameraX = 0;
  let player = {
    x: 60,
    y: 200,
    vx: 0,
    vy: 0,
    w: 16,
    h: 24,
    grounded: false,
    isSuper: false,
    invincibleTimer: 0,
    facing: 1 as 1 | -1,
  };

  interface Block {
    x: number;
    y: number;
    w: number;
    h: number;
    type: 'brick' | 'question' | 'empty' | 'pipe';
    bumpTimer: number;
    hasCoin: boolean;
  }

  interface Enemy {
    x: number;
    y: number;
    vx: number;
    w: number;
    h: number;
    alive: boolean;
    squishedTimer: number;
  }

  interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    color: string;
  }

  interface FloatingText {
    x: number;
    y: number;
    text: string;
    life: number;
  }

  let blocks: Block[] = [];
  let enemies: Enemy[] = [];
  let particles: Particle[] = [];
  let texts: FloatingText[] = [];
  let flagPoleX = 1400;
  let flagY = 80;
  let flagReached = false;

  function initLevel() {
    cameraX = 0;
    player.x = 60;
    player.y = 200;
    player.vx = 0;
    player.vy = 0;
    player.grounded = false;
    flagY = 80;
    flagReached = false;
    particles = [];
    texts = [];

    // Construct level blocks
    blocks = [
      // Ground stretches across
      { x: 0, y: 260, w: 1600, h: 40, type: 'brick', bumpTimer: 0, hasCoin: false },
      // Pipes
      { x: 260, y: 210, w: 32, h: 50, type: 'pipe', bumpTimer: 0, hasCoin: false },
      { x: 440, y: 190, w: 32, h: 70, type: 'pipe', bumpTimer: 0, hasCoin: false },
      { x: 800, y: 190, w: 32, h: 70, type: 'pipe', bumpTimer: 0, hasCoin: false },
      // Question & Brick blocks
      { x: 120, y: 180, w: 20, h: 20, type: 'question', bumpTimer: 0, hasCoin: true },
      { x: 160, y: 180, w: 20, h: 20, type: 'brick', bumpTimer: 0, hasCoin: false },
      { x: 180, y: 180, w: 20, h: 20, type: 'question', bumpTimer: 0, hasCoin: true },
      { x: 200, y: 180, w: 20, h: 20, type: 'brick', bumpTimer: 0, hasCoin: false },
      { x: 220, y: 180, w: 20, h: 20, type: 'question', bumpTimer: 0, hasCoin: true },
      // High platforms
      { x: 540, y: 150, w: 20, h: 20, type: 'brick', bumpTimer: 0, hasCoin: false },
      { x: 560, y: 150, w: 20, h: 20, type: 'question', bumpTimer: 0, hasCoin: true },
      { x: 580, y: 150, w: 20, h: 20, type: 'brick', bumpTimer: 0, hasCoin: false },
      // Staircase to flag
      { x: 1100, y: 240, w: 20, h: 20, type: 'brick', bumpTimer: 0, hasCoin: false },
      { x: 1120, y: 220, w: 20, h: 40, type: 'brick', bumpTimer: 0, hasCoin: false },
      { x: 1140, y: 200, w: 20, h: 60, type: 'brick', bumpTimer: 0, hasCoin: false },
      { x: 1160, y: 180, w: 20, h: 80, type: 'brick', bumpTimer: 0, hasCoin: false },
    ];

    // Goombas
    enemies = [
      { x: 200, y: 236, vx: -0.8, w: 18, h: 18, alive: true, squishedTimer: 0 },
      { x: 340, y: 236, vx: -0.9, w: 18, h: 18, alive: true, squishedTimer: 0 },
      { x: 500, y: 236, vx: 0.8, w: 18, h: 18, alive: true, squishedTimer: 0 },
      { x: 680, y: 236, vx: -1.0, w: 18, h: 18, alive: true, squishedTimer: 0 },
      { x: 880, y: 236, vx: -1.1, w: 18, h: 18, alive: true, squishedTimer: 0 },
      { x: 1020, y: 236, vx: 1.0, w: 18, h: 18, alive: true, squishedTimer: 0 },
    ];
  }

  initLevel();

  return {
    update(inputs: Record<string, boolean>, dt: number) {
      if (isPaused || gameOver) return;

      if (win) {
        // Victory flag slide animation
        if (flagY < 230) flagY += 2;
        player.x += 1;
        return;
      }

      if (cheats.inf_lives) lives = 99;

      const gravity = 0.45;
      const moveSpeed = inputs.x || inputs.turboB ? 4.2 : 2.8;

      // Horizontal movement
      if (inputs.left) {
        player.vx = -moveSpeed;
        player.facing = -1;
      } else if (inputs.right) {
        player.vx = moveSpeed;
        player.facing = 1;
      } else {
        player.vx *= 0.8;
        if (Math.abs(player.vx) < 0.1) player.vx = 0;
      }

      // Jump
      const jumpImpulse = cheats.moon_jump ? -11.5 : -8.5;
      if ((inputs.up || inputs.a || inputs.b) && player.grounded) {
        player.vy = jumpImpulse;
        player.grounded = false;
        retroAudio.playJump();
      }

      // Apply physics
      player.vy += gravity;
      player.x += player.vx;

      // Camera follow
      if (player.x - cameraX > 220) {
        cameraX = player.x - 220;
      }

      // Block collisions
      player.grounded = false;
      const pH = player.isSuper ? 32 : 24;
      player.h = pH;

      for (const block of blocks) {
        if (block.bumpTimer > 0) block.bumpTimer--;

        // AABB check
        const isOverlap = 
          player.x + player.w > block.x &&
          player.x < block.x + block.w &&
          player.y + player.h > block.y &&
          player.y < block.y + block.h;

        if (isOverlap) {
          // Hit from bottom
          if (player.vy < 0 && player.y - player.vy >= block.y + block.h - 8) {
            player.y = block.y + block.h;
            player.vy = 0;
            block.bumpTimer = 8;

            if (block.hasCoin) {
              block.hasCoin = false;
              block.type = 'empty';
              score += 200;
              retroAudio.playCoin();
              texts.push({ x: block.x + 2, y: block.y - 10, text: '+200', life: 30 });
              // Power up chance: mushroom!
              if (Math.random() > 0.4 && !player.isSuper) {
                player.isSuper = true;
                retroAudio.playPowerUp();
                texts.push({ x: block.x, y: block.y - 25, text: 'SUPER!', life: 40 });
              }
            } else if (block.type === 'brick') {
              score += 50;
              retroAudio.playLaser();
              // Spawn particle debris
              for (let i = 0; i < 4; i++) {
                particles.push({
                  x: block.x + 8,
                  y: block.y + 8,
                  vx: (Math.random() - 0.5) * 4,
                  vy: -Math.random() * 5,
                  life: 25,
                  color: '#b45309'
                });
              }
            }
          }
          // Land on top
          else if (player.vy > 0 && player.y + player.h - player.vy <= block.y + 10) {
            player.y = block.y - player.h;
            player.vy = 0;
            player.grounded = true;
          }
          // Lateral collision
          else if (player.vx > 0) {
            player.x = block.x - player.w;
          } else if (player.vx < 0) {
            player.x = block.x + block.w;
          }
        }
      }

      // Pit fall
      if (player.y > 320) {
        if (!cheats.god_mode) {
          lives--;
          retroAudio.playExplosion();
          if (lives <= 0) {
            gameOver = true;
          } else {
            initLevel();
          }
        } else {
          player.y = 100;
          player.vy = 0;
        }
      }

      // Invincible timer
      if (player.invincibleTimer > 0) player.invincibleTimer--;

      // Enemies update
      for (const enemy of enemies) {
        if (!enemy.alive) {
          if (enemy.squishedTimer > 0) enemy.squishedTimer--;
          continue;
        }

        enemy.x += enemy.vx;
        // Turn around on boundaries
        if (enemy.x < 100 || enemy.x > 1300) enemy.vx *= -1;

        // Player collision
        const collide = 
          player.x + player.w > enemy.x &&
          player.x < enemy.x + enemy.w &&
          player.y + player.h > enemy.y &&
          player.y < enemy.y + enemy.h;

        if (collide) {
          // Stomp on top
          if (player.vy > 0 && player.y + player.h - player.vy <= enemy.y + 8) {
            enemy.alive = false;
            enemy.squishedTimer = 25;
            player.vy = -6;
            score += 100;
            retroAudio.playJump();
            texts.push({ x: enemy.x, y: enemy.y - 10, text: '100', life: 30 });
          } else if (!cheats.god_mode && player.invincibleTimer === 0) {
            if (player.isSuper) {
              player.isSuper = false;
              player.invincibleTimer = 60;
              retroAudio.playExplosion();
            } else {
              lives--;
              retroAudio.playExplosion();
              if (lives <= 0) {
                gameOver = true;
              } else {
                initLevel();
              }
            }
          }
        }
      }

      // Check flag pole victory
      if (player.x >= flagPoleX - 10 && !flagReached) {
        flagReached = true;
        win = true;
        score += 5000;
        retroAudio.playStartChime();
        texts.push({ x: flagPoleX, y: 60, text: 'STAGE CLEAR! +5000', life: 100 });
      }

      // Particles & Texts
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.3;
        p.life--;
      });
      particles = particles.filter(p => p.life > 0);

      texts.forEach(t => {
        t.y -= 0.5;
        t.life--;
      });
      texts = texts.filter(t => t.life > 0);
    },

    render(ctx: CanvasRenderingContext2D, width: number, height: number) {
      // 8-bit sky blue background
      ctx.fillStyle = '#5c94fc';
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      ctx.translate(-cameraX, 0);

      // Clouds & Retro Hills
      ctx.fillStyle = '#00a800';
      ctx.beginPath();
      ctx.arc(100, 260, 50, Math.PI, 0);
      ctx.arc(400, 260, 70, Math.PI, 0);
      ctx.arc(900, 260, 80, Math.PI, 0);
      ctx.fill();

      // Clouds
      ctx.fillStyle = '#ffffff';
      [80, 320, 700, 1100].forEach(cx => {
        ctx.beginPath();
        ctx.arc(cx, 60, 24, 0, Math.PI * 2);
        ctx.arc(cx + 20, 50, 30, 0, Math.PI * 2);
        ctx.arc(cx + 44, 60, 22, 0, Math.PI * 2);
        ctx.fill();
      });

      // Blocks
      for (const block of blocks) {
        const yOffset = block.bumpTimer > 0 ? -4 : 0;
        if (block.type === 'brick') {
          ctx.fillStyle = '#d04800';
          ctx.fillRect(block.x, block.y + yOffset, block.w, block.h);
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 1;
          ctx.strokeRect(block.x, block.y + yOffset, block.w, block.h);
          // Brick pattern line
          ctx.beginPath();
          ctx.moveTo(block.x, block.y + yOffset + block.h / 2);
          ctx.lineTo(block.x + block.w, block.y + yOffset + block.h / 2);
          ctx.stroke();
        } else if (block.type === 'question') {
          ctx.fillStyle = '#fcb040';
          ctx.fillRect(block.x, block.y + yOffset, block.w, block.h);
          ctx.strokeStyle = '#884400';
          ctx.strokeRect(block.x, block.y + yOffset, block.w, block.h);
          ctx.fillStyle = '#ffffff';
          ctx.font = '10px "Press Start 2P", monospace';
          ctx.fillText('?', block.x + 5, block.y + yOffset + 14);
        } else if (block.type === 'empty') {
          ctx.fillStyle = '#8f563b';
          ctx.fillRect(block.x, block.y + yOffset, block.w, block.h);
          ctx.strokeRect(block.x, block.y + yOffset, block.w, block.h);
        } else if (block.type === 'pipe') {
          // Green Warp Pipe
          ctx.fillStyle = '#00a800';
          ctx.fillRect(block.x, block.y, block.w, block.h);
          ctx.fillRect(block.x - 3, block.y, block.w + 6, 14);
          ctx.strokeStyle = '#005000';
          ctx.lineWidth = 2;
          ctx.strokeRect(block.x - 3, block.y, block.w + 6, 14);
        }
      }

      // Flag Pole
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(flagPoleX, 40, 6, 220);
      ctx.fillStyle = '#fce438';
      ctx.beginPath();
      ctx.arc(flagPoleX + 3, 38, 7, 0, Math.PI * 2);
      ctx.fill();

      // Flag
      ctx.fillStyle = '#00a800';
      ctx.beginPath();
      ctx.moveTo(flagPoleX, flagY);
      ctx.lineTo(flagPoleX - 28, flagY + 12);
      ctx.lineTo(flagPoleX, flagY + 24);
      ctx.fill();

      // Castle at end
      ctx.fillStyle = '#c03800';
      ctx.fillRect(1460, 160, 120, 100);
      // Battlements
      for (let i = 0; i < 5; i++) {
        ctx.fillRect(1460 + i * 26, 144, 16, 16);
      }
      ctx.fillStyle = '#000000';
      ctx.fillRect(1505, 210, 30, 50);

      // Enemies (Goombas)
      for (const enemy of enemies) {
        if (!enemy.alive) {
          if (enemy.squishedTimer > 0) {
            ctx.fillStyle = '#8f563b';
            ctx.fillRect(enemy.x, enemy.y + 12, 18, 6);
          }
          continue;
        }
        // Goomba Mushroom Body
        ctx.fillStyle = '#a84000';
        ctx.beginPath();
        ctx.arc(enemy.x + 9, enemy.y + 7, 8, Math.PI, 0);
        ctx.lineTo(enemy.x + 16, enemy.y + 14);
        ctx.lineTo(enemy.x + 2, enemy.y + 14);
        ctx.fill();
        // Eyes
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(enemy.x + 4, enemy.y + 5, 3, 5);
        ctx.fillRect(enemy.x + 11, enemy.y + 5, 3, 5);
        ctx.fillStyle = '#000000';
        ctx.fillRect(enemy.x + 5, enemy.y + 7, 2, 3);
        ctx.fillRect(enemy.x + 11, enemy.y + 7, 2, 3);
        // Feet
        ctx.fillStyle = '#000000';
        ctx.fillRect(enemy.x + 1, enemy.y + 14, 6, 4);
        ctx.fillRect(enemy.x + 11, enemy.y + 14, 6, 4);
      }

      // Player (Mario / Jumpman)
      if (player.invincibleTimer % 4 < 2) {
        const pY = player.y;
        const pX = player.x;
        const isSp = player.isSuper;

        // Hat & Shirt Red
        ctx.fillStyle = '#e52521';
        ctx.fillRect(pX + 2, pY, 12, isSp ? 8 : 6);
        // Face peach
        ctx.fillStyle = '#fcd8a8';
        ctx.fillRect(pX + (player.facing === 1 ? 4 : 0), pY + (isSp ? 8 : 6), 10, isSp ? 8 : 6);
        // Overalls Blue
        ctx.fillStyle = '#0024f8';
        ctx.fillRect(pX + 2, pY + (isSp ? 16 : 12), 12, isSp ? 12 : 8);
        // Boots brown
        ctx.fillStyle = '#803400';
        ctx.fillRect(pX, pY + player.h - 4, 6, 4);
        ctx.fillRect(pX + 10, pY + player.h - 4, 6, 4);
      }

      // Particles
      for (const p of particles) {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 3, 3);
      }

      // Floating Texts
      ctx.fillStyle = '#ffffff';
      ctx.font = '9px "Press Start 2P", monospace';
      for (const t of texts) {
        ctx.fillText(t.text, t.x, t.y);
      }

      ctx.restore();

      // Top HUD (Scores & Lives)
      ctx.fillStyle = '#ffffff';
      ctx.font = '10px "Press Start 2P", monospace';
      ctx.fillText(`MARIO`, 20, 20);
      ctx.fillText(`${String(score).padStart(6, '0')}`, 20, 34);

      ctx.fillText(`WORLD`, 180, 20);
      ctx.fillText(`1-${level}`, 196, 34);

      ctx.fillText(`LIVES`, 320, 20);
      ctx.fillText(`x ${lives}`, 332, 34);

      if (cheats.god_mode) {
        ctx.fillStyle = '#f59e0b';
        ctx.fillText(`[STAR-INVULNERABLE]`, 140, 50);
      }

      // Game Over / Win Overlay
      if (gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = '#e11d48';
        ctx.font = '18px "Press Start 2P", monospace';
        ctx.fillText('GAME OVER', width / 2 - 80, height / 2 - 10);
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px "Press Start 2P", monospace';
        ctx.fillText('PREMI START / RESET PER RIGIOCARE', width / 2 - 145, height / 2 + 25);
      } else if (win) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = '#10b981';
        ctx.font = '16px "Press Start 2P", monospace';
        ctx.fillText('CORSO COMPLETATO!', width / 2 - 110, height / 2 - 10);
        ctx.fillStyle = '#facc15';
        ctx.font = '10px "Press Start 2P", monospace';
        ctx.fillText(`PUNTEGGIO FINALE: ${score}`, width / 2 - 100, height / 2 + 20);
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
      lives = cheats.inf_lives ? 99 : 3;
      level = 1;
      gameOver = false;
      win = false;
      isPaused = false;
      initLevel();
    },

    getState() {
      return {
        score,
        lives,
        level,
        player: { ...player },
        cameraX,
        flagY,
        flagReached,
        blocks: blocks.map(b => ({ ...b })),
        enemies: enemies.map(e => ({ ...e }))
      };
    },

    loadState(state: any) {
      if (!state) return;
      score = state.score || 0;
      lives = state.lives || 3;
      level = state.level || 1;
      if (state.player) Object.assign(player, state.player);
      cameraX = state.cameraX || 0;
      flagY = state.flagY || 80;
      flagReached = state.flagReached || false;
      if (state.blocks) blocks = state.blocks;
      if (state.enemies) enemies = state.enemies;
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
        highScore
      };
    },

    togglePause() {
      isPaused = !isPaused;
      return isPaused;
    }
  };
}
