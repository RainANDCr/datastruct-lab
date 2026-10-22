/**
 * 简单选择排序（Selection Sort）
 *
 * 每趟在未排序部分选出最小元素，与未排序部分的第一个元素交换。
 * 代码行号与 C / C++ / 伪代码严格对齐（三者均为 12 行）。
 */
import type { AlgorithmModule, AlgorithmStep } from '@/engine/types';
import { makeSortState, parseArrayInput } from './shared';
import { createSortState, type SortState } from './types';

const LINES = {
  outerLoop: 2,
  initMin: 3,
  innerLoop: 4,
  compare: 5,
  updateMin: 6,
  swap: [8, 9, 10],
} as const;

const cCode = `void selectionSort(int a[], int n) {
    for (int i = 0; i < n - 1; i++) {
        int min = i;
        for (int j = i + 1; j < n; j++) {
            if (a[j] < a[min])
                min = j;
        }
        int temp = a[i];
        a[i] = a[min];
        a[min] = temp;
    }
}`;

const cppCode = `void selectionSort(vector<int>& a) {
    for (int i = 0; i < (int)a.size() - 1; i++) {
        int min = i;
        for (int j = i + 1; j < (int)a.size(); j++) {
            if (a[j] < a[min])
                min = j;
        }
        int temp = a[i];
        a[i] = a[min];
        a[min] = temp;
    }
}`;

const pseudocode = `算法 selectionSort(a[0..n-1])
    for i ← 0 to n-2 do
        min ← i
        for j ← i+1 to n-1 do
            if a[j] < a[min] then
                min ← j
            end if
        end for
        temp ← a[i]
        a[i] ← a[min]
        a[min] ← temp
    end for`;

function* selectionSortSteps(input: number[]): Generator<AlgorithmStep<SortState>> {
  const arr = [...input]; // 不修改输入
  const n = arr.length;
  const sorted: number[] = [];
  let comparisons = 0;
  let swaps = 0;

  for (let i = 0; i < n - 1; i++) {
    let min = i;
    yield {
      id: `pass-${i}-start`,
      description: `第 ${i + 1} 趟：假设 a[${i}]=${arr[i]} 为未排序部分的最小值`,
      state: makeSortState(arr, sorted, null, null, null, [i, n - 1], comparisons, swaps, i + 1),
      highlightedElements: [`bar-${i}`],
      highlightedLines: [LINES.initMin],
      variables: { '趟数 i': i + 1, '最小值下标 min': min },
    };

    for (let j = i + 1; j < n; j++) {
      comparisons += 1;
      yield {
        id: `cmp-${i}-${j}`,
        description: `比较 a[${j}]=${arr[j]} 与当前最小值 a[${min}]=${arr[min]}`,
        state: makeSortState(arr, sorted, [j, min], null, null, [i, n - 1], comparisons, swaps, i + 1),
        highlightedElements: [`bar-${j}`, `bar-${min}`],
        highlightedLines: [LINES.compare],
        variables: { i, j, min, 比较次数: comparisons },
      };

      if (arr[j] < arr[min]) {
        min = j;
        yield {
          id: `newmin-${i}-${j}`,
          description: `a[${j}]=${arr[j]} 更小，更新最小值下标 min = ${j}`,
          state: makeSortState(arr, sorted, [j, min], null, null, [i, n - 1], comparisons, swaps, i + 1),
          highlightedElements: [`bar-${j}`],
          highlightedLines: [LINES.updateMin],
          variables: { i, j, min, 比较次数: comparisons },
        };
      }
    }

    if (min !== i) {
      const minValue = arr[min];
      [arr[i], arr[min]] = [arr[min], arr[i]];
      swaps += 1;
      yield {
        id: `swap-${i}`,
        description: `将最小值 ${minValue} 与 a[${i}] 交换，就位到位置 ${i}`,
        state: makeSortState(arr, sorted, null, [i, min], null, [i, n - 1], comparisons, swaps, i + 1),
        highlightedElements: [`bar-${i}`, `bar-${min}`],
        highlightedLines: [...LINES.swap],
        variables: { i, min, 交换次数: swaps },
      };
    }

    sorted.push(i);
    yield {
      id: `pass-${i}-end`,
      description: `第 ${i + 1} 趟结束，a[${i}] 已就位`,
      state: makeSortState(arr, sorted, null, null, null, null, comparisons, swaps, i + 1),
      highlightedElements: [`bar-${i}`],
      highlightedLines: [],
      variables: { 已排序个数: sorted.length },
    };
  }

  sorted.push(n - 1);
  yield {
    id: 'done',
    description: `排序完成，共比较 ${comparisons} 次、交换 ${swaps} 次`,
    state: makeSortState(arr, sorted, null, null, null, null, comparisons, swaps, 0),
    highlightedElements: [],
    highlightedLines: [],
    variables: { 比较次数: comparisons, 交换次数: swaps },
  };
}

export const selectionSortModule: AlgorithmModule<SortState, number[]> = {
  meta: {
    id: 'sorting.selection',
    name: '简单选择排序',
    nameEn: 'Selection Sort',
    chapter: 'sorting',
    order: 2,
    summary: '每趟从未排序部分选出最小元素，放到已排序部分的末尾。',
    coreIdea:
      '每一趟在未排序部分中寻找最小元素，将其与未排序部分的第一个元素交换位置，使已排序部分逐步向右扩大，直到全部有序。',
    operationSteps: [
      '从未排序部分的第一个位置 i 开始，假设 a[i] 为最小值（min = i）。',
      '遍历后续元素，若有更小的元素则更新 min。',
      '一趟结束后，将 a[min] 与 a[i] 交换。',
      '位置 i 归入已排序部分，重复直到只剩一个元素。',
    ],
    useCases: ['数据规模较小', '对交换（写操作）次数敏感的场景', '教学演示'],
    complexity: {
      time: { best: 'O(n²)', average: 'O(n²)', worst: 'O(n²)' },
      space: 'O(1)',
    },
    stable: false,
    pros: ['实现简单直观', '交换次数少（最多 n-1 次）', '空间复杂度 O(1)'],
    cons: ['比较次数恒为 n(n-1)/2，与初始序列无关', '不稳定排序', '时间复杂度 O(n²)'],
    examPoints: [
      '选择排序是不稳定排序。',
      '比较次数与初始序列无关，恒为 n(n-1)/2。',
      '交换次数最多 n-1 次。',
      '无论最好最坏情况，时间复杂度均为 O(n²)。',
    ],
    variableDocs: [
      { name: 'i', meaning: '当前趟的起始（目标）位置' },
      { name: 'min', meaning: '当前未排序部分最小值下标' },
      { name: 'j', meaning: '扫描未排序部分的下标' },
    ],
    code: { c: cCode, cpp: cppCode, pseudocode },
    inputSchema: [
      { key: 'array', label: '待排序数组', type: 'array', placeholder: '如：5, 3, 8, 1, 9, 2' },
    ],
    defaultInput: '5, 3, 8, 1, 9, 2',
    implemented: true,
    visualizer: 'bars',
  },
  generateSteps: selectionSortSteps,
  parseInput: parseArrayInput,
  createInitialState: createSortState,
};
