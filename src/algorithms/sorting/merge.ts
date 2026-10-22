/**
 * 归并排序（Merge Sort）
 *
 * 分治法：递归将序列对半分割，再两两归并有序子序列。
 * 底部展示临时数组 auxArray，range 标记当前归并区间。
 * 代码行号与 C / C++ / 伪代码严格对齐（三者均为 20 行）。
 */
import type { AlgorithmModule, AlgorithmStep } from '@/engine/types';
import { parseArrayInput } from './shared';
import { createSortState, type SortState } from './types';

const LINES = { split: [8, 9], merge: [12, 13, 14, 15, 16], copy: [18, 19] } as const;

const cCode = `void merge(int a[], int aux[], int lo, int mid, int hi) {
    for (int k = lo; k <= hi; k++) aux[k] = a[k];
    int i = lo, j = mid + 1;
    for (int k = lo; k <= hi; k++) {
        if (i > mid) a[k] = aux[j++];
        else if (j > hi) a[k] = aux[i++];
        else if (aux[j] < aux[i]) a[k] = aux[j++];
        else a[k] = aux[i++];
    }
}
void mergeSort(int a[], int aux[], int lo, int hi) {
    if (lo >= hi) return;
    int mid = lo + (hi - lo) / 2;
    mergeSort(a, aux, lo, mid);
    mergeSort(a, aux, mid + 1, hi);
    merge(a, aux, lo, mid, hi);
}
void sort(int a[], int n) {
    int aux[n];
    mergeSort(a, aux, 0, n - 1);
}`;

const cppCode = `void merge(vector<int>& a, vector<int>& aux, int lo, int mid, int hi) {
    for (int k = lo; k <= hi; k++) aux[k] = a[k];
    int i = lo, j = mid + 1;
    for (int k = lo; k <= hi; k++) {
        if (i > mid) a[k] = aux[j++];
        else if (j > hi) a[k] = aux[i++];
        else if (aux[j] < aux[i]) a[k] = aux[j++];
        else a[k] = aux[i++];
    }
}
void mergeSort(vector<int>& a, vector<int>& aux, int lo, int hi) {
    if (lo >= hi) return;
    int mid = lo + (hi - lo) / 2;
    mergeSort(a, aux, lo, mid);
    mergeSort(a, aux, mid + 1, hi);
    merge(a, aux, lo, mid, hi);
}
void sort(vector<int>& a) {
    vector<int> aux(a.size());
    mergeSort(a, aux, 0, a.size() - 1);
}`;

const pseudocode = `函数 merge(a, aux, lo, mid, hi):
    for k ← lo to hi do aux[k] ← a[k]
    i ← lo, j ← mid+1
    for k ← lo to hi do
        if i > mid then a[k] ← aux[j++]
        else if j > hi then a[k] ← aux[i++]
        else if aux[j] < aux[i] then a[k] ← aux[j++]
        else a[k] ← aux[i++]
    end for
结束函数
函数 mergeSort(a, aux, lo, hi):
    if lo ≥ hi then return
    mid ← lo + (hi-lo)/2
    mergeSort(a, aux, lo, mid)
    mergeSort(a, aux, mid+1, hi)
    merge(a, aux, lo, mid, hi)
结束函数
函数 sort(a, n):
    分配辅助数组 aux[0..n-1]
    mergeSort(a, aux, 0, n-1)
结束函数`;

