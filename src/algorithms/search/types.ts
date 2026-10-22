/**
 * 散列查找共享状态类型。
 */

export type HashSlotStatus = 'default' | 'current' | 'comparing' | 'done' | 'error';

/** 散列表状态（线性探测开放定址法） */
export interface HashState {
  /** 表大小 */
  size: number;
  /** 槽位元素（null 表示空） */
  slots: (number | null)[];
  /** 高亮槽位下标 */
  highlighted: number[];
  /** 槽位状态（着色） */
  status?: Record<number, HashSlotStatus>;
  /** 信息面板 */
  info?: Record<string, string | number>;
}
