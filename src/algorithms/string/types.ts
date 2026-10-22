/**
 * 字符串章节共享状态类型。
 */

/** 字符串可视化状态（朴素匹配 / KMP / 基本操作） */
export interface StringState {
  /** 主串 */
  text: string;
  /** 模式串 */
  pattern: string;
  /** 模式串对齐主串的偏移（pattern[0] 对应 text[offset]） */
  offset: number;
  /** 高亮的主串索引 */
  textHighlight: number[];
  /** 高亮的模式串索引 */
  patternHighlight: number[];
  /** 已匹配成功的起始位置 */
  matchedPositions: number[];
  /** next 数组（KMP） */
  nextArray?: number[];
  /** next 数组高亮索引 */
  nextHighlight?: number[];
  /** 信息面板 */
  info?: Record<string, string | number>;
}
