/**
 * 排序章节共享工具：输入解析与状态构造。
 */
import type { ParseResult } from '@/engine/types';
import type { SortState } from './types';

/** 排序数组输入解析（统一处理空、重复、非法、超长） */
export function parseArrayInput(raw: string): ParseResult<number[]> {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, error: '输入不能为空' };
  const tokens = trimmed.split(/[,\s，、;；]+/).filter(Boolean);
  const values: number[] = [];
  for (const token of tokens) {
    const n = Number(token);
    if (!Number.isFinite(n)) return { ok: false, error: `"${token}" 不是有效数字` };
    values.push(n);
  }
  if (values.length < 2) return { ok: false, error: '至少需要 2 个元素' };
  if (values.length > 30) return { ok: false, error: '元素过多（最多 30 个，避免画布拥挤）' };
  return { ok: true, value: values };
}

/** 构造排序状态快照（深拷贝 values 与 sortedIndices，保证步骤不可变） */
export function makeSortState(
  values: number[],
  sortedIndices: number[],
  comparing: [number, number] | null,
  swapping: [number, number] | null,
  pivotIndex: number | null,
  range: [number, number] | null,
  comparisons: number,
  swaps: number,
  pass: number,
): SortState {
  return {
    values: [...values],
    comparing,
    swapping,
    sortedIndices: [...sortedIndices],
    pivotIndex,
    range,
    comparisons,
    swaps,
    pass,
  };
}
