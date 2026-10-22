/**
 * 特殊矩阵压缩存储：对称矩阵 / 三角矩阵 / 三对角矩阵。
 * 复用 MatrixView，展示矩阵 → 一维压缩存储的映射。
 * 输入为完整矩阵（分号分隔行）。
 */
import type { AlgorithmModule, AlgorithmStep } from '@/engine/types';
import type { MatrixState } from './types';
import { parseMatrix } from './shared';

function makeState(matrix: (number | null)[][], highlighted: [number, number][], storage?: (number | null)[], storageHighlight?: number[], storageLabels?: string[], info?: Record<string, string | number>): MatrixState {
  return { rows: matrix.length, cols: matrix[0]?.length ?? 0, matrix: matrix.map((r) => [...r]), highlighted, storage, storageHighlight, storageLabels, info };
}

function createInitialState(): MatrixState {
  return makeState([], [], undefined, undefined, undefined, { 提示: '请输入矩阵' });
}

type CompressFn = (i: number, j: number) => number | null;

function* compressSteps(input: number[][], compress: CompressFn, storageSize: number, kind: string): Generator<AlgorithmStep<MatrixState>> {
  const m = input.length;
  const n = input[0]?.length ?? 0;

  // 展示矩阵：不参与存储的位置标 null
  const display = input.map((row, i) => row.map((cell, j) => (compress(i, j) === null ? null : cell)));

  yield {
    id: 'matrix',
    description: `${kind}（${m}×${n}，'·' 为不存储的位置）`,
    state: makeState(display, [], undefined, undefined, undefined, { 类型: kind, 行: m, 列: n }),
    highlightedElements: [],
    highlightedLines: [],
    variables: { 类型: kind },
  };

  const storage: (number | null)[] = new Array(storageSize).fill(null);
  const labels: string[] = new Array(storageSize).fill('');
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      const k = compress(i, j);
      if (k === null) continue;
      storage[k] = input[i][j];
      labels[k] = `a[${i}${j}]`;
      yield {
        id: `map-${i}-${j}`,
        description: `a[${i}][${j}] = ${input[i][j]} → 压缩存储位置 ${k}`,
        state: makeState(display, [[i, j]], storage, [k], labels, { 映射: `a[${i}][${j}] → [${k}]` }),
        highlightedElements: [`cell-${i}-${j}`],
        highlightedLines: [],
        variables: { 存储下标: k },
      };
    }
  }

  yield {
    id: 'done',
    description: `${kind}压缩完成：${storageSize} 个存储单元（原 ${m * n} 个）`,
    state: makeState(display, [], storage, [], labels, { 存储单元: storageSize, 原元素: m * n }),
    highlightedElements: [],
    highlightedLines: [],
    variables: { 压缩后: storageSize, 压缩前: m * n },
  };
}

function makeModule(config: {
  id: string;
  name: string;
  nameEn: string;
  order: number;
  summary: string;
  coreIdea: string;
  compress: CompressFn;
  storageSize: (n: number) => number;
  kind: string;
  defaultInput: string;
  examPoints: string[];
  space: string;
  code: { c: string; cpp: string; pseudocode: string };
}): AlgorithmModule<MatrixState, number[][]> {
  return {
    meta: {
      id: config.id,
      name: config.name,
      nameEn: config.nameEn,
      chapter: 'array',
      order: config.order,
      summary: config.summary,
      coreIdea: config.coreIdea,
      operationSteps: ['输入完整矩阵。', '按压缩公式确定存储位置。', '将需存储元素映射到一维数组。', '通过下标公式随机访问。'],
      useCases: ['大规模稀疏存储', '数值计算', '有限元分析'],
      complexity: {
        time: { best: 'O(1) 寻址', average: 'O(1) 寻址', worst: 'O(1) 寻址' },
        space: config.space,
      },
      pros: ['节省存储空间', '寻址 O(1)'],
      cons: ['下标映射公式复杂', '只适用于特定结构'],
      examPoints: config.examPoints,
      variableDocs: [{ name: 'k', meaning: '压缩存储下标' }],
      code: config.code,
      inputSchema: [{ key: 'matrix', label: '矩阵', type: 'matrix', placeholder: '分号分隔行' }],
      defaultInput: config.defaultInput,
      implemented: true,
      visualizer: 'matrix',
    },
    generateSteps: (input: number[][]) => compressSteps(input, config.compress, config.storageSize(input.length), config.kind),
    parseInput: parseMatrix,
    createInitialState,
  };
}

