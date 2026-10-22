/**
 * 常见时间复杂度增长曲线定义（绪论章与画布共用，单一数据源）。
 */
export interface ComplexityCurve {
  key: string;
  label: string;
  color: string;
  /** 操作次数关于规模 n 的函数 */
  fn: (n: number) => number;
}

export const COMPLEXITY_CURVES: ComplexityCurve[] = [
  { key: 'o1', label: 'O(1)', color: '#64748b', fn: () => 1 },
  { key: 'ologn', label: 'O(log n)', color: '#22c55e', fn: (n) => Math.log2(n) },
  { key: 'on', label: 'O(n)', color: '#3b82f6', fn: (n) => n },
  { key: 'onlogn', label: 'O(n log n)', color: '#f59e0b', fn: (n) => n * Math.log2(n) },
  { key: 'on2', label: 'O(n²)', color: '#ef4444', fn: (n) => n * n },
];
