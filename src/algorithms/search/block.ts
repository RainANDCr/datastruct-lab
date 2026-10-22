/**
 * 分块查找（Block Search / Index Sequential Search）
 *
 * 数据分块，块间有序、块内可无序。先查索引表（每块最大值）定位所在块，
 * 再在块内顺序查找。复用 ArrayView，markers 标记块边界。
 * 操作脚本：build 数组 ; search 目标（块大小自动取 √n）。
 * 代码行号与 C / C++ / 伪代码严格对齐（三者均为 14 行）。
 */
import type { AlgorithmModule, AlgorithmStep, ParseResult } from '@/engine/types';
import type { ArrayState, ArrayMarker } from '../linear-list/types';

const cLines = [
  '// 分块查找：先索引表定位，再块内顺序查找',
  'typedef struct { int max; int start; } Block;',
  'int blockSearch(int a[], int n, int m, int target) {',
  '    int blocks = (n + m - 1) / m;',
  '    int i = 0;',
  '    while (i < blocks && target > a[(i + 1) * m - 1] < n)',
  '        i++;',
  '    int start = i * m, end = min(start + m, n);',
  '    for (int j = start; j < end; j++)',
  '        if (a[j] == target) return j;',
  '    return -1;',
  '}',
  '// 索引表存每块最大值，',
  '// 块内查找可顺序或折半。',
];

const cppLines = [
  '// 分块查找：先索引表定位，再块内顺序查找',
  'struct Block { int max; int start; };',
  'int blockSearch(vector<int>& a, int m, int target) {',
  '    int blocks = (a.size() + m - 1) / m;',
  '    int i = 0;',
  '    while (i < blocks - 1 && target > a[(i + 1) * m - 1])',
  '        i++;',
  '    int start = i * m, end = min(start + m, (int)a.size());',
  '    for (int j = start; j < end; j++)',
  '        if (a[j] == target) return j;',
  '    return -1;',
  '}',
  '// 索引表存每块最大值，',
  '// 块内查找可顺序或折半。',
];

const pseudoLines = [
  '// 分块查找：先索引表定位，再块内顺序查找',
  '块结构 Block { max, start }',
  '函数 blockSearch(a, n, m, target):',
  '    blocks ← (n+m-1)/m',
  '    i ← 0',
  '    while i < blocks-1 且 target > a[(i+1)*m-1] do',
  '        i ← i+1',
  '    end while',
  '    start ← i*m, end ← min(start+m, n)',
  '    for j ← start to end-1 do',
  '        if a[j] = target then return j',
  '    end for',
  '    return -1',
  '结束函数',
];

const LINES = { index: [6, 7], block: [9, 10, 11], notFound: [12] } as const;

type Command = { op: 'build'; values: number[] } | { op: 'search'; target: number };

function parseInput(raw: string): ParseResult<Command[]> {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, error: '请输入命令（如 build 8,6,9,14,10,22 ; search 10）' };
  const parts = trimmed.split(/[;；\n]+/).map((s) => s.trim()).filter(Boolean);
  const commands: Command[] = [];
  for (const part of parts) {
    const tokens = part.split(/[\s,，]+/).map((s) => s.trim()).filter(Boolean);
    if (tokens.length === 0) continue;
    const cmd = tokens[0].toLowerCase();
    if (cmd === 'build') {
      const values = tokens.slice(1).map(Number);
      if (values.some((v) => !Number.isFinite(v))) return { ok: false, error: `"${part}" 含非法数字` };
      if (values.length < 1) return { ok: false, error: '"build" 至少需要 1 个数字' };
      commands.push({ op: 'build', values });
    } else if (cmd === 'search' || cmd === 'find') {
      if (tokens.length !== 2) return { ok: false, error: '"search" 需要一个目标值' };
      const target = Number(tokens[1]);
      if (!Number.isFinite(target)) return { ok: false, error: `"${part}" 目标值非法` };
      commands.push({ op: 'search', target });
    } else {
      return { ok: false, error: `未知命令 "${cmd}"（支持 build / search）` };
    }
  }
  if (commands.length === 0) return { ok: false, error: '命令为空' };
  return { ok: true, value: commands };
}

function makeState(items: number[], highlighted: number[], markers: ArrayMarker[], info: Record<string, string | number>): ArrayState {
  return { items: [...items], highlighted, markers, info };
}

function createInitialState(): ArrayState {
  return makeState([], [], [], { 提示: '请先 build 分块数组' });
}

