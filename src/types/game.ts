export type RetroSystem = 
  | 'ALL'
  | 'ARCADE'
  | 'NES'
  | 'SNES'
  | 'GBA'
  | 'GBC'
  | 'GAMEBOY'
  | 'N64'
  | 'NDS'
  | 'GENESIS'
  | 'MASTERSYSTEM'
  | 'GAMEGEAR'
  | 'SEGA32X'
  | 'SEGACD'
  | 'PS1'
  | 'ATARI2600'
  | 'ATARI7800'
  | 'NEOGEO'
  | 'TURBOGRAFX'
  | 'HACKS';

export type RetroGenre = 
  | 'ALL'
  | 'Platformer'
  | 'Action'
  | 'Shooter'
  | 'RPG'
  | 'Fighting'
  | 'Racing'
  | 'Puzzle'
  | 'Sports'
  | 'Hack'
  | 'Strategy';

export type HardwareManufacturer = 'Nintendo' | 'Sega' | 'Sony' | 'Arcade' | 'Atari' | 'SNK / NEC' | 'Community Hacks';

export interface GameCheat {
  id: string;
  code: string;
  name: string;
  description: string;
  enabled: boolean;
}

export interface RetroGame {
  id: string;
  title: string;
  system: Exclude<RetroSystem, 'ALL'>;
  genre: Exclude<RetroGenre, 'ALL'>;
  year: number;
  developer: string;
  rating: number;
  playsCount: number;
  description: string;
  story: string;
  instructions: string[];
  controlsTip: string;
  coverAccent: string; // Tailwind color or hex
  badgeColor: string;
  coverImage?: string; // Cover art thumbnail image
  iframeUrl?: string; // Official retrogames.cc embed iframe URL
  embedWidth?: number;
  embedHeight?: number;
  engineKey: 
    | 'plumber' 
    | 'space_invaders' 
    | 'pacman' 
    | 'tetris' 
    | 'kart' 
    | 'street_brawler' 
    | 'sonic' 
    | 'monster_quest' 
    | 'custom_rom'
    | 'iframe';
  cheats: GameCheat[];
  featured?: boolean;
}

export interface SaveStateSnapshot {
  id: string;
  gameId: string;
  slotNumber: number;
  timestamp: number;
  thumbnail: string; // Data URL of canvas
  score: number;
  level: number;
  stateData: any;
}

export interface ControllerMapping {
  up: string;
  down: string;
  left: string;
  right: string;
  a: string;
  b: string;
  x: string;
  y: string;
  start: string;
  select: string;
  turboA: string;
  turboB: string;
}

export type CrtFilter = 'none' | 'scanlines' | 'curved' | 'gameboy' | 'amber';
