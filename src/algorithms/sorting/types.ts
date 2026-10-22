/**
 * 排序类算法的统一可视化状态。
 * 所有排序模块共享此结构，保证画布渲染逻辑可复用。
 */
export interface SortState {
  values: number[];
  /** 正在比较的两个索引 */
  comparing: [number, number] | null;
  /** 正在交换的两个索引 */
  swapping: [number, number] | null;
  /** 已排序（完成）的索引 */
  sortedIndices: number[];
  /** 基准元素索引（快排用，其余为 null） */
  pivotIndex: number | null;
  /** 当前处理的区间 [lo, hi]（快排分区 / 选择排序未排序区间 / 插入排序有序区间） */
  range?: [number, number] | null;
  /** 累计比较次数 */
  comparisons: number;
  /** 累计交换/移动次数 */
  swaps: number;
  /** 当前趟数（从 1 开始，初始 0） */
  pass: number;
  /** 辅助数组（归并排序临时数组） */
  auxArray?: number[];
  /** 希尔排序当前增量 gap / 基数排序当前位权（10^digit） */
  step?: number;
  /** 基数排序当前处理位（0=个位，1=十位...，未开始时 undefined） */
  digit?: number;
}

export function createSortState(values: number[]): SortState {
  return {
    values: [...values],
    comparing: null,
    swapping: null,
    sortedIndices: [],
    pivotIndex: null,
    comparisons: 0,
    swaps: 0,
    pass: 0,
  };
}
