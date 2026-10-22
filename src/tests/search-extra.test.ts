import { describe, expect, it } from 'vitest';
import { blockSearchModule } from '@/algorithms/search/block';
import { hashSearchModule } from '@/algorithms/search/hash';
import { sequentialSearchModule } from '@/algorithms/search/sequential';
import type { HashState } from '@/algorithms/search/types';
import type { ArrayState } from '@/algorithms/linear-list/types';
import { collectSteps } from '@/engine/step-generator';

function parse<T>(mod: { parseInput: (s: string) => { ok: true; value: T } | { ok: false } }, input: string): T {
  const r = mod.parseInput(input);
  if (!r.ok) throw new Error('parse failed');
  return r.value;
}

describe('顺序查找', () => {
  it('命中返回正确下标', () => {
    const steps = collectSteps(sequentialSearchModule, parse(sequentialSearchModule, 'build 3,1,5,7,2 ; search 5'));
    const found = steps.find((s) => s.description.includes('找到'));
    expect(found).toBeDefined();
    expect((found!.state as ArrayState).info?.结果).toBe('下标 2');
  });
  it('未命中提示', () => {
    const steps = collectSteps(sequentialSearchModule, parse(sequentialSearchModule, 'build 3,1,5 ; search 9'));
    expect(steps.some((s) => s.description.includes('未找到'))).toBe(true);
  });
});

describe('分块查找', () => {
  it('在块内命中', () => {
    const steps = collectSteps(blockSearchModule, parse(blockSearchModule, 'build 8,6,9,14,10,22,18,30,40 ; search 18'));
    expect(steps.some((s) => s.description.includes('找到'))).toBe(true);
  });
});

describe('散列查找', () => {
  it('线性探测冲突后仍能命中', () => {
    // 11 表，5%11=5，16%11=5(冲突→6)，27%11=5(冲突→6→7)
    const steps = collectSteps(hashSearchModule, parse(hashSearchModule, 'build 11 ; insert 5,16,27 ; search 16'));
    const found = steps.find((s) => s.description.includes('命中'));
    expect(found).toBeDefined();
    const st = found!.state as HashState;
    expect(st.slots[6]).toBe(16);
  });
});
