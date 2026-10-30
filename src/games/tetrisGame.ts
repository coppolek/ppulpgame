import { RetroEngineInstance, EngineStats } from './engineTypes';
import { retroAudio } from '../audio/retroAudio';

export function createTetrisEngine(): RetroEngineInstance {
  let score = 0;
  let highScore = 42000;
  let lines = 0;
  let level = 1;
  let gameOver = false;
  let win = false;
  let isPaused = false;

  let cheats = {
    slow_fall: false,
    line_helper: false,
  };

  const COLS = 10;
  const ROWS = 20;
  const BLOCK_SIZE = 14;

  let grid: (string | null)[][] = Array(ROWS).fill(null).map(() => Array(COLS).fill(null));

  // Tetromino definitions
  const TETROMINOES = {
    I: { color: '#00f0f0', matrix: [[1, 1, 1, 1]] },
    O: { color: '#f0f000', matrix: [[1, 1], [1, 1]] },
    T: { color: '#a000f0', matrix: [[0, 1, 0], [1, 1, 1]] },
    S: { color: '#00f000', matrix: [[0, 1, 1], [1, 1, 0]] },
    Z: { color: '#f00000', matrix: [[1, 1, 0], [0, 1, 1]] },
    J: { color: '#0000f0', matrix: [[1, 0, 0], [1, 1, 1]] },
    L: { color: '#f0a000', matrix: [[0, 0, 1], [1, 1, 1]] },
  };

  type TetroType = keyof typeof TETROMINOES;
  const PIECE_KEYS: TetroType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

  let currentPiece: {
    type: TetroType;
    matrix: number[][];
    color: string;
    x: number;
    y: number;
  };

  let nextPieceType: TetroType = 'T';
  let dropCounter = 0;
  let dropInterval = 45;
  let flashLines: number[] = [];
  let flashTimer = 0;

  function rotateMatrix(matrix: number[][]): number[][] {
    const rows = matrix.length;
    const cols = matrix[0].length;
    const result: number[][] = [];
    for (let c = 0; c < cols; c++) {
      const newRow: number[] = [];
      for (let r = rows - 1; r >= 0; r--) {
        newRow.push(matrix[r][c]);
      }
      result.push(newRow);
    }
    return result;
  }

  function spawnPiece() {
    const type = nextPieceType;
    nextPieceType = PIECE_KEYS[Math.floor(Math.random() * PIECE_KEYS.length)];
    const def = TETROMINOES[type];
    currentPiece = {
      type,
      matrix: def.matrix.map(row => [...row]),
      color: def.color,
      x: Math.floor(COLS / 2) - Math.floor(def.matrix[0].length / 2),
      y: 0,
    };

    // Check game over on spawn
    if (collides(currentPiece.matrix, currentPiece.x, currentPiece.y)) {
      gameOver = true;
      retroAudio.playExplosion();
    }
  }

  function collides(matrix: number[][], posX: number, posY: number): boolean {
    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (matrix[r][c] !== 0) {
          const newX = posX + c;
          const newY = posY + r;
          if (newX < 0 || newX >= COLS || newY >= ROWS) return true;
          if (newY >= 0 && grid[newY][newX] !== null) return true;
        }
      }
    }
    return false;
  }

  function lockPiece() {
    for (let r = 0; r < currentPiece.matrix.length; r++) {
      for (let c = 0; c < currentPiece.matrix[r].length; c++) {
        if (currentPiece.matrix[r][c] !== 0) {
          const gy = currentPiece.y + r;
          const gx = currentPiece.x + c;
          if (gy >= 0 && gy < ROWS && gx >= 0 && gx < COLS) {
            grid[gy][gx] = currentPiece.color;
          }
        }
      }
    }

    // Check full lines
    const cleared: number[] = [];
    for (let r = ROWS - 1; r >= 0; r--) {
      if (grid[r].every(cell => cell !== null)) {
        cleared.push(r);
      }
    }

    if (cleared.length > 0) {
      flashLines = cleared;
      flashTimer = 10;
      lines += cleared.length;
      level = Math.floor(lines / 10) + 1;
      const pts = [0, 100, 300, 500, 1200][cleared.length] * level;
      score += pts;

      if (cleared.length === 4) {
        retroAudio.playPowerUp();
      } else {
        retroAudio.playCoin();
      }

      // Remove lines
      for (const r of cleared) {
        grid.splice(r, 1);
        grid.unshift(Array(COLS).fill(null));
      }
    } else {
      retroAudio.playSelect();
    }

    spawnPiece();
  }

  nextPieceType = PIECE_KEYS[Math.floor(Math.random() * PIECE_KEYS.length)];
  spawnPiece();

  let lastInputMove = 0;

  return {
    update(inputs: Record<string, boolean>, dt: number) {
      if (isPaused || gameOver) return;

      lastInputMove++;

      // Cheat line helper
      if (cheats.line_helper) {
        cheats.line_helper = false;
        grid.pop();
        grid.pop();
        grid.unshift(Array(COLS).fill(null), Array(COLS).fill(null));
        retroAudio.playLaser();
      }

      // Move Left
      if (inputs.left && lastInputMove > 6) {
        if (!collides(currentPiece.matrix, currentPiece.x - 1, currentPiece.y)) {
          currentPiece.x--;
          lastInputMove = 0;
          retroAudio.playSelect();
        }
      }

      // Move Right
      if (inputs.right && lastInputMove > 6) {
        if (!collides(currentPiece.matrix, currentPiece.x + 1, currentPiece.y)) {
          currentPiece.x++;
          lastInputMove = 0;
          retroAudio.playSelect();
        }
      }

      // Rotate
      if ((inputs.up || inputs.a || inputs.b) && lastInputMove > 8) {
        const rotated = rotateMatrix(currentPiece.matrix);
        // Wall kick attempt
        if (!collides(rotated, currentPiece.x, currentPiece.y)) {
          currentPiece.matrix = rotated;
          lastInputMove = 0;
          retroAudio.playJump();
        } else if (!collides(rotated, currentPiece.x - 1, currentPiece.y)) {
          currentPiece.x--;
          currentPiece.matrix = rotated;
          lastInputMove = 0;
          retroAudio.playJump();
        } else if (!collides(rotated, currentPiece.x + 1, currentPiece.y)) {
          currentPiece.x++;
          currentPiece.matrix = rotated;
          lastInputMove = 0;
          retroAudio.playJump();
        }
      }

      // Hard Drop on Turbo or space
      if ((inputs.x || inputs.turboA) && lastInputMove > 10) {
        while (!collides(currentPiece.matrix, currentPiece.x, currentPiece.y + 1)) {
          currentPiece.y++;
          score += 2;
        }
        lockPiece();
        lastInputMove = 0;
        return;
      }

      // Gravity fall interval
      const baseSpeed = cheats.slow_fall ? 60 : Math.max(8, 48 - (level - 1) * 4);
      const currentInterval = inputs.down ? 3 : baseSpeed;

      dropCounter++;
      if (dropCounter >= currentInterval) {
        dropCounter = 0;
        if (!collides(currentPiece.matrix, currentPiece.x, currentPiece.y + 1)) {
          currentPiece.y++;
          if (inputs.down) score += 1;
        } else {
          lockPiece();
        }
      }
    },

    render(ctx: CanvasRenderingContext2D, width: number, height: number) {
      // Game Boy classic dark green background
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, width, height);

      const boardX = 80;
      const boardY = 16;
      const boardW = COLS * BLOCK_SIZE;
      const boardH = ROWS * BLOCK_SIZE;

      // Board Frame
      ctx.fillStyle = '#020617';
      ctx.fillRect(boardX - 4, boardY - 4, boardW + 8, boardH + 8);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.strokeRect(boardX - 4, boardY - 4, boardW + 8, boardH + 8);

      // Render Matrix Grid
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const cell = grid[r][c];
          const bx = boardX + c * BLOCK_SIZE;
          const by = boardY + r * BLOCK_SIZE;

          if (cell) {
            ctx.fillStyle = cell;
            ctx.fillRect(bx, by, BLOCK_SIZE, BLOCK_SIZE);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.strokeRect(bx + 1, by + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2);
          } else {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
            ctx.strokeRect(bx, by, BLOCK_SIZE, BLOCK_SIZE);
          }
        }
      }

      // Ghost piece (shows landing location)
      let ghostY = currentPiece.y;
      while (!collides(currentPiece.matrix, currentPiece.x, ghostY + 1)) {
        ghostY++;
      }
      for (let r = 0; r < currentPiece.matrix.length; r++) {
        for (let c = 0; c < currentPiece.matrix[r].length; c++) {
          if (currentPiece.matrix[r][c] !== 0) {
            const gx = boardX + (currentPiece.x + c) * BLOCK_SIZE;
            const gy = boardY + (ghostY + r) * BLOCK_SIZE;
            ctx.strokeStyle = currentPiece.color;
            ctx.lineWidth = 1;
            ctx.setLineDash([2, 2]);
            ctx.strokeRect(gx + 1, gy + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2);
            ctx.setLineDash([]);
          }
        }
      }

      // Active falling piece
      for (let r = 0; r < currentPiece.matrix.length; r++) {
        for (let c = 0; c < currentPiece.matrix[r].length; c++) {
          if (currentPiece.matrix[r][c] !== 0) {
            const px = boardX + (currentPiece.x + c) * BLOCK_SIZE;
            const py = boardY + (currentPiece.y + r) * BLOCK_SIZE;
            ctx.fillStyle = currentPiece.color;
            ctx.fillRect(px, py, BLOCK_SIZE, BLOCK_SIZE);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.lineWidth = 1;
            ctx.strokeRect(px + 1, py + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2);
          }
        }
      }

      // Right Stats & Next Piece Panel
      ctx.fillStyle = '#ffffff';
      ctx.font = '9px "Press Start 2P", monospace';
      ctx.fillText(`NEXT`, 245, 35);

      // Next piece box
      ctx.fillStyle = '#020617';
      ctx.fillRect(240, 45, 60, 60);
      ctx.strokeStyle = '#475569';
      ctx.strokeRect(240, 45, 60, 60);

      const nextDef = TETROMINOES[nextPieceType];
      for (let r = 0; r < nextDef.matrix.length; r++) {
        for (let c = 0; c < nextDef.matrix[r].length; c++) {
          if (nextDef.matrix[r][c] !== 0) {
            const nx = 252 + c * 11;
            const ny = 58 + r * 11;
            ctx.fillStyle = nextDef.color;
            ctx.fillRect(nx, ny, 10, 10);
            ctx.strokeStyle = '#fff';
            ctx.strokeRect(nx, ny, 10, 10);
          }
        }
      }

      ctx.fillStyle = '#ffffff';
      ctx.fillText(`SCORE`, 245, 130);
      ctx.fillStyle = '#facc15';
      ctx.fillText(`${score}`, 245, 145);

      ctx.fillStyle = '#ffffff';
      ctx.fillText(`LINES`, 245, 175);
      ctx.fillStyle = '#38bdf8';
      ctx.fillText(`${lines}`, 245, 190);

      ctx.fillStyle = '#ffffff';
      ctx.fillText(`LEVEL`, 245, 220);
      ctx.fillStyle = '#4ade80';
      ctx.fillText(`${level}`, 245, 235);

      if (gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = '#ef4444';
        ctx.font = '16px "Press Start 2P", monospace';
        ctx.fillText('GAME OVER', width / 2 - 75, height / 2 - 10);
        ctx.fillStyle = '#ffffff';
        ctx.font = '9px "Press Start 2P", monospace';
        ctx.fillText('PREMI RESET PER GIOCARE', width / 2 - 95, height / 2 + 15);
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
      lines = 0;
      level = 1;
      gameOver = false;
      win = false;
      grid = Array(ROWS).fill(null).map(() => Array(COLS).fill(null));
      spawnPiece();
    },

    getState() {
      return {
        score,
        lines,
        level,
        grid: grid.map(r => [...r]),
        currentPiece: { ...currentPiece },
        nextPieceType,
      };
    },

    loadState(state: any) {
      if (!state) return;
      score = state.score || 0;
      lines = state.lines || 0;
      level = state.level || 1;
      if (state.grid) grid = state.grid;
      if (state.currentPiece) currentPiece = state.currentPiece;
      if (state.nextPieceType) nextPieceType = state.nextPieceType;
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
        lives: 1,
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
