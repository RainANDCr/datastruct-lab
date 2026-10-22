/**
 * 第一章 绪论：复杂度知识卡片。
 *
 * 静态知识卡片，展示常见时间复杂度的定义、典型代码结构与增长速度排序。
 * 复用 ArrayView，items 展示 n=100 时各复杂度的操作次数对比。
 */
import type { AlgorithmModule, AlgorithmStep, ParseResult } from '@/engine/types';
import type { ArrayState } from '../linear-list/types';

const cCode = `/* 常见复杂度与典型代码 */
O(1)      : 常数操作，如 a + b
O(log n)  : 每次规模减半，如二分查找
O(n)      : 单层循环，如顺序查找
O(n log n): 分治，如归并/快排
O(n²)     : 双重循环，如冒泡/选择`;

const cppCode = `// 常见复杂度与典型代码
// O(1)      常数操作，如 a + b
// O(log n)  每次规模减半，如二分查找
// O(n)      单层循环，如顺序查找
// O(n log n) 分治，如归并/快排
// O(n²)     双重循环，如冒泡/选择`;

const pseudocode = `常见复杂度排序（增长速度）：
    O(1) < O(log n) < O(n) < O(n log n) < O(n²) < O(2ⁿ)

记忆口诀：
    常数 < 对数 < 线性 < 线性对数 < 平方 < 指数

n=100 时操作次数（约）：
    O(1)       1
    O(log n)   7
    O(n)       100
    O(n log n) 700
    O(n²)      10000`;

function parseInput(_raw: string): ParseResult<null> {
  return { ok: true, value: null };
}

function makeState(items: number[], info: Record<string, string | number>): ArrayState {
  return { items: [...items], highlighted: [], markers: [], info };
}

function createInitialState(): ArrayState {
  return makeState([], { 提示: '复杂度知识卡片' });
}

function* knowledgeCardsSteps(): Generator<AlgorithmStep<ArrayState>> {
  // n=100 时各复杂度的操作次数
  const items = [1, 7, 100, 700, 10000];

  yield {
    id: 'cards',
    description: 'n=100 时各复杂度操作次数：O(1)=1，O(log n)=7，O(n)=100，O(n log n)=700，O(n²)=10000',
    state: makeState(items, { n: 100, 排序: 'O(1) < O(log n) < O(n) < O(n log n) < O(n²)' }),
    highlightedElements: [],
    highlightedLines: [],
    variables: { 复杂度排序: 'O(1) < O(log n) < O(n) < O(n log n) < O(n²)' },
  };

  yield {
    id: 'done',
    description: '复杂度知识卡片展示完毕',
    state: makeState(items, { n: 100 }),
    highlightedElements: [],
    highlightedLines: [],
    variables: {},
  };
}

export const knowledgeCardsModule: AlgorithmModule<ArrayState, null> = {
  meta: {
    id: 'intro.knowledge-cards',
    name: '复杂度知识卡片',
    nameEn: 'Complexity Knowledge Cards',
    chapter: 'intro',
    order: 3,
    summary: '常见复杂度的定义、典型代码与增长速度排序。',
    coreIdea:
      '时间复杂度按增长速度排序：O(1) < O(log n) < O(n) < O(n log n) < O(n²) < O(2ⁿ)。复杂度忽略常数与低阶项，只保留增长最快的项，用于评估算法在大规模数据下的表现。',
    operationSteps: ['记忆复杂度增长速度排序。', '理解各复杂度的典型代码结构。', '对比 n=100 时各复杂度的操作次数。'],
    useCases: ['算法选型', '考试复习', '复杂度速查'],
    complexity: {
      time: { best: 'O(1)', average: '—', worst: 'O(n²)' },
      space: 'O(1)',
    },
    pros: ['系统梳理复杂度知识', '速查方便'],
    cons: ['静态内容，无动画'],
    examPoints: [
      '复杂度排序：O(1) < O(log n) < O(n) < O(n log n) < O(n²) < O(2ⁿ)。',
      '复杂度忽略常数与低阶项。',
      'O(n log n) 是排序的下界（比较排序）。',
    ],
    variableDocs: [{ name: 'n', meaning: '输入规模' }],
    code: { c: cCode, cpp: cppCode, pseudocode },
    inputSchema: [{ key: 'dummy', label: '无需输入', type: 'string', placeholder: '本模块为静态知识卡片' }],
    defaultInput: '',
    implemented: true,
    visualizer: 'array',
  },
  generateSteps: knowledgeCardsSteps,
  parseInput,
  createInitialState,
};
