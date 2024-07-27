export namespace ShootingArea {
  export interface Statistics {
    hit: number;
    miss: number;
  }

  export interface Target {
    id: string;
    destroy: () => void;
  }

  export enum Difficulty {
    Easy = 'Easy',
    Medium = 'Medium',
    Hard = 'Hard',
  }

  export const difficultyFrequencyMap: Record<Difficulty, number> = {
    [Difficulty.Easy]: 1200,
    [Difficulty.Medium]: 800,
    [Difficulty.Hard]: 600,
  } as const
}
