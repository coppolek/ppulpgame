import { RetroGame } from '../types/game';
import arcadeData from './arcadeCatalogData.json';

export const ARCADE_GAMES: RetroGame[] = arcadeData as unknown as RetroGame[];
