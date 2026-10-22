import { describe, expect, it } from 'vitest';
import { bubbleSortModule } from '@/algorithms/sorting/bubble';
import type { SortState } from '@/algorithms/sorting/types';
import { collectSteps } from '@/engine/step-generator';

function lastState(input: number[]): SortState {
  const steps = collectSteps(bubbleSortModule, input);
  return steps[steps.length - 1].state;
}

describe('冒泡排序（真实算法）', () => {
  it('正确排序乱序数组', () => {
    const state = lastState([5, 3, 8, 1, 9, 2]);
    expect(state.values).toEqual([1, 2, 3, 5, 8, 9]);
  });

  it('不修改输入数组', () => {
    const input = [3, 1, 2];
    const copy = [...input];
    collectSteps(bubbleSortModule, input);
    expect(input).toEqual(copy);
  });

  it('正确处理重复元素', () => {
    const state = lastState([4, 2, 4, 1, 2]);
    expect(state.values).toEqual([1, 2, 2, 4, 4]);
  });

  it('已有序数组提前结束（比较次数为 n-1）', () => {
    const state = lastState([1, 2, 3, 4, 5]);
    expect(state.values).toEqual([1, 2, 3, 4, 5]);
    expect(state.comparisons).toBe(4);
    expect(state.swaps).toBe(0);
  });

  it('逆序数组比较/交换次数正确', () => {
    const state = lastState([5, 4, 3, 2, 1]);
    // 最坏情况：4+3+2+1 = 10 次比较，10 次交换
    expect(state.comparisons).toBe(10);
    expect(state.swaps).toBe(10);
  });

  it('parseInput 拒绝空、非法与单元素输入', () => {
    expect(bubbleSortModule.parseInput('').ok).toBe(false);
    expect(bubbleSortModule.parseInput('abc').ok).toBe(false);
    expect(bubbleSortModule.parseInput('5, 3, x').ok).toBe(false);
    expect(bubbleSortModule.parseInput('42').ok).toBe(false);
  });

  it('parseInput 正确解析（支持逗号/空格分隔）', () => {
    const r1 = bubbleSortModule.parseInput('5, 3, 8');
    expect(r1.ok).toBe(true);
    if (r1.ok) expect(r1.value).toEqual([5, 3, 8]);

    const r2 = bubbleSortModule.parseInput('5 3 8 1');
    expect(r2.ok).toBe(true);
    if (r2.ok) expect(r2.value).toEqual([5, 3, 8, 1]);
  });
});
