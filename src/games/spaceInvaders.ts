import { RetroEngineInstance, EngineStats } from './engineTypes';
import { retroAudio } from '../audio/retroAudio';

export function createSpaceInvadersEngine(): RetroEngineInstance {
  let score = 0;
  let highScore = 9990;
  let lives = 3;
  let level = 1;
  let gameOver = false;
  let win = false;
  let isPaused = false;

  let cheats = {
    rapid_fire: false,
    shield_heal: false,
    ufo_frenzy: false,
  };

  let player = {
    x: 180,
    y: 270,
    w: 24,
    h: 14,
    speed: 3,
  };

  let bullets: { x: number; y: number; vy: number; isEnemy: boolean }[] = [];
  let reloadTimer = 0;

  interface Alien {
    x: number;
    y: number;
    row: number;
    col: number;
    alive: boolean;
    frame: number;
  }

  let aliens: Alien[] = [];
  let alienDir = 1;
  let alienSpeed = 0.5;
  let alienStepTimer = 0;
  let alienMoveInterval = 25; // Decreases as fewer aliens remain
  let animationFrame = 0;

  // 4 destructible bunkers
  interface BunkerCell {
    x: number;
    y: number;
    hp: number;
  }
  let bunkers: BunkerCell[] = [];

  // UFO
  let ufo = {
    active: false,
    x: -40,
    y: 42,
    speed: 2,
    timer: 200,
  };

  function initAliens() {
    aliens = [];
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 10; c++) {
        aliens.push({
          x: 40 + c * 30,
          y: 70 + r * 22,
          row: r,
          col: c,
          alive: true,
          frame: 0,
        });
      }
    }
    alienDir = 1;
    alienMoveInterval = 24;
  }

  function initBunkers() {
    bunkers = [];
    const bunkerXPositions = [60, 140, 220, 300];
    for (const bx of bunkerXPositions) {
      for (let rx = 0; rx < 5; rx++) {
        for (let ry = 0; ry < 4; ry++) {
          // Arch notch in bottom center
          if (ry === 3 && (rx === 2)) continue;
          bunkers.push({
            x: bx + rx * 6,
            y: 235 + ry * 6,
            hp: 2,
          });
        }
      }
    }
  }

  initAliens();
  initBunkers();

  return {
    update(inputs: Record<string, boolean>, dt: number) {
      if (isPaused || gameOver) return;

      // Player move
      if (inputs.left && player.x > 15) {
        player.x -= player.speed;
      }
      if (inputs.right && player.x < 365) {
        player.x += player.speed;
      }

      // Shoot
      if (reloadTimer > 0) reloadTimer--;
      const maxBullets = cheats.rapid_fire ? 5 : 1;
      const playerBulletsCount = bullets.filter(b => !b.isEnemy).length;

      if ((inputs.a || inputs.b || inputs.up) && reloadTimer <= 0 && playerBulletsCount < maxBullets) {
        bullets.push({
          x: player.x + player.w / 2 - 1.5,
          y: player.y - 4,
          vy: -6,
          isEnemy: false,
        });
        reloadTimer = cheats.rapid_fire ? 4 : 18;
        retroAudio.playLaser();
      }

      // UFO logic
      if (cheats.ufo_frenzy && !ufo.active) {
        ufo.active = true;
        ufo.x = -30;
      }
      if (!ufo.active) {
        ufo.timer--;
        if (ufo.timer <= 0) {
          ufo.active = true;
          ufo.x = -30;
          ufo.timer = 500;
        }
      } else {
        ufo.x += ufo.speed;
        if (ufo.x > 420) {
          ufo.active = false;
        }
      }

      // Aliens movement step
      alienStepTimer++;
      const aliveAliens = aliens.filter(a => a.alive);

      if (aliveAliens.length === 0) {
        win = true;
        level++;
        score += 1000;
        initAliens();
        return;
      }

      alienMoveInterval = Math.max(3, Math.floor((aliveAliens.length / 50) * 22));

      if (alienStepTimer >= alienMoveInterval) {
        alienStepTimer = 0;
        animationFrame = 1 - animationFrame;

        // Check if hitting wall
        let hitEdge = false;
        for (const alien of aliveAliens) {
          if ((alienDir > 0 && alien.x >= 360) || (alienDir < 0 && alien.x <= 20)) {
            hitEdge = true;
            break;
          }
        }

        if (hitEdge) {
          alienDir = -alienDir;
          for (const alien of aliveAliens) {
            alien.y += 10;
            // Invasion reached ground?
            if (alien.y >= 235) {
              gameOver = true;
              retroAudio.playExplosion();
            }
          }
        } else {
          for (const alien of aliveAliens) {
            alien.x += alienDir * 6;
          }
        }

        // Alien shooting bomb
        if (Math.random() < 0.45 + (1 - aliveAliens.length / 50) * 0.4) {
          const shooter = aliveAliens[Math.floor(Math.random() * aliveAliens.length)];
          bullets.push({
            x: shooter.x + 9,
            y: shooter.y + 14,
            vy: 3.5,
            isEnemy: true,
          });
        }
      }

      // Bullets update & collision
      for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.y += b.vy;

        // Remove out of bounds
        if (b.y < 20 || b.y > 300) {
          bullets.splice(i, 1);
          continue;
        }

        // UFO hit check
        if (!b.isEnemy && ufo.active && b.x >= ufo.x && b.x <= ufo.x + 32 && b.y >= ufo.y && b.y <= ufo.y + 14) {
          ufo.active = false;
          score += 300;
          retroAudio.playExplosion();
          bullets.splice(i, 1);
          continue;
        }

        // Bunker hits
        let hitBunker = false;
        for (let k = bunkers.length - 1; k >= 0; k--) {
          const cell = bunkers[k];
          if (b.x >= cell.x && b.x <= cell.x + 6 && b.y >= cell.y && b.y <= cell.y + 6) {
            if (!cheats.shield_heal) {
              cell.hp--;
              if (cell.hp <= 0) {
                bunkers.splice(k, 1);
              }
            }
            bullets.splice(i, 1);
            hitBunker = true;
            break;
          }
        }
        if (hitBunker) continue;

        // Alien hits
        if (!b.isEnemy) {
          let hitAlien = false;
          for (const alien of aliveAliens) {
            if (b.x >= alien.x && b.x <= alien.x + 18 && b.y >= alien.y && b.y <= alien.y + 14) {
              alien.alive = false;
              bullets.splice(i, 1);
              hitAlien = true;
              score += (5 - alien.row) * 10;
              retroAudio.playExplosion();
              break;
            }
          }
          if (hitAlien) continue;
        }

        // Player hit
        if (b.isEnemy) {
          if (b.x >= player.x && b.x <= player.x + player.w && b.y >= player.y && b.y <= player.y + player.h) {
            bullets.splice(i, 1);
            lives--;
            retroAudio.playExplosion();
            if (lives <= 0) {
              gameOver = true;
            }
          }
        }
      }
    },

    render(ctx: CanvasRenderingContext2D, width: number, height: number) {
      // Classic Arcade Black Space
      ctx.fillStyle = '#05070f';
      ctx.fillRect(0, 0, width, height);

      // Starfield background
      ctx.fillStyle = '#475569';
      for (let s = 0; s < 30; s++) {
        const sx = (s * 47) % width;
        const sy = (s * 83) % height;
        ctx.fillRect(sx, sy, 1, 1);
      }

      // HUD
      ctx.fillStyle = '#ffffff';
      ctx.font = '10px "Press Start 2P", monospace';
      ctx.fillText(`SCORE<1>`, 20, 20);
      ctx.fillText(`${String(score).padStart(4, '0')}`, 30, 34);

      ctx.fillText(`HI-SCORE`, 150, 20);
      ctx.fillText(`${String(Math.max(score, highScore)).padStart(4, '0')}`, 160, 34);

      ctx.fillText(`LIVES: ${lives}`, 290, 20);

      // Top UFO
      if (ufo.active) {
        ctx.fillStyle = '#e11d48';
        // Flying Saucer
        ctx.fillRect(ufo.x + 8, ufo.y, 16, 4);
        ctx.fillRect(ufo.x + 4, ufo.y + 4, 24, 6);
        ctx.fillRect(ufo.x, ufo.y + 7, 32, 4);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(ufo.x + 8, ufo.y + 5, 4, 3);
        ctx.fillRect(ufo.x + 20, ufo.y + 5, 4, 3);
      }

      // Aliens
      const alienColors = ['#f43f5e', '#a855f7', '#3b82f6', '#10b981', '#10b981'];
      for (const alien of aliens) {
        if (!alien.alive) continue;
        ctx.fillStyle = alienColors[alien.row];
        const ax = alien.x;
        const ay = alien.y;

        // Pixel alien rendering
        if (alien.row === 0) {
          // Squid top invader
          ctx.fillRect(ax + 5, ay, 8, 3);
          ctx.fillRect(ax + 3, ay + 3, 12, 5);
          ctx.fillRect(ax + 1, ay + 8, 16, 3);
          if (animationFrame === 0) {
            ctx.fillRect(ax, ay + 11, 4, 4);
            ctx.fillRect(ax + 14, ay + 11, 4, 4);
          } else {
            ctx.fillRect(ax + 4, ay + 11, 4, 4);
            ctx.fillRect(ax + 10, ay + 11, 4, 4);
          }
        } else if (alien.row <= 2) {
          // Crab invader
          ctx.fillRect(ax + 4, ay, 10, 3);
          ctx.fillRect(ax + 2, ay + 3, 14, 6);
          ctx.fillRect(ax, ay + 9, 18, 3);
          if (animationFrame === 0) {
            ctx.fillRect(ax, ay + 12, 3, 3);
            ctx.fillRect(ax + 15, ay + 12, 3, 3);
          } else {
            ctx.fillRect(ax + 5, ay + 12, 3, 3);
            ctx.fillRect(ax + 10, ay + 12, 3, 3);
          }
        } else {
          // Octopus bottom invader
          ctx.fillRect(ax + 3, ay, 12, 4);
          ctx.fillRect(ax + 1, ay + 4, 16, 5);
          ctx.fillRect(ax, ay + 9, 18, 4);
          if (animationFrame === 0) {
            ctx.fillRect(ax + 1, ay + 13, 4, 3);
            ctx.fillRect(ax + 13, ay + 13, 4, 3);
          } else {
            ctx.fillRect(ax + 5, ay + 13, 8, 3);
          }
        }

        // Eyes
        ctx.fillStyle = '#05070f';
        ctx.fillRect(ax + 5, ay + 4, 2, 3);
        ctx.fillRect(ax + 11, ay + 4, 2, 3);
      }

      // Bunkers (Green Shields)
      for (const cell of bunkers) {
        ctx.fillStyle = cell.hp === 2 ? '#22c55e' : '#15803d';
        ctx.fillRect(cell.x, cell.y, 6, 6);
      }

      // Player Cannon (Green base)
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(player.x + 10, player.y - 4, 4, 6);
      ctx.fillRect(player.x + 3, player.y + 2, 18, 6);
      ctx.fillRect(player.x, player.y + 8, 24, 6);

      // Bullets
      for (const b of bullets) {
        ctx.fillStyle = b.isEnemy ? '#ef4444' : '#facc15';
        ctx.fillRect(b.x, b.y, 3, 7);
      }

      // Ground line
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(0, 290, width, 2);

      // Game Over / Pause
      if (gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = '#ef4444';
        ctx.font = '16px "Press Start 2P", monospace';
        ctx.fillText('GAME OVER', width / 2 - 75, height / 2 - 10);
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px "Press Start 2P", monospace';
        ctx.fillText('INVASIONE RIUSCITA', width / 2 - 85, height / 2 + 15);
      } else if (win) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = '#22c55e';
        ctx.font = '14px "Press Start 2P", monospace';
        ctx.fillText('ONDATA RESPINTA!', width / 2 - 95, height / 2 - 10);
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
      bullets = [];
      initAliens();
      initBunkers();
    },

    getState() {
      return {
        score,
        lives,
        level,
        player: { ...player },
        bullets: [...bullets],
        aliens: aliens.map(a => ({ ...a })),
        bunkers: bunkers.map(b => ({ ...b })),
      };
    },

    loadState(state: any) {
      if (!state) return;
      score = state.score || 0;
      lives = state.lives || 3;
      level = state.level || 1;
      if (state.player) Object.assign(player, state.player);
      if (state.bullets) bullets = state.bullets;
      if (state.aliens) aliens = state.aliens;
      if (state.bunkers) bunkers = state.bunkers;
      gameOver = false;
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
