import { RetroEngineInstance, EngineStats } from './engineTypes';
import { retroAudio } from '../audio/retroAudio';

export function createPacMazeEngine(): RetroEngineInstance {
  let score = 0;
  let highScore = 18450;
  let lives = 3;
  let level = 1;
  let gameOver = false;
  let win = false;
  let isPaused = false;

  let cheats = {
    speed_pac: false,
    perm_power: false,
  };

  const TILE_SIZE = 12;
  const COLS = 28;
  const ROWS = 24;

  // 1 = wall, 0 = dot, 2 = empty/path, 3 = energizer pellet
  const baseMap = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,3,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,3,1],
    [1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1],
    [1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,0,1],
    [1,0,0,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,0,1,1,1,1,1,2,1,1,2,1,1,1,1,1,0,1,1,1,1,1,1],
    [2,2,2,2,2,1,0,1,1,2,2,2,2,2,2,2,2,2,2,1,1,0,1,2,2,2,2,2],
    [1,1,1,1,1,1,0,1,1,2,1,1,1,2,2,1,1,1,2,1,1,0,1,1,1,1,1,1],
    [2,2,2,2,2,2,0,2,2,2,1,2,2,2,2,2,2,1,2,2,2,0,2,2,2,2,2,2], // Tunnel row
    [1,1,1,1,1,1,0,1,1,2,1,1,1,1,1,1,1,1,2,1,1,0,1,1,1,1,1,1],
    [2,2,2,2,2,1,0,1,1,2,2,2,2,2,2,2,2,2,2,1,1,0,1,2,2,2,2,2],
    [1,1,1,1,1,1,0,1,1,2,1,1,1,1,1,1,1,1,2,1,1,0,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1],
    [1,3,0,0,1,1,0,0,0,0,0,0,0,2,2,0,0,0,0,0,0,0,1,1,0,0,3,1],
    [1,1,1,0,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,0,1,1,1],
    [1,0,0,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,0,0,1],
    [1,0,1,1,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  ];

  let grid: number[][] = [];
  let dotsRemaining = 0;

  let pacman = {
    x: 13.5 * TILE_SIZE,
    y: 16 * TILE_SIZE,
    dx: 0,
    dy: 0,
    nextDx: 0,
    nextDy: 0,
    speed: 1.8,
    angle: 0,
    mouthAngle: 0.2,
    mouthDir: 0.05,
  };

  interface Ghost {
    x: number;
    y: number;
    dx: number;
    dy: number;
    name: string;
    color: string;
    isFrightened: boolean;
    respawnTimer: number;
  }

  let ghosts: Ghost[] = [];
  let powerTimer = 0;

  function initBoard() {
    grid = baseMap.map(row => [...row]);
    dotsRemaining = 0;
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[r].length; c++) {
        if (grid[r][c] === 0 || grid[r][c] === 3) dotsRemaining++;
      }
    }

    pacman.x = 13.5 * TILE_SIZE;
    pacman.y = 16 * TILE_SIZE;
    pacman.dx = 0;
    pacman.dy = 0;
    pacman.nextDx = 0;
    pacman.nextDy = 0;

    ghosts = [
      { x: 13 * TILE_SIZE, y: 9 * TILE_SIZE, dx: 1, dy: 0, name: 'Blinky', color: '#ef4444', isFrightened: false, respawnTimer: 0 },
      { x: 14 * TILE_SIZE, y: 10 * TILE_SIZE, dx: -1, dy: 0, name: 'Pinky', color: '#f472b6', isFrightened: false, respawnTimer: 0 },
      { x: 12 * TILE_SIZE, y: 10 * TILE_SIZE, dx: 1, dy: 0, name: 'Inky', color: '#38bdf8', isFrightened: false, respawnTimer: 0 },
      { x: 15 * TILE_SIZE, y: 10 * TILE_SIZE, dx: -1, dy: 0, name: 'Clyde', color: '#fb923c', isFrightened: false, respawnTimer: 0 },
    ];
  }

  initBoard();

  function canMoveTo(x: number, y: number): boolean {
    const r = Math.floor(y / TILE_SIZE);
    const c = Math.floor(x / TILE_SIZE);
    if (r < 0 || r >= grid.length) return true;
    if (c < 0 || c >= COLS) return true; // Tunnels
    return grid[r][c] !== 1;
  }

  return {
    update(inputs: Record<string, boolean>, dt: number) {
      if (isPaused || gameOver) return;

      const spd = (cheats.speed_pac ? 3.0 : 1.8);
      pacman.speed = spd;

      // Handle input directions
      if (inputs.left) {
        pacman.nextDx = -spd;
        pacman.nextDy = 0;
      } else if (inputs.right) {
        pacman.nextDx = spd;
        pacman.nextDy = 0;
      } else if (inputs.up) {
        pacman.nextDx = 0;
        pacman.nextDy = -spd;
      } else if (inputs.down) {
        pacman.nextDx = 0;
        pacman.nextDy = spd;
      }

      // Try turning if aligned with grid
      const gridX = Math.round(pacman.x / TILE_SIZE) * TILE_SIZE;
      const gridY = Math.round(pacman.y / TILE_SIZE) * TILE_SIZE;

      if (Math.abs(pacman.x - gridX) < 3 && Math.abs(pacman.y - gridY) < 3) {
        if (canMoveTo(gridX + Math.sign(pacman.nextDx) * TILE_SIZE, gridY + Math.sign(pacman.nextDy) * TILE_SIZE)) {
          pacman.x = gridX;
          pacman.y = gridY;
          pacman.dx = pacman.nextDx;
          pacman.dy = pacman.nextDy;
        }
      }

      // Check current direction collision
      const targetX = pacman.x + pacman.dx + (pacman.dx > 0 ? 5 : -5);
      const targetY = pacman.y + pacman.dy + (pacman.dy > 0 ? 5 : -5);

      if (canMoveTo(targetX, targetY)) {
        pacman.x += pacman.dx;
        pacman.y += pacman.dy;
      } else {
        pacman.dx = 0;
        pacman.dy = 0;
      }

      // Tunnel Wrap
      if (pacman.x < 0) pacman.x = (COLS - 1) * TILE_SIZE;
      if (pacman.x > (COLS - 1) * TILE_SIZE) pacman.x = 0;

      // Pacman mouth animation
      pacman.mouthAngle += pacman.mouthDir;
      if (pacman.mouthAngle > 0.4 || pacman.mouthAngle < 0.05) {
        pacman.mouthDir *= -1;
      }

      // Dot Eating
      const curR = Math.floor((pacman.y + 6) / TILE_SIZE);
      const curC = Math.floor((pacman.x + 6) / TILE_SIZE);

      if (curR >= 0 && curR < grid.length && curC >= 0 && curC < COLS) {
        if (grid[curR][curC] === 0) {
          grid[curR][curC] = 2;
          score += 10;
          dotsRemaining--;
          retroAudio.playSelect();
        } else if (grid[curR][curC] === 3) {
          grid[curR][curC] = 2;
          score += 50;
          dotsRemaining--;
          powerTimer = cheats.perm_power ? 9999 : 280;
          retroAudio.playCoin();
          ghosts.forEach(g => (g.isFrightened = true));
        }
      }

      // Victory
      if (dotsRemaining <= 0) {
        win = true;
        score += 2000;
        retroAudio.playStartChime();
        initBoard();
        return;
      }

      // Power timer countdown
      if (powerTimer > 0) {
        powerTimer--;
        if (powerTimer === 0 && !cheats.perm_power) {
          ghosts.forEach(g => (g.isFrightened = false));
        }
      }

      // Ghost AI Movement
      const gSpeed = 1.3;
      for (const ghost of ghosts) {
        if (ghost.respawnTimer > 0) {
          ghost.respawnTimer--;
          continue;
        }

        ghost.x += ghost.dx * gSpeed;
        ghost.y += ghost.dy * gSpeed;

        // Tunnel
        if (ghost.x < 0) ghost.x = (COLS - 1) * TILE_SIZE;
        if (ghost.x > (COLS - 1) * TILE_SIZE) ghost.x = 0;

        // Turn at intersections
        const gx = Math.round(ghost.x / TILE_SIZE) * TILE_SIZE;
        const gy = Math.round(ghost.y / TILE_SIZE) * TILE_SIZE;

        if (Math.abs(ghost.x - gx) < 2 && Math.abs(ghost.y - gy) < 2) {
          ghost.x = gx;
          ghost.y = gy;
          const dirs = [
            { dx: 1, dy: 0 },
            { dx: -1, dy: 0 },
            { dx: 0, dy: 1 },
            { dx: 0, dy: -1 },
          ];
          // Filter valid
          const valid = dirs.filter(d => {
            // No 180 flip unless dead end
            if (d.dx === -ghost.dx && d.dy === -ghost.dy) return false;
            return canMoveTo(gx + d.dx * TILE_SIZE, gy + d.dy * TILE_SIZE);
          });

          if (valid.length > 0) {
            // Simple chase / scatter target
            const chosen = valid[Math.floor(Math.random() * valid.length)];
            ghost.dx = chosen.dx;
            ghost.dy = chosen.dy;
          }
        }

        // Collision with Pacman
        const dist = Math.hypot(pacman.x - ghost.x, pacman.y - ghost.y);
        if (dist < 10) {
          if (ghost.isFrightened) {
            score += 200;
            ghost.respawnTimer = 180;
            ghost.x = 13 * TILE_SIZE;
            ghost.y = 10 * TILE_SIZE;
            ghost.isFrightened = false;
            retroAudio.playPowerUp();
          } else {
            lives--;
            retroAudio.playExplosion();
            if (lives <= 0) {
              gameOver = true;
            } else {
              pacman.x = 13.5 * TILE_SIZE;
              pacman.y = 16 * TILE_SIZE;
              pacman.dx = 0;
              pacman.dy = 0;
            }
          }
        }
      }
    },

    render(ctx: CanvasRenderingContext2D, width: number, height: number) {
      // Classic Arcade Black
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, width, height);

      // Offset to center
      const offsetX = 28;
      const offsetY = 25;

      ctx.save();
      ctx.translate(offsetX, offsetY);

      // Render Maze
      for (let r = 0; r < grid.length; r++) {
        for (let c = 0; c < grid[r].length; c++) {
          const tile = grid[r][c];
          const x = c * TILE_SIZE;
          const y = r * TILE_SIZE;

          if (tile === 1) {
            // Blue Neon Wall
            ctx.fillStyle = '#1e3a8a';
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 1;
            ctx.strokeRect(x + 1, y + 1, TILE_SIZE - 2, TILE_SIZE - 2);
          } else if (tile === 0) {
            // Yellow Pellet Dot
            ctx.fillStyle = '#fde047';
            ctx.beginPath();
            ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE / 2, 2, 0, Math.PI * 2);
            ctx.fill();
          } else if (tile === 3) {
            // Large Energizer
            ctx.fillStyle = '#facc15';
            ctx.beginPath();
            ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE / 2, 5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // Render Ghosts
      for (const ghost of ghosts) {
        if (ghost.respawnTimer > 0) continue;
        const gx = ghost.x + TILE_SIZE / 2;
        const gy = ghost.y + TILE_SIZE / 2;
        const gColor = ghost.isFrightened ? (powerTimer < 60 && powerTimer % 8 < 4 ? '#ffffff' : '#2563eb') : ghost.color;

        ctx.fillStyle = gColor;
        ctx.beginPath();
        ctx.arc(gx, gy - 2, 6, Math.PI, 0);
        ctx.lineTo(gx + 6, gy + 6);
        ctx.lineTo(gx + 2, gy + 4);
        ctx.lineTo(gx - 2, gy + 6);
        ctx.lineTo(gx - 6, gy + 4);
        ctx.closePath();
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(gx - 4, gy - 4, 3, 4);
        ctx.fillRect(gx + 1, gy - 4, 3, 4);
        ctx.fillStyle = '#020617';
        ctx.fillRect(gx - 3, gy - 3, 2, 2);
        ctx.fillRect(gx + 2, gy - 3, 2, 2);
      }

      // Render Pac-Man
      const px = pacman.x + TILE_SIZE / 2;
      const py = pacman.y + TILE_SIZE / 2;
      let rot = 0;
      if (pacman.dx > 0) rot = 0;
      else if (pacman.dx < 0) rot = Math.PI;
      else if (pacman.dy > 0) rot = Math.PI / 2;
      else if (pacman.dy < 0) rot = -Math.PI / 2;

      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(px, py, 7, rot + pacman.mouthAngle, rot + Math.PI * 2 - pacman.mouthAngle);
      ctx.lineTo(px, py);
      ctx.fill();

      ctx.restore();

      // Top Scores
      ctx.fillStyle = '#ffffff';
      ctx.font = '10px "Press Start 2P", monospace';
      ctx.fillText(`1UP`, 30, 18);
      ctx.fillText(`${String(score).padStart(5, '0')}`, 30, 32);

      ctx.fillText(`HIGH SCORE`, 150, 18);
      ctx.fillText(`${String(Math.max(score, highScore)).padStart(5, '0')}`, 170, 32);

      ctx.fillText(`LIVES: ${lives}`, 290, 18);

      if (gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = '#ef4444';
        ctx.font = '16px "Press Start 2P", monospace';
        ctx.fillText('GAME OVER', width / 2 - 75, height / 2);
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
      initBoard();
    },

    getState() {
      return {
        score,
        lives,
        level,
        dotsRemaining,
        pacman: { ...pacman },
        ghosts: ghosts.map(g => ({ ...g })),
        grid: grid.map(r => [...r]),
      };
    },

    loadState(state: any) {
      if (!state) return;
      score = state.score || 0;
      lives = state.lives || 3;
      level = state.level || 1;
      dotsRemaining = state.dotsRemaining || 100;
      if (state.pacman) Object.assign(pacman, state.pacman);
      if (state.ghosts) ghosts = state.ghosts;
      if (state.grid) grid = state.grid;
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
