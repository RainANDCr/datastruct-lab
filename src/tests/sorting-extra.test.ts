import { describe, expect, it } from 'vitest';
import { heapSortModule } from '@/algorithms/sorting/heap';
import { mergeSortModule } from '@/algorithms/sorting/merge';
import { radixSortModule } from '@/algorithms/sorting/radix';
import { shellSortModule } from '@/algorithms/sorting/shell';
import type { SortState } from '@/algorithms/sorting/types';
import type { AlgorithmModule } from '@/engine/types';
import { collectSteps } from '@/engine/step-generator';

function lastState(mod: AlgorithmModule<SortState, number[]>, input: number[]): SortState {
  const steps = collectSteps(mod, input);
  return steps[steps.length - 1].state as SortState;
}

function sorted(input: number[]): number[] {
  return [...input].sort((a, b) => a - b);
}

describe('希尔排序', () => {
  it('排序正确', () => {
    const input = [8, 9, 1, 7, 2, 3, 5, 4, 6, 0];
    expect(lastState(shellSortModule, input).values).toEqual(sorted(input));
  });
  it('不修改输入数组', () => {
    const input = [5, 1, 4, 2];
    const copy = [...input];
    collectSteps(shellSortModule, input);
    expect(input).toEqual(copy);
  });
});

describe('堆排序', () => {
  it('排序正确', () => {
    const input = [4, 10, 3, 5, 1, 7, 2];
    expect(lastState(heapSortModule, input).values).toEqual(sorted(input));
  });
});

describe('归并排序', () => {
  it('排序正确且稳定', () => {
    const input = [5, 3, 8, 1, 9, 2];
    expect(lastState(mergeSortModule, input).values).toEqual(sorted(input));
  });
});

describe('基数排序', () => {
  it('排序正确（含不同位数）', () => {
    const input = [170, 45, 75, 90, 802, 24, 2, 66];
    expect(lastState(radixSortModule, input).values).toEqual(sorted(input));
  });
});
