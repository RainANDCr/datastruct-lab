/**
 * 冒泡排序（Bubble Sort）
 *
 * 真实算法 + 生成器逐步产出状态快照。所有步骤由算法执行过程驱动，
 * 代码行号与 C / C++ / 伪代码严格对齐（三者均为 14 行）。
 */
import type { AlgorithmModule, AlgorithmStep } from '@/engine/types';
import { parseArrayInput } from './shared';
import { createSortState, type SortState } from './types';

/* 代码行号（C / C++ / 伪代码三者对齐） */
const LINES = {
  outerLoop: 2,
  swappedInit: 3,
  innerLoop: 4,
  compare: 5,
  swap: [6, 7, 8, 9],
  innerEnd: 11,
  breakCheck: 12,
} as const;

const cCode = `void bubbleSort(int a[], int n) {
    for (int i = 0; i < n - 1; i++) {
        int swapped = 0;
        for (int j = 0; j < n - 1 - i; j++) {
            if (a[j] > a[j + 1]) {
                int temp = a[j];
                a[j] = a[j + 1];
                a[j + 1] = temp;
                swapped = 1;
            }
        }
        if (swapped == 0) break;
    }
}`;

const cppCode = `void bubbleSort(vector<int>& a) {
    for (int i = 0; i < (int)a.size() - 1; i++) {
        bool swapped = false;
        for (int j = 0; j < (int)a.size() - 1 - i; j++) {
            if (a[j] > a[j + 1]) {
                int temp = a[j];
                a[j] = a[j + 1];
                a[j + 1] = temp;
                swapped = true;
            }
        }
        if (!swapped) break;
    }
}`;

const pseudocode = `算法 bubbleSort(a[0..n-1])
    for i ← 0 to n-2 do
        swapped ← false
        for j ← 0 to n-2-i do
            if a[j] > a[j+1] then
                temp ← a[j]
                a[j] ← a[j+1]
                a[j+1] ← temp
                swapped ← true
            end if
        end for
        if swapped = false then break
    end for
结束`;

function* bubbleSortSteps(input: number[]): Generator<AlgorithmStep<SortState>> {
  const arr = [...input]; // 不修改输入数组
  const n = arr.length;
  const sortedIndices: number[] = [];
  let comparisons = 0;
  let swaps = 0;

  for (let i = 0; i < n - 1; i++) {
    let swapped = false;
    yield {
      id: `pass-${i + 1}-start`,
      description: `第 ${i + 1} 趟：从前往后依次比较相邻元素`,
      state: {
        values: [...arr],
        comparing: null,
        swapping: null,
        sortedIndices: [...sortedIndices],
        pivotIndex: null,
        comparisons,
        swaps,
        pass: i + 1,
      },
      highlightedElements: [],
      highlightedLines: [LINES.outerLoop, LINES.swappedInit],
      variables: { '趟数 i': i + 1, '已排序个数': sortedIndices.length },
    };

    for (let j = 0; j < n - 1 - i; j++) {
      comparisons += 1;
      yield {
        id: `compare-${i}-${j}`,
        description: `比较 a[${j}]=${arr[j]} 与 a[${j + 1}]=${arr[j + 1]}`,
        state: {
          values: [...arr],
          comparing: [j, j + 1],
          swapping: null,
          sortedIndices: [...sortedIndices],
          pivotIndex: null,
          comparisons,
          swaps,
          pass: i + 1,
        },
        highlightedElements: [`bar-${j}`, `bar-${j + 1}`],
        highlightedLines: [LINES.compare],
        variables: {
          i,
          j,
          'a[j]': arr[j],
          'a[j+1]': arr[j + 1],
          比较次数: comparisons,
        },
      };

      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        swaps += 1;
        swapped = true;
        yield {
          id: `swap-${i}-${j}`,
          description: `${arr[j + 1]} < ${arr[j]}，交换 a[${j}] 与 a[${j + 1}]`,
          state: {
            values: [...arr],
            comparing: null,
            swapping: [j, j + 1],
            sortedIndices: [...sortedIndices],
            pivotIndex: null,
            comparisons,
            swaps,
            pass: i + 1,
          },
          highlightedElements: [`bar-${j}`, `bar-${j + 1}`],
          highlightedLines: [...LINES.swap],
          variables: { i, j, 交换次数: swaps },
        };
      }
    }

    sortedIndices.push(n - 1 - i);

    if (!swapped) {
      // 本趟未发生交换，剩余元素已有序
      for (let k = 0; k < n - 1 - i; k++) {
        if (!sortedIndices.includes(k)) sortedIndices.push(k);
      }
      yield {
        id: `done-early-${i}`,
        description: '本趟未发生任何交换，序列已有序，提前结束',
        state: {
          values: [...arr],
          comparing: null,
          swapping: null,
          sortedIndices: [...sortedIndices],
          pivotIndex: null,
          comparisons,
          swaps,
          pass: i + 1,
        },
        highlightedElements: [],
        highlightedLines: [LINES.breakCheck],
        variables: { 比较次数: comparisons, 交换次数: swaps },
      };
      break;
    }

    yield {
      id: `pass-${i + 1}-end`,
      description: `第 ${i + 1} 趟结束，最大值 ${arr[n - 1 - i]} 已"冒泡"到位置 ${n - 1 - i}`,
      state: {
        values: [...arr],
        comparing: null,
        swapping: null,
        sortedIndices: [...sortedIndices],
        pivotIndex: null,
        comparisons,
        swaps,
        pass: i + 1,
      },
      highlightedElements: [`bar-${n - 1 - i}`],
      highlightedLines: [LINES.innerEnd],
      variables: { 已排序个数: sortedIndices.length },
    };
  }

  for (let k = 0; k < n; k++) {
    if (!sortedIndices.includes(k)) sortedIndices.push(k);
  }

  yield {
    id: 'done',
    description: `排序完成，共比较 ${comparisons} 次、交换 ${swaps} 次`,
    state: {
      values: [...arr],
      comparing: null,
      swapping: null,
      sortedIndices: [...sortedIndices],
      pivotIndex: null,
      comparisons,
      swaps,
      pass: 0,
    },
    highlightedElements: [],
    highlightedLines: [],
    variables: { 比较次数: comparisons, 交换次数: swaps },
  };
}

