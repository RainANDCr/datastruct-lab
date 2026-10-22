/**
 * 绪论章：时间复杂度可视化状态。
 */
export interface ComplexityState {
  /** 当前输入规模（游标） */
  n: number;
  /** 最大输入规模 */
  maxN: number;
  /** 各复杂度在当前 n 下的操作次数 */
  counts: { label: string; value: number }[];
}

export function createComplexityState(maxN: number): ComplexityState {
  return {
    n: 1,
    maxN,
    counts: [],
  };
}
