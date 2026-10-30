import { RetroEngineInstance, EngineStats } from './engineTypes';
import { retroAudio } from '../audio/retroAudio';

export function createMonsterQuestEngine(): RetroEngineInstance {
  let score = 0;
  let highScore = 48000;
  let level = 50;
  let gameOver = false;
  let win = false;
  let isPaused = false;

  let cheats = {
    one_hit_ko: false,
    inf_potions: false,
  };

  let playerMon = {
    name: 'PIKACHU',
    hp: 120,
    maxHp: 120,
    level: 50,
  };

  let rivalMon = {
    name: 'CHARIZARD',
    hp: 150,
    maxHp: 150,
    level: 50,
  };

  let message = 'Cosa deve fare PIKACHU?';
  let isPlayerTurn = true;
  let turnWaitTimer = 0;
  let selectedMoveIdx = 0;
  let animTimer = 0;
  let animType: 'lightning' | 'fire' | 'tackle' | 'heal' | null = null;

  const moves = [
    { name: 'FULMINE', type: 'Elettro', power: 45, accuracy: 0.95 },
    { name: 'ATTACCO RAPIDO', type: 'Normale', power: 25, accuracy: 1.0 },
    { name: 'FUOCOBOMBA', type: 'Fuoco', power: 60, accuracy: 0.85 },
    { name: 'POZIONE MAX', type: 'Cura', power: 60, accuracy: 1.0 },
  ];

  return {
    update(inputs: Record<string, boolean>, dt: number) {
      if (isPaused || gameOver || win) return;

      if (cheats.inf_potions) playerMon.hp = playerMon.maxHp;

      if (turnWaitTimer > 0) {
        turnWaitTimer--;
        return;
      }

      if (animTimer > 0) {
        animTimer--;
        if (animTimer === 0) animType = null;
        return;
      }

      // Rival Turn AI
      if (!isPlayerTurn) {
        turnWaitTimer = 40;
        const dmg = Math.floor(18 + Math.random() * 15);
        playerMon.hp = Math.max(0, playerMon.hp - dmg);
        message = `CHARIZARD usa Lanciafiamme! Danno: -${dmg} PS!`;
        animType = 'fire';
        animTimer = 25;
        retroAudio.playExplosion();

        if (playerMon.hp <= 0) {
          gameOver = true;
          message = 'PIKACHU è esausto! Hai perso la sfida.';
        } else {
          isPlayerTurn = true;
        }
        return;
      }

      // Player Move Selection
      if (inputs.left && selectedMoveIdx > 0) {
        selectedMoveIdx--;
        retroAudio.playSelect();
      } else if (inputs.right && selectedMoveIdx < 3) {
        selectedMoveIdx++;
        retroAudio.playSelect();
      }

      // Number keys direct shortcut
      // Trigger move on A or space
      if (inputs.a || inputs.b || inputs.turboA) {
        const move = moves[selectedMoveIdx];
        isPlayerTurn = false;
        turnWaitTimer = 40;

        if (move.name === 'POZIONE MAX') {
          playerMon.hp = Math.min(playerMon.maxHp, playerMon.hp + 60);
          message = `PIKACHU usa Pozione e recupera 60 PS!`;
          animType = 'heal';
          animTimer = 25;
          retroAudio.playPowerUp();
        } else {
          let dmg = cheats.one_hit_ko ? 999 : move.power + Math.floor(Math.random() * 10);
          rivalMon.hp = Math.max(0, rivalMon.hp - dmg);
          message = `PIKACHU usa ${move.name}! Colpo efficace (-${dmg} PS)!`;
          score += dmg * 10;

          if (move.name === 'FULMINE') {
            animType = 'lightning';
            retroAudio.playLaser();
          } else if (move.name === 'FUOCOBOMBA') {
            animType = 'fire';
            retroAudio.playExplosion();
          } else {
            animType = 'tackle';
            retroAudio.playJump();
          }
          animTimer = 25;

          if (rivalMon.hp <= 0) {
            win = true;
            score += 15000;
            message = `CHARIZARD nemico è K.O.! Hai vinto la Lega!`;
            retroAudio.playStartChime();
          }
        }
      }
    },

    render(ctx: CanvasRenderingContext2D, width: number, height: number) {
      // GBA Battle Arena Background
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, width, height);

      // Arena Grass Podiums
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      // Rival Podium (Top Right)
      ctx.ellipse(270, 95, 80, 26, 0, 0, Math.PI * 2);
      ctx.fill();

      // Player Podium (Bottom Left)
      ctx.beginPath();
      ctx.ellipse(90, 195, 90, 30, 0, 0, Math.PI * 2);
      ctx.fill();

      // Rival Info Box (Top Left)
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(20, 25, 150, 48);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.strokeRect(20, 25, 150, 48);

      ctx.fillStyle = '#0f172a';
      ctx.font = '8px "Press Start 2P", monospace';
      ctx.fillText(rivalMon.name, 28, 40);
      ctx.fillText(`Lv.${rivalMon.level}`, 130, 40);

      // Rival HP Bar
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(28, 48, 134, 8);
      const rRatio = rivalMon.hp / rivalMon.maxHp;
      ctx.fillStyle = rRatio > 0.5 ? '#22c55e' : rRatio > 0.2 ? '#f59e0b' : '#ef4444';
      ctx.fillRect(28, 48, 134 * rRatio, 8);
      ctx.strokeRect(28, 48, 134, 8);

      // Rival Sprite (Charizard)
      ctx.fillStyle = '#ea580c'; // Orange Dragon body
      ctx.fillRect(250, 50, 40, 36);
      // Wings teal
      ctx.fillStyle = '#0d9488';
      ctx.fillRect(240, 38, 16, 24);
      ctx.fillRect(284, 38, 16, 24);
      // Belly yellow
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(256, 62, 28, 20);

      // Player Info Box (Right Mid)
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(210, 140, 160, 52);
      ctx.strokeRect(210, 140, 160, 52);

      ctx.fillStyle = '#0f172a';
      ctx.fillText(playerMon.name, 218, 156);
      ctx.fillText(`Lv.${playerMon.level}`, 320, 156);

      // Player HP Bar
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(218, 164, 144, 8);
      const pRatio = playerMon.hp / playerMon.maxHp;
      ctx.fillStyle = pRatio > 0.5 ? '#22c55e' : pRatio > 0.2 ? '#f59e0b' : '#ef4444';
      ctx.fillRect(218, 164, 144 * pRatio, 8);
      ctx.strokeRect(218, 164, 144, 8);
      ctx.fillText(`PS: ${playerMon.hp}/${playerMon.maxHp}`, 260, 184);

      // Player Sprite Back (Pikachu)
      ctx.fillStyle = '#facc15';
      ctx.fillRect(70, 145, 42, 38);
      // Brown stripes back
      ctx.fillStyle = '#78350f';
      ctx.fillRect(76, 154, 30, 4);
      ctx.fillRect(76, 164, 30, 4);
      // Ears with black tips
      ctx.fillStyle = '#facc15';
      ctx.fillRect(66, 130, 10, 18);
      ctx.fillRect(96, 130, 10, 18);
      ctx.fillStyle = '#020617';
      ctx.fillRect(66, 130, 10, 6);
      ctx.fillRect(96, 130, 10, 6);

      // Animations overlay
      if (animType === 'lightning') {
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(265, 0, 10, 90);
        ctx.fillRect(250, 30, 40, 6);
      } else if (animType === 'fire') {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(85, 165, 20, 0, Math.PI * 2);
        ctx.fill();
      }

      // Bottom Dialogue Box
      ctx.fillStyle = '#020617';
      ctx.fillRect(10, 204, width - 20, 84);
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.strokeRect(10, 204, width - 20, 84);

      // Narrative Message
      ctx.fillStyle = '#ffffff';
      ctx.font = '8px "Press Start 2P", monospace';
      ctx.fillText(message, 24, 224);

      // 4 Moves Grid
      for (let i = 0; i < 4; i++) {
        const mx = 24 + (i % 2) * 175;
        const my = 244 + Math.floor(i / 2) * 20;
        const isSel = i === selectedMoveIdx && isPlayerTurn;

        if (isSel) {
          ctx.fillStyle = '#f59e0b';
          ctx.fillText(`▶`, mx - 12, my);
        }

        ctx.fillStyle = isSel ? '#fde047' : '#94a3b8';
        ctx.fillText(`[${i + 1}] ${moves[i].name}`, mx, my);
      }
    },

    reset() {
      score = 0;
      playerMon.hp = 120;
      rivalMon.hp = 150;
      message = 'Cosa deve fare PIKACHU?';
      isPlayerTurn = true;
      gameOver = false;
      win = false;
    },

    getState() {
      return { score, playerMon: { ...playerMon }, rivalMon: { ...rivalMon }, message };
    },

    loadState(state: any) {
      if (!state) return;
      score = state.score || 0;
      if (state.playerMon) Object.assign(playerMon, state.playerMon);
      if (state.rivalMon) Object.assign(rivalMon, state.rivalMon);
      if (state.message) message = state.message;
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
        lives: playerMon.hp > 0 ? 1 : 0,
        level: playerMon.level,
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
