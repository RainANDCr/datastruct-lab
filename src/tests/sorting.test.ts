import { describe, expect, it } from 'vitest';
import { insertionSortModule } from '@/algorithms/sorting/insertion';
import { quickSortModule } from '@/algorithms/sorting/quick';
import { selectionSortModule } from '@/algorithms/sorting/selection';
import type { SortState } from '@/algorithms/sorting/types';
import type { AlgorithmModule } from '@/engine/types';
import { collectSteps } from '@/engine/step-generator';

type SortModule = AlgorithmModule<SortState, number[]>;

function lastState(mod: SortModule, input: number[]): SortState {
  const steps = collectSteps(mod, input);
  return steps[steps.length - 1].state;
}

function finalValues(mod: SortModule, input: number[]): number[] {
  return lastState(mod, input).values;
}

describe('简单选择排序', () => {
  it('正确排序乱序数组', () => {
    expect(finalValues(selectionSortModule, [5, 3, 8, 1, 9, 2])).toEqual([1, 2, 3, 5, 8, 9]);
  });

  it('不修改输入数组', () => {
    const input = [3, 1, 2];
    const copy = [...input];
    collectSteps(selectionSortModule, input);
    expect(input).toEqual(copy);
  });

  it('比较次数与初始序列无关（n=5 恒为 10）', () => {
    const s1 = lastState(selectionSortModule, [1, 2, 3, 4, 5]);
    const s2 = lastState(selectionSortModule, [5, 4, 3, 2, 1]);
    expect(s1.comparisons).toBe(10);
    expect(s2.comparisons).toBe(10);
  });

  it('交换次数不超过 n-1', () => {
    const state = lastState(selectionSortModule, [5, 4, 3, 2, 1]);
    expect(state.swaps).toBeLessThanOrEqual(4);
  });
});

describe('直接插入排序', () => {
  it('正确排序乱序数组', () => {
    expect(finalValues(insertionSortModule, [5, 3, 8, 1, 9, 2])).toEqual([1, 2, 3, 5, 8, 9]);
  });

  it('已有序数组：比较 n-1 次、移动 0 次', () => {
    const state = lastState(insertionSortModule, [1, 2, 3, 4, 5]);
    expect(state.comparisons).toBe(4);
    expect(state.swaps).toBe(0);
  });

  it('逆序数组：最坏比较/移动次数 n(n-1)/2', () => {
    const state = lastState(insertionSortModule, [5, 4, 3, 2, 1]);
    expect(state.comparisons).toBe(10);
    expect(state.swaps).toBe(10);
  });

  it('处理重复元素', () => {
    expect(finalValues(insertionSortModule, [4, 2, 4, 1, 2])).toEqual([1, 2, 2, 4, 4]);
  });
});

describe('快速排序', () => {
  it('正确排序乱序数组', () => {
    expect(finalValues(quickSortModule, [5, 3, 8, 1, 9, 2])).toEqual([1, 2, 3, 5, 8, 9]);
  });

  it('处理已有序与逆序输入', () => {
    expect(finalValues(quickSortModule, [1, 2, 3, 4, 5])).toEqual([1, 2, 3, 4, 5]);
    expect(finalValues(quickSortModule, [5, 4, 3, 2, 1])).toEqual([1, 2, 3, 4, 5]);
  });

  it('处理重复元素', () => {
    expect(finalValues(quickSortModule, [4, 2, 4, 1, 2])).toEqual([1, 2, 2, 4, 4]);
  });

  it('不修改输入数组', () => {
    const input = [6, 1, 5, 2, 4, 3];
    const copy = [...input];
    collectSteps(quickSortModule, input);
    expect(input).toEqual(copy);
  });
});
