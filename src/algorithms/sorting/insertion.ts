/**
 * 直接插入排序（Insertion Sort）
 *
 * 将每个元素插入到左侧已排序部分的正确位置。
 * 代码行号与 C / C++ / 伪代码严格对齐（三者均为 11 行）。
 */
import type { AlgorithmModule, AlgorithmStep } from '@/engine/types';
import { makeSortState, parseArrayInput } from './shared';
import { createSortState, type SortState } from './types';

const LINES = {
  outerLoop: 2,
  takeKey: 3,
  initJ: 4,
  compare: 5,
  shift: 6,
  insert: 9,
} as const;

const cCode = `void insertionSort(int a[], int n) {
    for (int i = 1; i < n; i++) {
        int key = a[i];
        int j = i - 1;
        while (j >= 0 && a[j] > key) {
            a[j + 1] = a[j];
            j--;
        }
        a[j + 1] = key;
    }
}`;

const cppCode = `void insertionSort(vector<int>& a) {
    for (int i = 1; i < (int)a.size(); i++) {
        int key = a[i];
        int j = i - 1;
        while (j >= 0 && a[j] > key) {
            a[j + 1] = a[j];
            j--;
        }
        a[j + 1] = key;
    }
}`;

const pseudocode = `算法 insertionSort(a[0..n-1])
    for i ← 1 to n-1 do
        key ← a[i]
        j ← i-1
        while j >= 0 and a[j] > key do
            a[j+1] ← a[j]
            j ← j-1
        end while
        a[j+1] ← key
    end for`;

function* insertionSortSteps(input: number[]): Generator<AlgorithmStep<SortState>> {
  const arr = [...input]; // 不修改输入
  const n = arr.length;
  const sorted: number[] = [0]; // 初始 a[0] 视为已排序
  let comparisons = 0;
  let moves = 0;

  yield {
    id: 'init',
    description: `初始状态：a[0]=${arr[0]} 视为已排序部分`,
    state: makeSortState(arr, sorted, null, null, null, [0, 0], comparisons, moves, 0),
    highlightedElements: [`bar-0`],
    highlightedLines: [],
    variables: { 已排序个数: 1 },
  };

  for (let i = 1; i < n; i++) {
    const key = arr[i];
    yield {
      id: `take-${i}`,
      description: `取出待插入元素 key = a[${i}] = ${key}`,
      state: makeSortState(arr, sorted, null, null, i, [0, i], comparisons, moves, i),
      highlightedElements: [`bar-${i}`],
      highlightedLines: [LINES.takeKey],
      variables: { i, key },
    };

    let j = i - 1;
    while (j >= 0 && arr[j] > key) {
      comparisons += 1;
      yield {
        id: `cmp-${i}-${j}`,
        description: `比较 a[${j}]=${arr[j]} 与 key=${key}：a[${j}] 更大，需后移`,
        state: makeSortState(arr, sorted, [j, i], null, i, [0, i], comparisons, moves, i),
        highlightedElements: [`bar-${j}`, `bar-${i}`],
        highlightedLines: [LINES.compare],
        variables: { i, j, key, 比较次数: comparisons },
      };

      arr[j + 1] = arr[j];
      moves += 1;
      yield {
        id: `shift-${i}-${j}`,
        description: `将 a[${j}]=${arr[j]} 后移一位到 a[${j + 1}]`,
        state: makeSortState(arr, sorted, null, [j, j + 1], i, [0, i], comparisons, moves, i),
        highlightedElements: [`bar-${j}`, `bar-${j + 1}`],
        highlightedLines: [LINES.shift],
        variables: { i, j, key, 移动次数: moves },
      };
      j -= 1;
    }

    if (j >= 0) comparisons += 1; // while 条件最后一次为假的比较

    arr[j + 1] = key;
    yield {
      id: `insert-${i}`,
      description: `将 key=${key} 插入到位置 ${j + 1}`,
      state: makeSortState(arr, sorted, null, [j + 1, i], null, [0, i], comparisons, moves, i),
      highlightedElements: [`bar-${j + 1}`],
      highlightedLines: [LINES.insert],
      variables: { i, key, 插入位置: j + 1 },
    };

    sorted.push(i);
    yield {
      id: `pass-${i}-end`,
      description: `前 ${i + 1} 个元素已有序`,
      state: makeSortState(arr, sorted, null, null, null, null, comparisons, moves, i),
      highlightedElements: [],
      highlightedLines: [],
      variables: { 已排序个数: sorted.length },
    };
  }

  yield {
    id: 'done',
    description: `排序完成，共比较 ${comparisons} 次、移动 ${moves} 次`,
    state: makeSortState(arr, sorted, null, null, null, null, comparisons, moves, 0),
    highlightedElements: [],
    highlightedLines: [],
    variables: { 比较次数: comparisons, 移动次数: moves },
  };
}

export const insertionSortModule: AlgorithmModule<SortState, number[]> = {
  meta: {
    id: 'sorting.insertion',
    name: '直接插入排序',
    nameEn: 'Insertion Sort',
    chapter: 'sorting',
    order: 3,
    summary: '将每个元素插入到左侧已排序部分的正确位置。',
    coreIdea:
      '将序列分为「已排序」与「未排序」两部分，每次取出未排序部分的第一个元素 key，在已排序部分中从后向前找到其正确位置并插入。',
    operationSteps: [
      '将 a[0] 视为初始已排序部分。',
      '取出未排序部分第一个元素 key = a[i]。',
      '从已排序部分末尾向前比较，比 key 大的元素依次后移。',
      '将 key 插入到最终空出的位置。',
    ],
    useCases: ['数据规模较小', '数据基本有序（接近 O(n)）', '链表插入场景'],
    complexity: {
      time: { best: 'O(n)', average: 'O(n²)', worst: 'O(n²)' },
      space: 'O(1)',
    },
    stable: true,
    pros: ['实现简单', '稳定排序', '基本有序时接近 O(n)', '空间复杂度 O(1)'],
    cons: ['平均与最坏时间复杂度 O(n²)', '大量元素时移动开销大'],
    examPoints: [
      '直接插入排序是稳定排序。',
      '最好情况（已有序）时间复杂度为 O(n)。',
      '适用于数据基本有序或规模较小的场景。',
    ],
    variableDocs: [
      { name: 'i', meaning: '当前待插入元素的下标' },
      { name: 'key', meaning: '当前待插入的元素值' },
      { name: 'j', meaning: '在已排序部分中寻找插入位置的游标' },
    ],
    code: { c: cCode, cpp: cppCode, pseudocode },
    inputSchema: [
      { key: 'array', label: '待排序数组', type: 'array', placeholder: '如：5, 3, 8, 1, 9, 2' },
    ],
    defaultInput: '5, 3, 8, 1, 9, 2',
    implemented: true,
    visualizer: 'bars',
  },
  generateSteps: insertionSortSteps,
  parseInput: parseArrayInput,
  createInitialState: createSortState,
};
