/**
 * 堆排序（Heap Sort）
 *
 * 将数组视为完全二叉树（下标 i 的左子 2i+1、右子 2i+2），
 * 先建大顶堆，再反复交换堆顶与堆尾、缩小堆并下沉调整。
 * 数组视图用 range 标记当前堆区间，父子下标在说明中展示对应关系。
 * 代码行号与 C / C++ / 伪代码严格对齐（三者均为 21 行）。
 */
import type { AlgorithmModule, AlgorithmStep } from '@/engine/types';
import { parseArrayInput } from './shared';
import { createSortState, type SortState } from './types';

const LINES = { sift: [3, 4, 5, 6, 7, 8, 9, 10, 11], build: [14, 15], swap: [18, 19], loop: [16, 17] } as const;

const cCode = `// 下标 i 的左子 2i+1、右子 2i+2
void siftDown(int a[], int start, int end) {
    int root = start;
    while (root * 2 + 1 < end) {
        int child = root * 2 + 1;
        if (child + 1 < end && a[child] < a[child + 1])
            child++;
        if (a[root] >= a[child]) break;
        int t = a[root]; a[root] = a[child]; a[child] = t;
        root = child;
    }
}
void heapSort(int a[], int n) {
    for (int i = n / 2 - 1; i >= 0; i--)
        siftDown(a, i, n);
    for (int end = n - 1; end > 0; end--) {
        int t = a[0]; a[0] = a[end]; a[end] = t;
        siftDown(a, 0, end);
    }
}`;

const cppCode = `// 下标 i 的左子 2i+1、右子 2i+2
void siftDown(vector<int>& a, int start, int end) {
    int root = start;
    while (root * 2 + 1 < end) {
        int child = root * 2 + 1;
        if (child + 1 < end && a[child] < a[child + 1])
            child++;
        if (a[root] >= a[child]) break;
        swap(a[root], a[child]);
        root = child;
    }
}
void heapSort(vector<int>& a) {
    for (int i = a.size() / 2 - 1; i >= 0; i--)
        siftDown(a, i, a.size());
    for (int end = a.size() - 1; end > 0; end--) {
        swap(a[0], a[end]);
        siftDown(a, 0, end);
    }
}`;

const pseudocode = `// 下标 i 的左子 2i+1、右子 2i+2
函数 siftDown(a, start, end):
    root ← start
    while root*2+1 < end do
        child ← root*2+1
        if child+1 < end 且 a[child] < a[child+1] then
            child ← child+1
        if a[root] ≥ a[child] then break
        交换 a[root] 与 a[child]
        root ← child
    end while
结束函数
函数 heapSort(a, n):
    for i ← n/2-1 downto 0 do siftDown(a, i, n)
    for end ← n-1 downto 1 do
        交换 a[0] 与 a[end]
        siftDown(a, 0, end)
    end for
结束函数`;

