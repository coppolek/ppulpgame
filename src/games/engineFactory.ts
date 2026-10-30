import { RetroEngineInstance } from './engineTypes';
import { createSuperPlumberEngine } from './superPlumber';
import { createSpaceInvadersEngine } from './spaceInvaders';
import { createPacMazeEngine } from './pacMaze';
import { createTetrisEngine } from './tetrisGame';
import { createRetroKartEngine } from './retroKart';
import { createStreetBrawlerEngine } from './streetBrawler';
import { createSonicSpeedEngine } from './sonicSpeed';
import { createMonsterQuestEngine } from './monsterQuest';
import { createCustomRomEngine, RomFileInfo } from './customRomEngine';

export function getEngineInstance(engineKey: string, romInfo?: RomFileInfo | null): RetroEngineInstance {
  switch (engineKey) {
    case 'plumber':
      return createSuperPlumberEngine();
    case 'space_invaders':
      return createSpaceInvadersEngine();
    case 'pacman':
      return createPacMazeEngine();
    case 'tetris':
      return createTetrisEngine();
    case 'kart':
      return createRetroKartEngine();
    case 'street_brawler':
      return createStreetBrawlerEngine();
    case 'sonic':
      return createSonicSpeedEngine();
    case 'monster_quest':
      return createMonsterQuestEngine();
    case 'custom_rom':
      return createCustomRomEngine(romInfo || null);
    case 'iframe':
      return createStreetBrawlerEngine();
    default:
      return createSuperPlumberEngine();
  }
}
