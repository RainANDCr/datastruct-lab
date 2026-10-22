/**
 * 第一章 绪论：操作次数模拟。
 *
 * 以冒泡排序为例，展示操作次数 n(n-1)/2 随输入规模 n 的实际增长，
 * 直观理解「操作次数随规模增长」这一核心概念。复用 ArrayView。
 * 输入：规模 n（数组格子展示 n=1..n 的比较次数）。
 */
import type { AlgorithmModule, AlgorithmStep, ParseResult } from '@/engine/types';
import type { ArrayState } from '../linear-list/types';

const cCode = `// 冒泡排序比较次数模拟
int countComparisons(int n) {
    return n * (n - 1) / 2;
}
// 规模 n=10：45 次比较
// 规模 n=100：4950 次比较
// 规模 n=1000：499500 次比较`;

const cppCode = `// 冒泡排序比较次数模拟
int countComparisons(int n) {
    return n * (n - 1) / 2;
}
// 规模 n=10：45 次比较
// 规模 n=100：4950 次比较
// 规模 n=1000：499500 次比较`;

const pseudocode = `操作次数模拟（冒泡排序比较次数）：
    比较次数 f(n) = n(n-1)/2

    n=10    → 45
    n=100   → 4950
    n=1000  → 499500

    规模扩大 10 倍，操作次数扩大约 100 倍（O(n²)）。`;

function parseInput(raw: string): ParseResult<number> {
  const n = Number(raw.trim());
  if (!Number.isFinite(n)) return { ok: false, error: '请输入有效数字' };
  const size = Math.round(n);
  if (size < 1) return { ok: false, error: '规模至少为 1' };
  if (size > 30) return { ok: false, error: '规模过大（最多 30）' };
  return { ok: true, value: size };
}

function makeState(items: number[], highlighted: number[], info: Record<string, string | number>): ArrayState {
  return { items: [...items], highlighted, markers: [], info };
}

function createInitialState(): ArrayState {
  return makeState([], [], { 提示: '请输入规模 n' });
}

function* operationCountSteps(input: number): Generator<AlgorithmStep<ArrayState>> {
  const n = input;
  const items: number[] = [];

  yield {
    id: 'init',
    description: '冒泡排序比较次数 n(n-1)/2 随规模增长模拟',
    state: makeState([], [], { 公式: 'n(n-1)/2' }),
    highlightedElements: [],
    highlightedLines: [],
    variables: {},
  };

  for (let i = 1; i <= n; i++) {
    const count = (i * (i - 1)) / 2;
    items.push(count);
    yield {
      id: `n-${i}`,
      description: `规模 n=${i}：比较次数 = ${count}`,
      state: makeState(items, [i - 1], { 规模: i, 比较次数: count }),
      highlightedElements: [`cell-${i - 1}`],
      highlightedLines: [],
      variables: { 规模: i, 比较次数: count },
    };
  }

  yield {
    id: 'done',
    description: `规模 n=${n} 时，冒泡排序比较 ${(n * (n - 1)) / 2} 次（O(n²)）`,
    state: makeState(items, [], { 最大规模: n, 最大次数: (n * (n - 1)) / 2 }),
    highlightedElements: [],
    highlightedLines: [],
    variables: { 最大次数: (n * (n - 1)) / 2 },
  };
}

export const operationCountModule: AlgorithmModule<ArrayState, number> = {
  meta: {
    id: 'intro.operation-count',
    name: '操作次数模拟',
    nameEn: 'Operation Count Simulation',
    chapter: 'intro',
    order: 2,
    summary: '冒泡排序比较次数 n(n-1)/2 随规模的实际增长模拟。',
    coreIdea:
      '算法效率可用操作次数衡量。以冒泡排序为例，比较次数 f(n) = n(n-1)/2，随规模 n 呈平方级增长：规模扩大 10 倍，操作次数扩大约 100 倍。本模块展示这一实际增长过程。',
    operationSteps: ['输入规模 n。', '逐规模计算冒泡排序比较次数 n(n-1)/2。', '观察操作次数随规模的增长。', '理解 O(n²) 的平方级增长。'],
    useCases: ['理解操作次数概念', '感受 O(n²) 增长', '考试估算操作次数'],
    complexity: {
      time: { best: 'O(n²)', average: 'O(n²)', worst: 'O(n²)' },
      space: 'O(1)',
    },
    pros: ['直观展示操作次数增长', '具体数字便于理解'],
    cons: ['仅以冒泡排序为例'],
    examPoints: [
      '冒泡排序比较次数 n(n-1)/2。',
      '规模扩大 10 倍，O(n²) 操作次数扩大约 100 倍。',
      '操作次数是时间复杂度的具体体现。',
    ],
    variableDocs: [
      { name: 'n', meaning: '输入规模' },
      { name: 'f(n)', meaning: '操作次数 = n(n-1)/2' },
    ],
    code: { c: cCode, cpp: cppCode, pseudocode },
    inputSchema: [{ key: 'n', label: '规模 n', type: 'number', placeholder: '如 15（范围 1–30）' }],
    defaultInput: '15',
    implemented: true,
    visualizer: 'array',
  },
  generateSteps: operationCountSteps,
  parseInput,
  createInitialState,
};
