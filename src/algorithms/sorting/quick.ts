/**
 * 快速排序（Quick Sort）
 *
 * 分治 + 基准划分：每趟将基准放到最终位置，左右区间递归。
 * 使用 yield* 表达递归，完整保留每一步状态快照。
 * 代码行号与 C / C++ / 伪代码严格对齐（三者均为 18 行）。
 */
import type { AlgorithmModule, AlgorithmStep } from '@/engine/types';
import { makeSortState, parseArrayInput } from './shared';
import { createSortState, type SortState } from './types';

const LINES = {
  base: 2,
  pivot: 3,
  compare: 6,
  swap: [7, 8, 9],
  place: [13, 14, 15],
  recurse: 16,
} as const;

const cCode = `void quickSort(int a[], int lo, int hi) {
    if (lo >= hi) return;
    int pivot = a[hi];
    int i = lo;
    for (int j = lo; j < hi; j++) {
        if (a[j] < pivot) {
            int temp = a[i];
            a[i] = a[j];
            a[j] = temp;
            i++;
        }
    }
    int temp = a[i];
    a[i] = a[hi];
    a[hi] = temp;
    quickSort(a, lo, i - 1);
    quickSort(a, i + 1, hi);
}`;

const cppCode = `void quickSort(vector<int>& a, int lo, int hi) {
    if (lo >= hi) return;
    int pivot = a[hi];
    int i = lo;
    for (int j = lo; j < hi; j++) {
        if (a[j] < pivot) {
            int temp = a[i];
            a[i] = a[j];
            a[j] = temp;
            i++;
        }
    }
    int temp = a[i];
    a[i] = a[hi];
    a[hi] = temp;
    quickSort(a, lo, i - 1);
    quickSort(a, i + 1, hi);
}`;

const pseudocode = `算法 quickSort(a, lo, hi)
    if lo >= hi then return
    pivot ← a[hi]
    i ← lo
    for j ← lo to hi-1 do
        if a[j] < pivot then
            temp ← a[i]
            a[i] ← a[j]
            a[j] ← temp
            i ← i+1
        end if
    end for
    temp ← a[i]
    a[i] ← a[hi]
    a[hi] ← temp
    quickSort(a, lo, i-1)
    quickSort(a, i+1, hi)`;

function* quickSortSteps(input: number[]): Generator<AlgorithmStep<SortState>> {
  const arr = [...input]; // 不修改输入
  const sorted: number[] = [];
  let comparisons = 0;
  let swaps = 0;

  function* partition(lo: number, hi: number): Generator<AlgorithmStep<SortState>> {
    if (lo >= hi) {
      if (lo === hi && !sorted.includes(lo)) {
        sorted.push(lo);
        yield {
          id: `base-${lo}-${hi}`,
          description: `区间 [${lo}, ${hi}] 只有一个元素，已就位`,
          state: makeSortState(arr, sorted, null, null, null, null, comparisons, swaps, 0),
          highlightedElements: [`bar-${lo}`],
          highlightedLines: [LINES.base],
          variables: { lo, hi },
        };
      }
      return;
    }

    const pivotValue = arr[hi];
    yield {
      id: `pivot-${lo}-${hi}`,
      description: `选取基准 pivot = a[${hi}] = ${pivotValue}，分区区间 [${lo}, ${hi}]`,
      state: makeSortState(arr, sorted, null, null, hi, [lo, hi], comparisons, swaps, 0),
      highlightedElements: [`bar-${hi}`],
      highlightedLines: [LINES.pivot],
      variables: { lo, hi, pivot: pivotValue },
    };

    let i = lo;
    for (let j = lo; j < hi; j++) {
      comparisons += 1;
      yield {
        id: `cmp-${lo}-${hi}-${j}`,
        description: `比较 a[${j}]=${arr[j]} 与基准 pivot=${pivotValue}`,
        state: makeSortState(arr, sorted, [j, hi], null, hi, [lo, hi], comparisons, swaps, 0),
        highlightedElements: [`bar-${j}`, `bar-${hi}`],
        highlightedLines: [LINES.compare],
        variables: { lo, hi, i, j, pivot: pivotValue, 比较次数: comparisons },
      };

      if (arr[j] < pivotValue) {
        if (i !== j) {
          const aj = arr[j];
          [arr[i], arr[j]] = [arr[j], arr[i]];
          swaps += 1;
          yield {
            id: `swap-${lo}-${hi}-${j}`,
            description: `${aj} 小于基准，交换 a[${i}] 与 a[${j}]`,
            state: makeSortState(arr, sorted, null, [i, j], hi, [lo, hi], comparisons, swaps, 0),
            highlightedElements: [`bar-${i}`, `bar-${j}`],
            highlightedLines: [...LINES.swap],
            variables: { lo, hi, i, j, pivot: pivotValue, 交换次数: swaps },
          };
        }
        i += 1;
      }
    }

    if (i !== hi) {
      [arr[i], arr[hi]] = [arr[hi], arr[i]];
      swaps += 1;
    }
    yield {
      id: `place-${lo}-${hi}`,
      description: `基准 ${pivotValue} 归位到最终位置 ${i}`,
      state: makeSortState(arr, sorted, null, null, i, [lo, hi], comparisons, swaps, 0),
      highlightedElements: [`bar-${i}`],
      highlightedLines: [...LINES.place],
      variables: { lo, hi, i, pivot: pivotValue, 交换次数: swaps },
    };

    sorted.push(i);
    yield {
      id: `placed-${lo}-${hi}`,
      description: `基准 ${pivotValue} 已就位于 a[${i}]，递归处理左右子区间`,
      state: makeSortState(arr, sorted, null, null, null, null, comparisons, swaps, 0),
      highlightedElements: [`bar-${i}`],
      highlightedLines: [LINES.recurse],
      variables: { 已排序个数: sorted.length },
    };

    yield* partition(lo, i - 1);
    yield* partition(i + 1, hi);
  }

  yield* partition(0, arr.length - 1);

  yield {
    id: 'done',
    description: `排序完成，共比较 ${comparisons} 次、交换 ${swaps} 次`,
    state: makeSortState(arr, sorted, null, null, null, null, comparisons, swaps, 0),
    highlightedElements: [],
    highlightedLines: [],
    variables: { 比较次数: comparisons, 交换次数: swaps },
  };
}

