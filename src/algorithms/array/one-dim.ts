/**
 * 一维数组（1-Dimensional Array）
 *
 * 展示一维数组的顺序存储与下标寻址 a[i] = base + i*size。
 * 复用 ArrayView。
 */
import type { AlgorithmModule, AlgorithmStep } from '@/engine/types';
import type { ArrayState } from '../linear-list/types';
import { parseArray } from './shared';

const cLines = [
  '// 一维数组顺序存储',
  'int a[MAXN];',
  '// 元素 a[i] 的地址 = base + i * sizeof(int)',
  '// 下标从 0 开始，连续存储。',
  '// 访问 a[i] 为 O(1) 随机访问。',
];

const cppLines = [
  '// 一维数组顺序存储',
  'vector<int> a(n);',
  '// 元素 a[i] 的地址 = base + i * sizeof(int)',
  '// 下标从 0 开始，连续存储。',
  '// 访问 a[i] 为 O(1) 随机访问。',
];

const pseudoLines = [
  '// 一维数组顺序存储',
  '数组 a[0..n-1]',
  '// 元素 a[i] 的地址 = base + i * size',
  '// 下标从 0 开始，连续存储。',
  '// 访问 a[i] 为 O(1) 随机访问。',
];

function makeState(items: number[], highlighted: number[], info: Record<string, string | number>): ArrayState {
  return { items: [...items], highlighted, markers: [], info };
}

function createInitialState(): ArrayState {
  return makeState([], [], { 提示: '请输入一维数组' });
}

function* oneDimSteps(input: number[]): Generator<AlgorithmStep<ArrayState>> {
  yield {
    id: 'init',
    description: '初始状态：空数组',
    state: makeState([], [], { 提示: '请输入一维数组' }),
    highlightedElements: [],
    highlightedLines: [],
    variables: {},
  };

  const arr = input;
  for (let i = 0; i < arr.length; i++) {
    yield {
      id: `store-${i}`,
      description: `a[${i}] = ${arr[i]}（地址 = base + ${i} × size）`,
      state: makeState(arr.slice(0, i + 1), [i], { 长度: i + 1 }),
      highlightedElements: [`cell-${i}`],
      highlightedLines: [],
      variables: { i, 'a[i]': arr[i] },
    };
  }

  yield {
    id: 'done',
    description: `一维数组存储完成（长度 ${arr.length}），随机访问 O(1)`,
    state: makeState(arr, [], { 长度: arr.length }),
    highlightedElements: [],
    highlightedLines: [],
    variables: { 长度: arr.length },
  };
}

export const oneDimModule: AlgorithmModule<ArrayState, number[]> = {
  meta: {
    id: 'array.one-dim',
    name: '一维数组',
    nameEn: '1-D Array',
    chapter: 'array',
    order: 1,
    summary: '连续顺序存储，下标随机访问 O(1)。',
    coreIdea: '一维数组用一段连续内存顺序存储元素，元素 a[i] 的地址 = base + i × sizeof(元素)，通过下标可 O(1) 随机访问。',
    operationSteps: ['分配连续内存。', '按下标依次存储元素。', '通过 a[i] 随机访问。'],
    useCases: ['顺序存储的基础', '各种数据结构的底层'],
    complexity: {
      time: { best: 'O(1) 访问', average: 'O(1) 访问', worst: 'O(1) 访问' },
      space: 'O(n)',
    },
    pros: ['随机访问 O(1)', '结构简单'],
    cons: ['插入删除需移动元素', '定长需预分配'],
    examPoints: [
      '一维数组地址 = base + i × size。',
      '数组下标从 0 开始。',
      '随机访问 O(1)。',
    ],
    variableDocs: [{ name: 'i', meaning: '数组下标' }],
    code: { c: cLines.join('\n'), cpp: cppLines.join('\n'), pseudocode: pseudoLines.join('\n') },
    inputSchema: [{ key: 'array', label: '一维数组', type: 'array', placeholder: '如：1, 2, 3, 4, 5' }],
    defaultInput: '1, 2, 3, 4, 5',
    implemented: true,
    visualizer: 'array',
  },
  generateSteps: oneDimSteps,
  parseInput: parseArray,
  createInitialState,
};
