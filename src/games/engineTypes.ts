export interface EngineStats {
  score: number;
  lives: number;
  level: number;
  gameOver: boolean;
  win: boolean;
  isPaused: boolean;
  highScore: number;
}

export interface RetroEngineInstance {
  update: (inputs: Record<string, boolean>, dt: number) => void;
  render: (ctx: CanvasRenderingContext2D, width: number, height: number) => void;
  reset: () => void;
  getState: () => any;
  loadState: (state: any) => void;
  setCheat: (cheatId: string, enabled: boolean) => void;
  getStats: () => EngineStats;
  togglePause: () => boolean;
}
