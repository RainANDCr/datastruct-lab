/**
 * 数组和广义表章节共享状态类型。
 */

/** 矩阵可视化状态（二维数组存储 / 特殊矩阵压缩 / 稀疏矩阵） */
export interface MatrixState {
  rows: number;
  cols: number;
  /** 矩阵元素（null 表示不参与存储/无关位置） */
  matrix: (number | null)[][];
  /** 高亮位置 [row, col] */
  highlighted: [number, number][];
  /** 压缩后的一维存储数组 */
  storage?: (number | null)[];
  /** 存储数组高亮下标 */
  storageHighlight?: number[];
  /** 每个存储位置的来源标签（如 "a11"） */
  storageLabels?: string[];
  /** 行/列标签（邻接矩阵的顶点名等） */
  labels?: string[];
  /** 信息面板 */
  info?: Record<string, string | number>;
}