function* blockSearchSteps(input: Command[]): Generator<AlgorithmStep<ArrayState>> {
  let arr: number[] = [];

  yield {
    id: 'init',
    description: '初始状态：尚未构建数组',
    state: makeState(arr, [], [], { 提示: '请先 build 分块数组' }),
    highlightedElements: [],
    highlightedLines: [],
    variables: {},
  };

  for (const cmd of input) {
    if (cmd.op === 'build') {
      arr = cmd.values;
      yield {
        id: 'built',
        description: `已构建数组（${arr.length} 个元素）`,
        state: makeState(arr, [], [], { 长度: arr.length }),
        highlightedElements: [],
        highlightedLines: [],
        variables: { 数组: arr.join(', ') },
      };
    } else {
      const target = cmd.target;
      const n = arr.length;
      const m = Math.max(1, Math.ceil(Math.sqrt(n)));
      const blocks = Math.ceil(n / m);

      // 索引表（每块最大值）
      const indexTable: number[] = [];
      for (let b = 0; b < blocks; b++) {
        const start = b * m;
        const end = Math.min(start + m, n);
        indexTable.push(Math.max(...arr.slice(start, end)));
      }

      const blockMarkers: ArrayMarker[] = [];
      for (let b = 0; b < blocks; b++) blockMarkers.push({ label: `块${b + 1}`, index: b * m });

      yield {
        id: 'index-init',
        description: `分 ${blocks} 块（每块约 ${m} 个），索引表（每块最大值）：${indexTable.join(', ')}`,
        state: makeState(arr, [], blockMarkers, { 索引表: indexTable.join(', '), 块大小: m }),
        highlightedElements: [],
        highlightedLines: [],
        variables: { 索引表: indexTable.join(', '), 块大小: m },
      };

      // 在索引表中定位
      let bi = 0;
      while (bi < blocks - 1 && target > indexTable[bi]) {
        yield {
          id: `index-${bi}`,
          description: `比较 target = ${target} 与第 ${bi + 1} 块最大值 ${indexTable[bi]}：大于，继续下一块`,
          state: makeState(arr, [], blockMarkers, { 索引表: indexTable.join(', '), 当前块: bi + 1 }),
          highlightedElements: [],
          highlightedLines: [...LINES.index],
          variables: { 比较: `target vs ${indexTable[bi]}` },
        };
        bi++;
      }
      yield {
        id: `locate-${bi}`,
        description: `target = ${target} 应落在第 ${bi + 1} 块（范围 [${bi * m}, ${Math.min(bi * m + m, n) - 1}]）`,
        state: makeState(arr, [], blockMarkers, { 索引表: indexTable.join(', '), 定位块: bi + 1 }),
        highlightedElements: [],
        highlightedLines: [...LINES.index],
        variables: { 定位块: bi + 1 },
      };

      // 块内顺序查找
      const start = bi * m;
      const end = Math.min(start + m, n);
      let found = -1;
      for (let j = start; j < end; j++) {
        yield {
          id: `cmp-${j}`,
          description: `块内比较 a[${j}] = ${arr[j]} 与 ${target}`,
          state: makeState(arr, [j], blockMarkers, { 定位块: bi + 1, 比较: `a[${j}]` }),
          highlightedElements: [`cell-${j}`],
          highlightedLines: [...LINES.block],
          variables: { j, 'a[j]': arr[j], target },
        };
        if (arr[j] === target) {
          found = j;
          yield {
            id: `found-${j}`,
            description: `a[${j}] == ${target}，找到！下标 ${j}`,
            state: makeState(arr, [j], blockMarkers, { 结果: `下标 ${j}` }),
            highlightedElements: [`cell-${j}`],
            highlightedLines: [...LINES.block],
            variables: { 结果: `下标 ${j}` },
          };
          break;
        }
      }
      if (found < 0) {
        yield {
          id: 'notfound',
          description: `第 ${bi + 1} 块内未找到 ${target}`,
          state: makeState(arr, [], blockMarkers, { 结果: '未找到' }),
          highlightedElements: [],
          highlightedLines: [...LINES.notFound],
          variables: { 结果: '未找到' },
        };
      }
    }
  }

  yield {
    id: 'done',
    description: '操作执行完毕',
    state: makeState(arr, [], [], { 长度: arr.length }),
    highlightedElements: [],
    highlightedLines: [],
    variables: {},
  };
}

export const blockSearchModule: AlgorithmModule<ArrayState, Command[]> = {
  meta: {
    id: 'search.block',
    name: '分块查找',
    nameEn: 'Block Search',
    chapter: 'search',
    order: 3,
    summary: '块间有序、块内无序，先查索引表再块内顺序查找。',
    coreIdea:
      '分块查找（索引顺序查找）把数据分成若干块，块间有序（前一块最大值 < 后一块最小值）、块内可无序。先顺序/折半查索引表定位目标所在块，再在块内顺序查找。',
    operationSteps: [
      '将数据分块，建立索引表（每块最大值）。',
      '在索引表中定位目标所在块。',
      '在目标块内顺序查找。',
      '块内未找到则整体查找失败。',
    ],
    useCases: ['线性表 + 索引表的折中', '数据量大但内存受限', '动态变化的数据'],
    complexity: {
      time: { best: 'O(√n)', average: 'O(√n)', worst: 'O(√n)（块大小 √n 时）' },
      space: 'O(√n) 索引表',
    },
    pros: ['比顺序查找快', '插入删除较方便', '块大小可调'],
    cons: ['需额外索引表', '块内仍需顺序查找', '块间有序要求维护'],
    examPoints: [
      '分块查找 = 索引顺序查找。',
      '块大小取 √n 时平均查找长度最小。',
      '块间有序、块内可无序。',
      'ASL = 索引查找 + 块内查找。',
    ],
    variableDocs: [
      { name: 'm', meaning: '块大小（通常取 √n）' },
      { name: 'indexTable', meaning: '索引表（每块最大值）' },
      { name: 'start / end', meaning: '目标块的范围' },
    ],
    code: { c: cLines.join('\n'), cpp: cppLines.join('\n'), pseudocode: pseudoLines.join('\n') },
    inputSchema: [
      { key: 'ops', label: '命令', type: 'string', placeholder: 'build 8,6,9,14,10,22 ; search 10' },
    ],
    defaultInput: 'build 8, 6, 9, 14, 10, 22, 18, 30, 40, 45, 35, 50 ; search 18',
    implemented: true,
    visualizer: 'array',
  },
  generateSteps: blockSearchSteps,
  parseInput,
  createInitialState,
};
