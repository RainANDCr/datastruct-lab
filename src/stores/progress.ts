/**
 * 学习进度：记录每个算法模块的「已学习」状态，localStorage 持久化。
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ProgressState {
  /** algorithmId -> 是否已学习 */
  learned: Record<string, boolean>;
  markLearned: (id: string) => void;
  toggleLearned: (id: string) => void;
  unlearn: (id: string) => void;
  /** 某章节的已学习数量 */
  learnedCountIn: (ids: string[]) => number;
}

export const useProgress = create<ProgressState>()(
  persist(
    (set, get) => ({
      learned: {},
      markLearned: (id) =>
        set((s) => ({ learned: { ...s.learned, [id]: true } })),
      toggleLearned: (id) =>
        set((s) => ({ learned: { ...s.learned, [id]: !s.learned[id] } })),
      unlearn: (id) => {
        const next = { ...get().learned };
        delete next[id];
        set({ learned: next });
      },
      learnedCountIn: (ids) => ids.filter((id) => get().learned[id]).length,
    }),
    { name: 'dslab-progress' },
  ),
);
