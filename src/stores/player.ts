/**
 * 播放器状态机：维护当前算法的步骤序列与游标。
 *
 * 职责边界：仅管理「游标」与「是否播放」，不执行算法、不驱动动画。
 * 自动播放的定时推进由 useAutoPlay 完成，播放速度只影响游标推进频率。
 */
import { create } from 'zustand';
import type { AlgorithmStep } from '@/engine/types';

export const SPEED_OPTIONS = [0.25, 0.5, 1, 1.5, 2, 4] as const;
export type Speed = (typeof SPEED_OPTIONS)[number];

interface PlayerState {
  algorithmId: string | null;
  steps: AlgorithmStep<unknown>[];
  currentIndex: number;
  isPlaying: boolean;
  speed: Speed;

  load: (algorithmId: string, steps: AlgorithmStep<unknown>[]) => void;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  stepForward: () => void;
  stepBack: () => void;
  reset: () => void;
  seekTo: (index: number) => void;
  setSpeed: (speed: Speed) => void;
  stop: () => void;
}

function clamp(index: number, length: number): number {
  if (length <= 1) return 0;
  return Math.max(0, Math.min(index, length - 1));
}

export const usePlayer = create<PlayerState>()((set, get) => ({
  algorithmId: null,
  steps: [],
  currentIndex: 0,
  isPlaying: false,
  speed: 1,

  load: (algorithmId, steps) =>
    set({ algorithmId, steps, currentIndex: 0, isPlaying: false }),

  play: () => {
    const { steps, currentIndex } = get();
    // 已到末尾则从头播放
    const from = currentIndex >= steps.length - 1 ? 0 : currentIndex;
    set({ currentIndex: from, isPlaying: true });
  },

  pause: () => set({ isPlaying: false }),

  togglePlay: () => {
    if (get().isPlaying) get().pause();
    else get().play();
  },

  stepForward: () => {
    const { steps, currentIndex } = get();
    if (currentIndex >= steps.length - 1) {
      set({ isPlaying: false });
      return;
    }
    set({ currentIndex: currentIndex + 1 });
  },

  stepBack: () => {
    const { currentIndex } = get();
    if (currentIndex > 0) set({ currentIndex: currentIndex - 1, isPlaying: false });
  },

  reset: () => set({ currentIndex: 0, isPlaying: false }),

  seekTo: (index) =>
    set({ currentIndex: clamp(index, get().steps.length), isPlaying: false }),

  setSpeed: (speed) => set({ speed }),

  stop: () => set({ isPlaying: false, currentIndex: 0 }),
}));

/** 当前步骤选择器 */
export function selectCurrentStep(
  state: Pick<PlayerState, 'steps' | 'currentIndex'>,
): AlgorithmStep<unknown> | undefined {
  return state.steps[state.currentIndex];
}
