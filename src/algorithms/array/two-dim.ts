/**
 * 二维数组存储（2-D Array）
 *
 * 二维数组逻辑上是矩阵，物理上按行优先（或列优先）映射到一维连续存储。
 * 复用 MatrixView，展示矩阵 → 一维存储的行优先映射。
 * 输入：分号分隔行，如 1,2,3 ; 4,5,6。
 */
import type { AlgorithmModule, AlgorithmStep } from '@/engine/types';
import type { MatrixState } from './types';
import { parseMatrix } from './shared';

const cLines = [
  '// 二维数组按行优先存储',
  'int a[M][N];',
  '// 元素 a[i][j] 的地址 =',
  '//   base + (i * N + j) * sizeof(int)',
  '// 行优先：先存第 0 行，再存第 1 行……',
  '// 列优先则：base + (j * M + i) * size。',
];

const cppLines = [
  '// 二维数组按行优先存储',
  'vector<vector<int>> a(M, vector<int>(N));',
  '// 元素 a[i][j] 的地址 =',
  '//   base + (i * N + j) * sizeof(int)',
  '// 行优先：先存第 0 行，再存第 1 行……',
  '// 列优先则：base + (j * M + i) * size。',
];

const pseudoLines = [
  '// 二维数组按行优先存储',
  '数组 a[0..M-1][0..N-1]',
  '// 元素 a[i][j] 的地址 =',
  '//   base + (i × N + j) × size',
  '// 行优先：先存第 0 行，再存第 1 行……',
  '// 列优先则：base + (j × M + i) × size。',
];

function makeState(matrix: number[][], highlighted: [number, number][], storage?: number[], storageHighlight?: number[], storageLabels?: string[], info?: Record<string, string | number>): MatrixState {
  return { rows: matrix.length, cols: matrix[0]?.length ?? 0, matrix: matrix.map((r) => [...r]), highlighted, storage: storage ? [...storage] : undefined, storageHighlight, storageLabels, info };
}

function createInitialState(): MatrixState {
  return makeState([], [], undefined, undefined, undefined, { 提示: '请输入矩阵' });
}

function* twoDimSteps(input: number[][]): Generator<AlgorithmStep<MatrixState>> {
  const m = input.length;
  const n = input[0]?.length ?? 0;

  yield {
    id: 'init',
    description: `二维数组 ${m} × ${n}`,
    state: makeState(input, [], undefined, undefined, undefined, { 行: m, 列: n }),
    highlightedElements: [],
    highlightedLines: [],
    variables: { 行: m, 列: n },
  };

  // 行优先映射
  const storage: number[] = [];
  const labels: string[] = [];
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      const k = i * n + j;
      storage.push(input[i][j]);
      labels.push(`a[${i}][${j}]`);
      yield {
        id: `map-${i}-${j}`,
        description: `a[${i}][${j}] = ${input[i][j]} → 一维位置 ${k}（行优先：${i}×${n}+${j}）`,
        state: makeState(input, [[i, j]], storage, [k], labels, { 映射: `a[${i}][${j}] → [${k}]` }),
        highlightedElements: [`cell-${i}-${j}`],
        highlightedLines: [],
        variables: { i, j, 一维下标: k },
      };
    }
  }

  yield {
    id: 'done',
    description: `行优先存储完成：共 ${storage.length} 个元素`,
    state: makeState(input, [], storage, [], labels, { 元素数: storage.length }),
    highlightedElements: [],
    highlightedLines: [],
    variables: { 元素数: storage.length },
  };
}

export const twoDimModule: AlgorithmModule<MatrixState, number[][]> = {
  meta: {
    id: 'array.two-dim',
    name: '二维数组存储',
    nameEn: '2-D Array Storage',
    chapter: 'array',
    order: 2,
    summary: '矩阵按行优先映射到一维连续存储。',
    coreIdea: '二维数组在内存中是一维连续存储的。行优先存储时，元素 a[i][j] 的地址 = base + (i×N+j)×size；列优先则为 base + (j×M+i)×size。',
    operationSteps: ['确定行数 M 与列数 N。', '按行优先（或列优先）顺序展开。', 'a[i][j] 映射到一维下标 i×N+j。'],
    useCases: ['图像像素存储', '矩阵运算', '表格数据'],
    complexity: {
      time: { best: 'O(1) 寻址', average: 'O(1) 寻址', worst: 'O(1) 寻址' },
      space: 'O(M×N)',
    },
    pros: ['寻址 O(1)', '连续内存局部性好'],
    cons: ['需预知维度', 'M×N 大时内存大'],
    examPoints: [
      '行优先：a[i][j] → i×N+j。',
      '列优先：a[i][j] → j×M+i。',
      '二维数组物理上是一维连续存储。',
    ],
    variableDocs: [{ name: 'i / j', meaning: '行 / 列下标' }],
    code: { c: cLines.join('\n'), cpp: cppLines.join('\n'), pseudocode: pseudoLines.join('\n') },
    inputSchema: [{ key: 'matrix', label: '矩阵', type: 'matrix', placeholder: '1,2,3 ; 4,5,6' }],
    defaultInput: '1, 2, 3 ; 4, 5, 6',
    implemented: true,
    visualizer: 'matrix',
  },
  generateSteps: twoDimSteps,
  parseInput: parseMatrix,
  createInitialState,
};
