import { RetroGame } from '../types/game';

/**
 * Returns a clean relative URL query string for a specific game
 */
export function getGameQueryUrl(gameId: string): string {
  return `?game=${encodeURIComponent(gameId)}`;
}

/**
 * Returns the full absolute URL for a game, safe for copying and sharing
 */
export function getGameShareUrl(gameId: string): string {
  if (typeof window === 'undefined') {
    return `?game=${encodeURIComponent(gameId)}`;
  }
  const base = window.location.origin + window.location.pathname;
  return `${base}?game=${encodeURIComponent(gameId)}`;
}

/**
 * Derives the original RetroGames.cc detail page URL from game metadata
 */
export function getRetroGamesDetailUrl(game: RetroGame): string {
  if (game.iframeUrl) {
    // If iframeUrl is https://www.retrogames.cc/embed/40788-100-star.html
    const match = game.iframeUrl.match(/\/embed\/(?:\d+-)?([^\.]+)\.html/);
    if (match) {
      const slug = match[1];
      // Map system to category if possible
      let cat = 'genesis-games';
      switch (game.system) {
        case 'PS1': cat = 'psx-games'; break;
        case 'ARCADE': cat = 'arcade-games'; break;
        case 'NES': cat = 'nes-games'; break;
        case 'SNES': cat = 'snes-games'; break;
        case 'GAMEBOY': cat = 'gameboy-games'; break;
        case 'GBC': cat = 'gameboycolor-games'; break;
        case 'GBA': cat = 'gameboyadvance-games'; break;
        case 'N64': cat = 'n64-games'; break;
        case 'NDS': cat = 'nds-games'; break;
        case 'GENESIS': cat = 'genesis-games'; break;
        case 'MASTERSYSTEM': cat = 'mastersystem-games'; break;
        case 'GAMEGEAR': cat = 'gamegear-games'; break;
        case 'SEGA32X': cat = 'sega32x-games'; break;
        case 'SEGACD': cat = 'segacd-games'; break;
        default: cat = 'genesis-games';
      }
      return `https://www.retrogames.cc/${cat}/${slug}.html`;
    }
  }
  return game.iframeUrl || `https://www.retrogames.cc/`;
}

/**
 * Copies text to clipboard safely
 */
export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    }
  } catch (err) {
    console.error('Failed to copy to clipboard', err);
    return false;
  }
}
