import { RetroGame } from '../types/game';
import segaData from './segaCatalogData.json';

export const SEGA_GAMES: RetroGame[] = segaData as unknown as RetroGame[];
