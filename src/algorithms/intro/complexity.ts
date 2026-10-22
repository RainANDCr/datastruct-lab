/**
 * 第一章 绪论：时间复杂度曲线可视化。
 *
 * 以「输入规模 n」为播放游标，随 n 增长动态展示
 * O(1) / O(log n) / O(n) / O(n log n) / O(n²) 的操作次数差异，
 * 直观呈现不同复杂度随规模增长的分化趋势。
 */
import type { AlgorithmModule, AlgorithmStep, ParseResult } from '@/engine/types';
import { COMPLEXITY_CURVES } from './curves';
import { createComplexityState, type ComplexityState } from './types';

const cCode = `/* 常见时间复杂度的典型代码结构 */
int sum = 0;

// O(1)：常数次操作，与 n 无关
sum = a + b;

// O(n)：单层循环，执行 n 次
for (int i = 0; i < n; i++)
    sum += a[i];

// O(n²)：双重循环，执行 n*n 次
for (int i = 0; i < n; i++)
    for (int j = 0; j < n; j++)
        sum += i * j;

// O(log n)：每次规模减半
while (n > 1)
    n = n / 2;`;

const cppCode = `// 常见时间复杂度的典型代码结构
int sum = 0;

// O(1)：常数次操作，与 n 无关
sum = a + b;

// O(n)：单层循环，执行 n 次
for (int i = 0; i < n; i++)
    sum += a[i];

// O(n²)：双重循环，执行 n*n 次
for (int i = 0; i < n; i++)
    for (int j = 0; j < n; j++)
        sum += i * j;

// O(log n)：每次规模减半
while (n > 1)
    n = n / 2;`;

const pseudocode = `复杂度定义（操作次数随规模 n 的变化）：
    O(1)        f(n) = 1
    O(log n)    f(n) = log2(n)
    O(n)        f(n) = n
    O(n log n)  f(n) = n * log2(n)
    O(n²)       f(n) = n * n

经验法则：
    单层循环 → O(n)
    双重循环 → O(n²)
    每次规模减半 → O(log n)
    分治归并 → O(n log n)`;

function parseInput(raw: string): ParseResult<number> {
  const n = Number(raw.trim());
  if (!Number.isFinite(n)) return { ok: false, error: '请输入有效数字' };
  const maxN = Math.round(n);
  if (maxN < 2) return { ok: false, error: '最大规模至少为 2' };
  if (maxN > 500) return { ok: false, error: '最大规模过大（最多 500）' };
  return { ok: true, value: maxN };
}

function* complexitySteps(input: number): Generator<AlgorithmStep<ComplexityState>> {
  const maxN = input;

  for (let n = 2; n <= maxN; n++) {
    const counts = COMPLEXITY_CURVES.map((c) => ({
      label: c.label,
      value: Math.max(1, Math.round(c.fn(n))),
    }));
    yield {
      id: `n-${n}`,
      description: `输入规模 n = ${n}：观察各复杂度操作次数的增长差异`,
      state: { n, maxN, counts },
      highlightedElements: [],
      highlightedLines: [],
      variables: Object.fromEntries(counts.map((c) => [c.label, c.value])),
      duration: 140,
    };
  }
}

export const complexityModule: AlgorithmModule<ComplexityState, number> = {
  meta: {
    id: 'intro.complexity',
    name: '时间复杂度曲线',
    nameEn: 'Time Complexity Curves',
    chapter: 'intro',
    order: 1,
    summary: '对比 O(1)、O(log n)、O(n)、O(n log n)、O(n²) 随规模增长的趋势。',
    coreIdea:
      '时间复杂度描述算法运行时间随输入规模 n 增长的变化趋势。忽略常数与低阶项，保留增长最快的项作为复杂度。本模块通过动画展示不同复杂度函数随 n 增大的分化：O(n²) 急剧上升，O(n log n) 次之，O(log n) 与 O(1) 增长缓慢。',
    operationSteps: [
      '拖动进度条或点击播放，让输入规模 n 从 1 逐渐增大。',
      '观察纵轴（对数坐标）上各曲线的上升速度。',
      '对比同一 n 下各复杂度的实际操作次数（图例区）。',
      '理解为何 O(n²) 算法在大规模数据下不可用。',
    ],
    useCases: ['理解复杂度概念', '算法选型评估', '考试中比较算法效率'],
    complexity: {
      time: { best: 'O(1)', average: '—', worst: 'O(n²)' },
      space: 'O(1)',
    },
    pros: ['直观展示不同复杂度的增长速度', '对数坐标便于同时观察数量级差异'],
    cons: ['曲线为理想化模型，未计入常数因子'],
    examPoints: [
      '复杂度比较：O(1) < O(log n) < O(n) < O(n log n) < O(n²)',
      '复杂度只反映增长趋势，忽略常数与低阶项。',
      '对数坐标下，O(n^k) 表现为斜率 k 的直线。',
    ],
    variableDocs: [
      { name: 'n', meaning: '输入规模（问题规模）' },
      { name: 'f(n)', meaning: '算法操作次数关于 n 的函数' },
    ],
    code: { c: cCode, cpp: cppCode, pseudocode },
    inputSchema: [
      { key: 'maxN', label: '最大规模 n', type: 'number', placeholder: '如 60（范围 2–500）' },
    ],
    defaultInput: '60',
    implemented: true,
    visualizer: 'chart',
  },
  generateSteps: complexitySteps,
  parseInput,
  createInitialState: createComplexityState,
};
