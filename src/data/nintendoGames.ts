import { RetroGame } from '../types/game';
import nintendoData from './nintendoCatalogData.json';

export const NINTENDO_GAMES: RetroGame[] = nintendoData as unknown as RetroGame[];
