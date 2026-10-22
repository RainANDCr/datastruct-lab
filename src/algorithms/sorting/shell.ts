/**
 * 希尔排序（Shell Sort）
 *
 * 插入排序的改进：按增量 gap 分组做插入排序，gap 逐步缩小到 1。
 * 代码行号与 C / C++ / 伪代码严格对齐（三者均为 12 行）。
 */
import type { AlgorithmModule, AlgorithmStep } from '@/engine/types';
import { parseArrayInput } from './shared';
import { createSortState, type SortState } from './types';

const LINES = { gap: 2, outer: 3, key: 4, while: 6, shift: 7, insert: 9 } as const;

const cCode = `void shellSort(int a[], int n) {
    for (int gap = n / 2; gap > 0; gap /= 2) {
        for (int i = gap; i < n; i++) {
            int key = a[i];
            int j = i;
            while (j >= gap && a[j - gap] > key) {
                a[j] = a[j - gap];
                j -= gap;
            }
            a[j] = key;
        }
    }
}`;

const cppCode = `void shellSort(vector<int>& a) {
    for (int gap = a.size() / 2; gap > 0; gap /= 2) {
        for (int i = gap; i < (int)a.size(); i++) {
            int key = a[i];
            int j = i;
            while (j >= gap && a[j - gap] > key) {
                a[j] = a[j - gap];
                j -= gap;
            }
            a[j] = key;
        }
    }
}`;

const pseudocode = `算法 shellSort(a[0..n-1])
    for gap ← n/2 downto 1（gap 每次减半）do
        for i ← gap to n-1 do
            key ← a[i]
            j ← i
            while j ≥ gap 且 a[j-gap] > key do
                a[j] ← a[j-gap]
                j ← j - gap
            end while
            a[j] ← key
        end for
    end for
结束`;

function* shellSortSteps(input: number[]): Generator<AlgorithmStep<SortState>> {
  const arr = [...input];
  const n = arr.length;
  const sortedIndices: number[] = [];
  let comparisons = 0;
  let swaps = 0;

  const state = (comparing: [number, number] | null, swapping: [number, number] | null, step?: number): SortState => ({
    values: [...arr],
    comparing,
    swapping,
    sortedIndices: [...sortedIndices],
    pivotIndex: null,
    comparisons,
    swaps,
    pass: 0,
    step,
  });

  for (let gap = Math.floor(n / 2); gap >= 1; gap = Math.floor(gap / 2)) {
    yield {
      id: `gap-${gap}`,
      description: `取增量 gap = ${gap}，按间隔 ${gap} 分组做插入排序`,
      state: state(null, null, gap),
      highlightedElements: [],
      highlightedLines: [LINES.gap],
      variables: { gap },
    };

    for (let i = gap; i < n; i++) {
      const key = arr[i];
      let j = i;
      yield {
        id: `key-${gap}-${i}`,
        description: `取 key = a[${i}] = ${key}，向前按间隔 ${gap} 比较插入`,
        state: state([j, Math.max(j - gap, 0)], null, gap),
        highlightedElements: [`bar-${i}`],
        highlightedLines: [LINES.outer, LINES.key],
        variables: { gap, i, key },
      };

      while (j >= gap && arr[j - gap] > key) {
        comparisons += 1;
        yield {
          id: `cmp-${gap}-${i}-${j}`,
          description: `a[${j - gap}] = ${arr[j - gap]} > key = ${key}，后移`,
          state: state([j - gap, j], null, gap),
          highlightedElements: [`bar-${j - gap}`, `bar-${j}`],
          highlightedLines: [LINES.while],
          variables: { 'a[j-gap]': arr[j - gap], key, 比较次数: comparisons },
        };
        arr[j] = arr[j - gap];
        swaps += 1;
        yield {
          id: `shift-${gap}-${i}-${j}`,
          description: `a[${j}] = a[${j - gap}] = ${arr[j]}`,
          state: state(null, [j - gap, j], gap),
          highlightedElements: [`bar-${j}`],
          highlightedLines: [LINES.shift],
          variables: { 'a[j]': arr[j], 移动次数: swaps },
        };
        j -= gap;
      }
      if (j >= gap) comparisons += 1;

      arr[j] = key;
      if (j !== i) {
        swaps += 1;
        yield {
          id: `ins-${gap}-${i}`,
          description: `将 key = ${key} 插入到位置 ${j}`,
          state: state(null, [j, i], gap),
          highlightedElements: [`bar-${j}`],
          highlightedLines: [LINES.insert],
          variables: { '插入位置': j, key },
        };
      }
    }
  }

  for (let k = 0; k < n; k++) sortedIndices.push(k);
  yield {
    id: 'done',
    description: `希尔排序完成，共比较 ${comparisons} 次、移动 ${swaps} 次`,
    state: state(null, null),
    highlightedElements: [],
    highlightedLines: [],
    variables: { 比较次数: comparisons, 移动次数: swaps },
  };
}

export const shellSortModule: AlgorithmModule<SortState, number[]> = {
  meta: {
    id: 'sorting.shell',
    name: '希尔排序',
    nameEn: 'Shell Sort',
    chapter: 'sorting',
    order: 4,
    summary: '按增量分组做插入排序，逐步缩小增量，是插入排序的改进。',
    coreIdea:
      '希尔排序先将序列按增量 gap 分成若干子序列，对每个子序列做插入排序；随后逐步缩小 gap（通常减半），最后一次 gap=1 即整体插入排序。前期大步距让元素快速归位，使后期插入排序基本有序、效率更高。',
    operationSteps: [
      '取增量 gap = n/2。',
      '对每个子序列（间隔 gap 的元素）做插入排序。',
      'gap 减半，重复上一步。',
      '直到 gap = 1 完成最后一次插入排序。',
    ],
    useCases: ['中等规模数据', '需要比简单插入更快的场景', '数据基本无序时的改进'],
    complexity: {
      time: { best: 'O(n log n)', average: 'O(n^1.3) 经验值', worst: 'O(n²)' },
      space: 'O(1)',
    },
    stable: false,
    pros: ['实现简单', '比直接插入排序快', '空间 O(1)'],
    cons: ['不稳定', '时间复杂度依赖增量序列', '最坏仍 O(n²)'],
    examPoints: [
      '希尔排序是不稳定排序。',
      '希尔排序是直接插入排序的改进。',
      '增量为 1 时就是直接插入排序。',
      '时间复杂度介于 O(n) 与 O(n²) 之间。',
    ],
    variableDocs: [
      { name: 'gap', meaning: '当前增量（分组间隔）' },
      { name: 'key', meaning: '当前待插入元素' },
      { name: 'j', meaning: '插入位置的游标' },
    ],
    code: { c: cCode, cpp: cppCode, pseudocode },
    inputSchema: [
      { key: 'array', label: '待排序数组', type: 'array', placeholder: '如：5, 3, 8, 1, 9, 2' },
    ],
    defaultInput: '8, 9, 1, 7, 2, 3, 5, 4, 6, 0',
    implemented: true,
    visualizer: 'bars',
  },
  generateSteps: shellSortSteps,
  parseInput: parseArrayInput,
  createInitialState: createSortState,
};
