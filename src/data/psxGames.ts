import { RetroGame } from '../types/game';
import psxData from './psxCatalogData.json';

export const PSX_GAMES: RetroGame[] = psxData as unknown as RetroGame[];