function* heapSortSteps(input: number[]): Generator<AlgorithmStep<SortState>> {
  const arr = [...input];
  const n = arr.length;
  const sortedIndices: number[] = [];
  let comparisons = 0;
  let swaps = 0;

  const state = (comparing: [number, number] | null, swapping: [number, number] | null, heapEnd: number): SortState => ({
    values: [...arr],
    comparing,
    swapping,
    sortedIndices: [...sortedIndices],
    pivotIndex: null,
    range: heapEnd > 0 ? [0, heapEnd - 1] : null,
    comparisons,
    swaps,
    pass: 0,
  });

  function* siftDown(start: number, end: number): Generator<AlgorithmStep<SortState>> {
    let root = start;
    while (root * 2 + 1 < end) {
      let child = root * 2 + 1;
      if (child + 1 < end) {
        comparisons += 1;
        yield {
          id: `cmp-child-${root}-${child}`,
          description: `比较左右子：a[${child}] = ${arr[child]} 与 a[${child + 1}] = ${arr[child + 1]}`,
          state: state([child, child + 1], null, end),
          highlightedElements: [`bar-${child}`, `bar-${child + 1}`],
          highlightedLines: [...LINES.sift],
          variables: { 父: root, 左子: child, 右子: child + 1 },
        };
        if (arr[child] < arr[child + 1]) child++;
      }
      comparisons += 1;
      yield {
        id: `cmp-root-${root}-${child}`,
        description: `比较父 a[${root}] = ${arr[root]} 与较大子 a[${child}] = ${arr[child]}`,
        state: state([root, child], null, end),
        highlightedElements: [`bar-${root}`, `bar-${child}`],
        highlightedLines: [...LINES.sift],
        variables: { 父: root, 子: child },
      };
      if (arr[root] >= arr[child]) break;
      [arr[root], arr[child]] = [arr[child], arr[root]];
      swaps += 1;
      yield {
        id: `swap-${root}-${child}`,
        description: `父小于子，交换 a[${root}] 与 a[${child}]`,
        state: state(null, [root, child], end),
        highlightedElements: [`bar-${root}`, `bar-${child}`],
        highlightedLines: [...LINES.sift],
        variables: { 交换: `a[${root}]↔a[${child}]` },
      };
      root = child;
    }
  }

  yield {
    id: 'build-start',
    description: '建堆：从最后一个非叶结点 n/2-1 开始向前逐一下沉',
    state: state(null, null, n),
    highlightedElements: [],
    highlightedLines: [...LINES.build],
    variables: { 堆区间: `[0, ${n - 1}]` },
  };

  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
    yield {
      id: `build-${i}`,
      description: `下沉结点 ${i}（a[${i}] = ${arr[i]}），使其满足大顶堆`,
      state: state(null, null, n),
      highlightedElements: [`bar-${i}`],
      highlightedLines: [...LINES.build],
      variables: { 当前结点: i },
    };
    yield* siftDown(i, n);
  }

  yield {
    id: 'built',
    description: '建堆完成，arr 已是大顶堆（堆顶为最大值）',
    state: state(null, null, n),
    highlightedElements: [`bar-0`],
    highlightedLines: [],
    variables: { 堆顶: arr[0] },
  };

  for (let end = n - 1; end > 0; end--) {
    [arr[0], arr[end]] = [arr[end], arr[0]];
    swaps += 1;
    yield {
      id: `swap-top-${end}`,
      description: `交换堆顶 a[0] = ${arr[0]} 与堆尾 a[${end}] = ${arr[end]}`,
      state: state(null, [0, end], end),
      highlightedElements: [`bar-0`, `bar-${end}`],
      highlightedLines: [...LINES.swap],
      variables: { 交换: `堆顶↔a[${end}]` },
    };
    sortedIndices.push(end);
    yield {
      id: `heapify-${end}`,
      description: `堆缩小为 [0, ${end - 1}]，下沉新的堆顶`,
      state: state(null, null, end),
      highlightedElements: [],
      highlightedLines: [...LINES.loop],
      variables: { 堆区间: `[0, ${end - 1}]` },
    };
    yield* siftDown(0, end);
  }
  sortedIndices.push(0);

  yield {
    id: 'done',
    description: `堆排序完成，共比较 ${comparisons} 次、交换 ${swaps} 次`,
    state: state(null, null, 0),
    highlightedElements: [],
    highlightedLines: [],
    variables: { 比较次数: comparisons, 交换次数: swaps },
  };
}

export const heapSortModule: AlgorithmModule<SortState, number[]> = {
  meta: {
    id: 'sorting.heap',
    name: '堆排序',
    nameEn: 'Heap Sort',
    chapter: 'sorting',
    order: 6,
    summary: '建大顶堆，反复取堆顶到末尾，下沉调整，O(n log n)。',
    coreIdea:
      '堆排序将数组视为完全二叉树（i 的左子 2i+1、右子 2i+2）。先自底向上建大顶堆；然后反复将堆顶（最大值）与堆尾交换、堆大小减一，并对新堆顶下沉调整，最终得到有序序列。',
    operationSteps: [
      '将数组视作完全二叉树，下标 i 的左子为 2i+1、右子为 2i+2。',
      '从 n/2-1 向前逐个下沉，建立大顶堆。',
      '交换堆顶与堆尾元素，堆大小减 1。',
      '对新堆顶下沉，重复直到堆大小为 1。',
    ],
    useCases: ['大规模数据排序', '求 top-k 大/小元素', '优先队列实现'],
    complexity: {
      time: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n log n)' },
      space: 'O(1)',
    },
    stable: false,
    pros: ['时间稳定 O(n log n)', '原地排序空间 O(1)', '无递归栈开销'],
    cons: ['不稳定', '常数因子较大', '不能利用局部有序性'],
    examPoints: [
      '堆排序是不稳定排序。',
      '堆是一棵完全二叉树，可用数组存储。',
      '下标 i 的左子 2i+1、右子 2i+2，父结点 (i-1)/2。',
      '建堆 O(n)，整体 O(n log n)。',
    ],
    variableDocs: [
      { name: 'root', meaning: '当前下沉的父结点' },
      { name: 'child', meaning: '当前较大的孩子' },
      { name: 'end', meaning: '堆区间右边界（不包含）' },
    ],
    code: { c: cCode, cpp: cppCode, pseudocode },
    inputSchema: [
      { key: 'array', label: '待排序数组', type: 'array', placeholder: '如：4, 10, 3, 5, 1' },
    ],
    defaultInput: '4, 10, 3, 5, 1, 7, 2',
    implemented: true,
    visualizer: 'bars',
  },
  generateSteps: heapSortSteps,
  parseInput: parseArrayInput,
  createInitialState: createSortState,
};