function* mergeSortSteps(input: number[]): Generator<AlgorithmStep<SortState>> {
  const arr = [...input];
  const n = arr.length;
  const aux = [...arr];
  const sortedIndices: number[] = [];
  let comparisons = 0;
  let swaps = 0;

  const state = (comparing: [number, number] | null, swapping: [number, number] | null, range: [number, number] | null, auxSlice?: number[]): SortState => ({
    values: [...arr],
    comparing,
    swapping,
    sortedIndices: [...sortedIndices],
    pivotIndex: null,
    range,
    comparisons,
    swaps,
    pass: 0,
    auxArray: auxSlice ? [...auxSlice] : undefined,
  });

  function* mergeSort(lo: number, hi: number): Generator<AlgorithmStep<SortState>> {
    if (lo >= hi) return;
    const mid = Math.floor(lo + (hi - lo) / 2);
    yield {
      id: `split-${lo}-${hi}`,
      description: `分割区间 [${lo}, ${hi}] 为 [${lo}, ${mid}] 与 [${mid + 1}, ${hi}]`,
      state: state(null, null, [lo, hi]),
      highlightedElements: [],
      highlightedLines: [...LINES.split],
      variables: { 区间: `[${lo}, ${hi}]`, mid },
    };
    yield* mergeSort(lo, mid);
    yield* mergeSort(mid + 1, hi);

    // 归并
    for (let k = lo; k <= hi; k++) aux[k] = arr[k];
    let i = lo;
    let j = mid + 1;
    for (let k = lo; k <= hi; k++) {
      if (i > mid) {
        arr[k] = aux[j++];
      } else if (j > hi) {
        arr[k] = aux[i++];
      } else {
        comparisons += 1;
        yield {
          id: `cmp-${i}-${j}`,
          description: `比较 aux[${i}] = ${aux[i]} 与 aux[${j}] = ${aux[j]}`,
          state: state([i, j], null, [lo, hi], aux),
          highlightedElements: [`bar-${i}`, `bar-${j}`],
          highlightedLines: [...LINES.merge],
          variables: { 'aux[i]': aux[i], 'aux[j]': aux[j], 比较次数: comparisons },
        };
        if (aux[j] < aux[i]) arr[k] = aux[j++];
        else arr[k] = aux[i++];
      }
      swaps += 1;
    }
    yield {
      id: `merged-${lo}-${hi}`,
      description: `归并 [${lo}, ${hi}] 完成`,
      state: state(null, null, [lo, hi], aux),
      highlightedElements: [],
      highlightedLines: [...LINES.copy],
      variables: { 区间: `[${lo}, ${hi}]` },
    };
  }

  yield* mergeSort(0, n - 1);
  for (let k = 0; k < n; k++) sortedIndices.push(k);

  yield {
    id: 'done',
    description: `归并排序完成，共比较 ${comparisons} 次、移动 ${swaps} 次`,
    state: state(null, null, null),
    highlightedElements: [],
    highlightedLines: [],
    variables: { 比较次数: comparisons, 移动次数: swaps },
  };
}

export const mergeSortModule: AlgorithmModule<SortState, number[]> = {
  meta: {
    id: 'sorting.merge',
    name: '归并排序',
    nameEn: 'Merge Sort',
    chapter: 'sorting',
    order: 7,
    summary: '分治递归分割、两两归并有序子序列，稳定 O(n log n)。',
    coreIdea:
      '归并排序用分治法：递归把序列对半分割到单元素，再自底向上把两个有序子序列归并成一个有序序列。归并时借助临时数组比较两端元素，较小者依次放回原数组。',
    operationSteps: [
      '递归将序列对半分割，直到每个子序列只剩一个元素。',
      '归并两个相邻有序子序列：复制到临时数组。',
      '比较临时数组两端元素，较小者放回原数组。',
      '重复归并，直到整个序列有序。',
    ],
    useCases: ['大数据量稳定排序', '外部排序', '链表排序'],
    complexity: {
      time: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n log n)' },
      space: 'O(n) 辅助数组',
    },
    stable: true,
    pros: ['稳定、时间稳定 O(n log n)', '适合外部排序', '适合链表'],
    cons: ['需要 O(n) 额外空间', '常数因子较大'],
    examPoints: [
      '归并排序是稳定排序。',
      '分治：分割 + 归并，时间 O(n log n)。',
      '需要 O(n) 的辅助数组空间。',
      '与快排对比：归并稳定但需额外空间。',
    ],
    variableDocs: [
      { name: 'aux', meaning: '归并用的临时数组' },
      { name: 'i / j', meaning: '左右子序列的归并游标' },
      { name: 'mid', meaning: '分割中点' },
    ],
    code: { c: cCode, cpp: cppCode, pseudocode },
    inputSchema: [
      { key: 'array', label: '待排序数组', type: 'array', placeholder: '如：5, 3, 8, 1, 9, 2' },
    ],
    defaultInput: '8, 3, 5, 1, 9, 2, 7, 4',
    implemented: true,
    visualizer: 'bars',
  },
  generateSteps: mergeSortSteps,
  parseInput: parseArrayInput,
  createInitialState: createSortState,
};
