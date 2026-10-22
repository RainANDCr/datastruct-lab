/**
 * 稀疏矩阵三元组表示（Sparse Matrix, Triple）
 *
 * 稀疏矩阵非零元素很少，用三元组 (行, 列, 值) 存储非零元素，节省空间。
 * 复用 MatrixView，矩阵高亮非零元素，storage 展示三元组表。
 * 输入：矩阵（分号分隔行）。
 */
import type { AlgorithmModule, AlgorithmStep } from '@/engine/types';
import type { MatrixState } from './types';
import { parseMatrix } from './shared';

const cLines = [
  '// 稀疏矩阵三元组表示',
  'typedef struct {',
  '    int row, col, value;',
  '} Triple;',
  '// 每个非零元素用一个三元组存储：',
  '//   (行号, 列号, 值)',
  '// 若非零元素有 t 个（t << m×n），',
  '// 存储空间由 O(m×n) 降到 O(t)。',
];

const cppLines = [
  '// 稀疏矩阵三元组表示',
  'struct Triple {',
  '    int row, col, value;',
  '};',
  '// 每个非零元素用一个三元组存储：',
  '//   (行号, 列号, 值)',
  '// 若非零元素有 t 个（t << m×n），',
  '// 存储空间由 O(m×n) 降到 O(t)。',
];

const pseudoLines = [
  '// 稀疏矩阵三元组表示',
  '三元组 Triple { row, col, value }',
  '// 每个非零元素用一个三元组存储：',
  '//   (行号, 列号, 值)',
  '// 若非零元素有 t 个（t << m×n），',
  '// 存储空间由 O(m×n) 降到 O(t)。',
];

function makeState(matrix: number[][], highlighted: [number, number][], storage?: (number | null)[], storageHighlight?: number[], storageLabels?: string[], info?: Record<string, string | number>): MatrixState {
  return { rows: matrix.length, cols: matrix[0]?.length ?? 0, matrix: matrix.map((r) => [...r]), highlighted, storage, storageHighlight, storageLabels, info };
}

function createInitialState(): MatrixState {
  return makeState([], [], undefined, undefined, undefined, { 提示: '请输入稀疏矩阵' });
}

function* sparseSteps(input: number[][]): Generator<AlgorithmStep<MatrixState>> {
  const m = input.length;
  const n = input[0]?.length ?? 0;
  const total = m * n;
  const nonZero: { i: number; j: number; v: number }[] = [];
  for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) if (input[i][j] !== 0) nonZero.push({ i, j, v: input[i][j] });

  yield {
    id: 'matrix',
    description: `稀疏矩阵 ${m}×${n}，非零元素 ${nonZero.length} 个（占比 ${((nonZero.length / total) * 100).toFixed(1)}%）`,
    state: makeState(input, [], undefined, undefined, undefined, { 非零: nonZero.length, 总数: total }),
    highlightedElements: [],
    highlightedLines: [],
    variables: { 非零元素: nonZero.length },
  };

  const storage: (number | null)[] = [];
  const labels: string[] = [];
  for (const t of nonZero) {
    const base = storage.length;
    storage.push(t.i, t.j, t.v);
    labels.push('行', '列', '值');
    yield {
      id: `triple-${t.i}-${t.j}`,
      description: `非零元素 a[${t.i}][${t.j}] = ${t.v} → 三元组 (${t.i}, ${t.j}, ${t.v})`,
      state: makeState(input, [[t.i, t.j]], storage, [base, base + 1, base + 2], labels, { 三元组: `(${t.i},${t.j},${t.v})` }),
      highlightedElements: [`cell-${t.i}-${t.j}`],
      highlightedLines: [],
      variables: { 三元组: `(${t.i}, ${t.j}, ${t.v})` },
    };
  }

  yield {
    id: 'done',
    description: `三元组表示完成：${nonZero.length} 个三元组（存储 ${storage.length} 个单元，原 ${total} 个）`,
    state: makeState(input, [], storage, [], labels, { 三元组数: nonZero.length, 存储单元: storage.length }),
    highlightedElements: [],
    highlightedLines: [],
    variables: { 三元组数: nonZero.length },
  };
}

export const sparseMatrixModule: AlgorithmModule<MatrixState, number[][]> = {
  meta: {
    id: 'array.sparse',
    name: '稀疏矩阵三元组',
    nameEn: 'Sparse Matrix (Triple)',
    chapter: 'array',
    order: 6,
    summary: '用 (行, 列, 值) 三元组只存非零元素。',
    coreIdea: '稀疏矩阵中非零元素占比很小，若仍用二维数组存储会浪费大量空间。三元组表示法把每个非零元素记为 (行号, 列号, 值)，存储空间从 O(m×n) 降到 O(t)（t 为非零元素个数）。',
    operationSteps: ['遍历矩阵，找出非零元素。', '每个非零元素记录三元组 (行, 列, 值)。', '按行优先顺序存入三元组表。'],
    useCases: ['稀疏图邻接矩阵', '科学计算', '推荐系统矩阵'],
    complexity: {
      time: { best: 'O(m×n) 遍历', average: 'O(m×n)', worst: 'O(m×n)' },
      space: 'O(t)（t 为非零元素数）',
    },
    pros: ['大幅节省空间', '适合非零元素极少的情况'],
    cons: ['随机访问需查找', '矩阵运算实现复杂'],
    examPoints: [
      '三元组：(行号, 列号, 值)。',
      '非零元素 t 个时存储 O(t)。',
      '稀疏矩阵转置可用三元组快速完成。',
    ],
    variableDocs: [{ name: 'row/col/value', meaning: '三元组的行、列、值' }],
    code: { c: cLines.join('\n'), cpp: cppLines.join('\n'), pseudocode: pseudoLines.join('\n') },
    inputSchema: [{ key: 'matrix', label: '矩阵', type: 'matrix', placeholder: '0,0,5 ; 0,8,0 ; 3,0,0' }],
    defaultInput: '0, 0, 5, 0 ; 0, 8, 0, 0 ; 3, 0, 0, 0 ; 0, 0, 0, 6',
    implemented: true,
    visualizer: 'matrix',
  },
  generateSteps: sparseSteps,
  parseInput: parseMatrix,
  createInitialState,
};
