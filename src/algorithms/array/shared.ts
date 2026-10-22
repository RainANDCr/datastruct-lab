/**
 * 数组章节共享解析：矩阵（分号分隔行、逗号分隔元素）。
 */
import type { ParseResult } from '@/engine/types';

export function parseMatrix(raw: string): ParseResult<number[][]> {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, error: '请输入矩阵（分号分隔行，如 1,2,3 ; 4,5,6）' };
  const rows = trimmed.split(/[;；\n]+/).map((s) => s.trim()).filter(Boolean);
  const matrix: number[][] = [];
  let cols = -1;
  for (const row of rows) {
    const cells = row.split(/[\s,，]+/).map((s) => s.trim()).filter(Boolean).map(Number);
    if (cells.some((c) => !Number.isFinite(c))) return { ok: false, error: `"${row}" 含非法数字` };
    if (cols === -1) cols = cells.length;
    else if (cells.length !== cols) return { ok: false, error: '每行列数必须一致' };
    matrix.push(cells);
  }
  if (matrix.length === 0) return { ok: false, error: '矩阵不能为空' };
  return { ok: true, value: matrix };
}

export function parseArray(raw: string): ParseResult<number[]> {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, error: '输入不能为空' };
  const tokens = trimmed.split(/[,\s，、;；]+/).filter(Boolean);
  const values = tokens.map(Number);
  if (values.some((v) => !Number.isFinite(v))) return { ok: false, error: '含非法数字' };
  if (values.length === 0) return { ok: false, error: '数组不能为空' };
  return { ok: true, value: values };
}