export const bubbleSortModule: AlgorithmModule<SortState, number[]> = {
  meta: {
    id: 'sorting.bubble',
    name: '冒泡排序',
    nameEn: 'Bubble Sort',
    chapter: 'sorting',
    order: 1,
    summary: '相邻元素两两比较、交换，每趟把最大元素"冒泡"到末尾。',
    coreIdea:
      '重复遍历待排序序列，依次比较相邻两个元素，若顺序错误则交换。每趟把当前未排序部分的最大元素"冒泡"到末尾；若某趟未发生交换，说明序列已有序，可提前结束。',
    operationSteps: [
      '从第一个元素开始，比较相邻元素 a[j] 与 a[j+1]。',
      '若 a[j] > a[j+1]，交换两者。',
      '对每一对相邻元素重复上述操作，直到未排序部分末尾。',
      '一趟结束后，最大元素"冒泡"到未排序部分的最后位置。',
      '重复上述过程，直到某趟未发生交换或只剩一个元素。',
    ],
    useCases: ['数据规模较小且对稳定性有要求', '教学演示与理解排序思想', '基本有序的序列（可提前结束）'],
    complexity: {
      time: { best: 'O(n)', average: 'O(n²)', worst: 'O(n²)' },
      space: 'O(1)',
    },
    stable: true,
    pros: ['实现简单、易于理解', '稳定排序', '空间复杂度 O(1)', '最好情况 O(n)（提前终止）'],
    cons: ['平均与最坏时间复杂度 O(n²)', '交换次数多、效率偏低'],
    examPoints: [
      '冒泡排序是稳定排序。',
      '最好情况（已有序）时间复杂度为 O(n)。',
      '每趟将未排序部分的最大值移动到末尾。',
      '最坏情况共 n-1 趟，第 i 趟比较 n-i 次。',
    ],
    variableDocs: [
      { name: 'n', meaning: '数组长度' },
      { name: 'i', meaning: '外层循环变量，表示当前趟数' },
      { name: 'j', meaning: '内层循环变量，表示当前比较位置' },
      { name: 'temp', meaning: '交换时的临时变量' },
      { name: 'swapped', meaning: '标记本趟是否发生交换' },
    ],
    code: { c: cCode, cpp: cppCode, pseudocode },
    inputSchema: [
      { key: 'array', label: '待排序数组', type: 'array', placeholder: '如：5, 3, 8, 1, 9, 2' },
    ],
    defaultInput: '5, 3, 8, 1, 9, 2',
    implemented: true,
    visualizer: 'bars',
  },
  generateSteps: bubbleSortSteps,
  parseInput: parseArrayInput,
  createInitialState: createSortState,
};