/* ---------------- 对称矩阵（下三角压缩） ---------------- */
export const symmetricModule = makeModule({
  id: 'array.symmetric',
  name: '对称矩阵压缩',
  nameEn: 'Symmetric Matrix Compression',
  order: 3,
  summary: 'a[i][j] = a[j][i]，只存下三角（含对角线）。',
  coreIdea: '对称矩阵满足 a[i][j] = a[j][i]，只需存储下三角（含主对角线）约 n(n+1)/2 个元素。下标公式：k = i(i+1)/2 + j（i ≥ j）。',
  compress: (i, j) => (i >= j ? (i * (i + 1)) / 2 + j : null),
  storageSize: (n) => (n * (n + 1)) / 2,
  kind: '对称矩阵（下三角）',
  defaultInput: '1, 2, 3 ; 2, 4, 5 ; 3, 5, 6',
  examPoints: [
    '对称矩阵只存下三角约 n(n+1)/2 个元素。',
    '下标公式：k = i(i+1)/2 + j（i≥j）。',
    '上三角元素 a[i][j] 对应 a[j][i]（i<j）。',
  ],
  space: 'O(n(n+1)/2)',
  code: {
    c: '// 对称矩阵下三角压缩\n// k = i(i+1)/2 + j (i >= j)\n// a[i][j] = a[j][i] (i < j)',
    cpp: '// 对称矩阵下三角压缩\n// k = i(i+1)/2 + j (i >= j)\n// a[i][j] = a[j][i] (i < j)',
    pseudocode: '// 对称矩阵下三角压缩\n// k = i(i+1)/2 + j (i ≥ j)\n// a[i][j] = a[j][i] (i < j)',
  },
});

/* ---------------- 三角矩阵（上三角压缩） ---------------- */
export const triangularModule = makeModule({
  id: 'array.triangular',
  name: '三角矩阵压缩',
  nameEn: 'Triangular Matrix Compression',
  order: 4,
  summary: '上三角矩阵只存上三角（含对角线）。',
  coreIdea: '上三角矩阵主对角线以下全为 0（或常量），只需存储上三角（含对角线）约 n(n+1)/2 个元素。下标公式：k = j(j+1)/2 + i（i ≤ j）。',
  compress: (i, j) => (i <= j ? (j * (j + 1)) / 2 + i : null),
  storageSize: (n) => (n * (n + 1)) / 2,
  kind: '三角矩阵（上三角）',
  defaultInput: '1, 2, 3 ; 0, 4, 5 ; 0, 0, 6',
  examPoints: [
    '三角矩阵只存上三角（或下三角）约 n(n+1)/2 个元素。',
    '上三角下标公式：k = j(j+1)/2 + i（i≤j）。',
    '下三角下标公式：k = i(i+1)/2 + j（i≥j）。',
  ],
  space: 'O(n(n+1)/2)',
  code: {
    c: '// 上三角矩阵压缩\n// k = j(j+1)/2 + i (i <= j)\n// 下三角元素为 0（或常量）',
    cpp: '// 上三角矩阵压缩\n// k = j(j+1)/2 + i (i <= j)\n// 下三角元素为 0（或常量）',
    pseudocode: '// 上三角矩阵压缩\n// k = j(j+1)/2 + i (i ≤ j)\n// 下三角元素为 0（或常量）',
  },
});

/* ---------------- 三对角矩阵压缩 ---------------- */
export const tridiagonalModule = makeModule({
  id: 'array.tridiagonal',
  name: '三对角矩阵压缩',
  nameEn: 'Tridiagonal Matrix Compression',
  order: 5,
  summary: '只存主对角线及相邻两条对角线，3n-2 个元素。',
  coreIdea: '三对角矩阵只有主对角线及上下相邻两条对角线非零（|i-j| ≤ 1），只需存储 3n-2 个元素。下标公式：k = 2i + j（|i-j| ≤ 1）。',
  compress: (i, j) => (Math.abs(i - j) <= 1 ? 2 * i + j : null),
  storageSize: (n) => 3 * n - 2,
  kind: '三对角矩阵',
  defaultInput: '1, 2, 0, 0 ; 3, 4, 5, 0 ; 0, 6, 7, 8 ; 0, 0, 9, 10',
  examPoints: [
    '三对角矩阵只有三条对角线非零。',
    '存储元素数 3n-2。',
    '下标公式：k = 2i + j（|i-j|≤1）。',
  ],
  space: 'O(3n-2)',
  code: {
    c: '// 三对角矩阵压缩\n// k = 2i + j (|i-j| <= 1)\n// 共 3n-2 个存储单元',
    cpp: '// 三对角矩阵压缩\n// k = 2i + j (|i-j| <= 1)\n// 共 3n-2 个存储单元',
    pseudocode: '// 三对角矩阵压缩\n// k = 2i + j (|i-j| ≤ 1)\n// 共 3n-2 个存储单元',
  },
});