export const quickSortModule: AlgorithmModule<SortState, number[]> = {
  meta: {
    id: 'sorting.quick',
    name: '快速排序',
    nameEn: 'Quick Sort',
    chapter: 'sorting',
    order: 4,
    summary: '分治：每趟把基准放到最终位置，再递归处理左右子区间。',
    coreIdea:
      '选取一个基准（pivot），通过一趟划分将序列分为「小于基准」与「大于基准」两部分，并把基准放到最终位置；再对左右子区间递归执行同一过程。',
    operationSteps: [
      '选取基准 pivot（本实现取区间最右元素）。',
      '遍历区间，将小于 pivot 的元素交换到左侧，维护分界下标 i。',
      '一趟结束后，将 pivot 与 a[i] 交换，使基准归位。',
      '对基准左侧与右侧子区间递归执行上述过程。',
    ],
    useCases: ['大规模数据的通用高效排序', '多数标准库排序的底层实现', '数据随机分布场景'],
    complexity: {
      time: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n²)' },
      space: 'O(log n)',
    },
    stable: false,
    pros: ['平均性能优秀 O(n log n)', '原地排序', '常数因子小、实际运行快'],
    cons: ['最坏情况 O(n²)（如已有序序列）', '不稳定排序', '递归需栈空间 O(log n)'],
    examPoints: [
      '快速排序是不稳定排序。',
      '平均/最好时间复杂度 O(n log n)，最坏 O(n²)。',
      '最坏情况出现在序列已有序（基准取端点）时。',
      '空间复杂度为递归栈深度 O(log n)。',
    ],
    variableDocs: [
      { name: 'lo / hi', meaning: '当前分区的左右边界' },
      { name: 'pivot', meaning: '基准元素（取 a[hi]）' },
      { name: 'i', meaning: '小于基准区间的分界下标' },
      { name: 'j', meaning: '当前扫描下标' },
    ],
    code: { c: cCode, cpp: cppCode, pseudocode },
    inputSchema: [
      { key: 'array', label: '待排序数组', type: 'array', placeholder: '如：5, 3, 8, 1, 9, 2' },
    ],
    defaultInput: '5, 3, 8, 1, 9, 2',
    implemented: true,
    visualizer: 'bars',
  },
  generateSteps: quickSortSteps,
  parseInput: parseArrayInput,
  createInitialState: createSortState,
};
