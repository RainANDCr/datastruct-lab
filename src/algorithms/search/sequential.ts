/**
 * 顺序查找（Sequential Search）
 *
 * 从前往后逐个比较，找到返回下标，找不到返回 -1。
 * 复用 ArrayView，展示当前比较位置与查找过程。
 * 操作脚本：build 数组 ; search 目标。
 * 代码行号与 C / C++ / 伪代码严格对齐（三者均为 11 行）。
 */
import type { AlgorithmModule, AlgorithmStep, ParseResult } from '@/engine/types';
import type { ArrayState, ArrayMarker } from '../linear-list/types';

const cLines = [
  '// 顺序查找（可加哨兵优化）',
  'int seqSearch(int a[], int n, int target) {',
  '    for (int i = 0; i < n; i++) {',
  '        if (a[i] == target)',
  '            return i;',
  '    }',
  '    return -1;',
  '}',
  '// 带哨兵：a[0] 放哨兵，从末尾向前找，',
  '// 省去每次的越界判断 i>=0。',
];

const cppLines = [
  '// 顺序查找（可加哨兵优化）',
  'int seqSearch(vector<int>& a, int target) {',
  '    for (int i = 0; i < (int)a.size(); i++) {',
  '        if (a[i] == target)',
  '            return i;',
  '    }',
  '    return -1;',
  '}',
  '// 带哨兵：a[0] 放哨兵，从末尾向前找，',
  '// 省去每次的越界判断 i>=0。',
];

const pseudoLines = [
  '// 顺序查找（可加哨兵优化）',
  '函数 seqSearch(a, n, target):',
  '    for i ← 0 to n-1 do',
  '        if a[i] = target then return i',
  '    end for',
  '    return -1',
  '结束函数',
  '// 带哨兵：a[0] 放哨兵，从末尾向前找，',
  '// 省去每次的越界判断 i>=0。',
];

const LINES = { loop: 3, equal: 4, notFound: 6 } as const;

type Command = { op: 'build'; values: number[] } | { op: 'search'; target: number };

function parseInput(raw: string): ParseResult<Command[]> {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, error: '请输入命令（如 build 3,1,5,7,2 ; search 5）' };
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

function makeState(items: number[], highlighted: number[], info: Record<string, string | number>): ArrayState {
  return { items: [...items], highlighted, markers: [] as ArrayMarker[], info };
}

function createInitialState(): ArrayState {
  return makeState([], [], { 提示: '请先 build 数组' });
}

function* sequentialSearchSteps(input: Command[]): Generator<AlgorithmStep<ArrayState>> {
  let arr: number[] = [];

  yield {
    id: 'init',
    description: '初始状态：尚未构建数组',
    state: makeState(arr, [], { 提示: '请先 build 数组' }),
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
        state: makeState(arr, [], { 长度: arr.length }),
        highlightedElements: [],
        highlightedLines: [],
        variables: { 数组: arr.join(', ') },
      };
    } else {
      const target = cmd.target;
      let found = -1;
      let comparisons = 0;

      for (let i = 0; i < arr.length; i++) {
        comparisons += 1;
        yield {
          id: `cmp-${i}`,
          description: `比较 a[${i}] = ${arr[i]} 与 ${target}`,
          state: makeState(arr, [i], { target, 比较次数: comparisons }),
          highlightedElements: [`cell-${i}`],
          highlightedLines: [LINES.loop, LINES.equal],
          variables: { i, 'a[i]': arr[i], target, 比较次数: comparisons },
        };
        if (arr[i] === target) {
          found = i;
          yield {
            id: `found-${i}`,
            description: `a[${i}] == ${target}，找到！下标 ${i}`,
            state: makeState(arr, [i], { target, 比较次数: comparisons, 结果: `下标 ${i}` }),
            highlightedElements: [`cell-${i}`],
            highlightedLines: [LINES.equal],
            variables: { 结果: `下标 ${i}` },
          };
          break;
        }
      }

      if (found < 0) {
        yield {
          id: 'notfound',
          description: `遍历完毕未找到 ${target}`,
          state: makeState(arr, [], { target, 比较次数: comparisons, 结果: '未找到' }),
          highlightedElements: [],
          highlightedLines: [LINES.notFound],
          variables: { 结果: '未找到', 比较次数: comparisons },
        };
      }
    }
  }

  yield {
    id: 'done',
    description: '操作执行完毕',
    state: makeState(arr, [], { 长度: arr.length }),
    highlightedElements: [],
    highlightedLines: [],
    variables: {},
  };
}

export const sequentialSearchModule: AlgorithmModule<ArrayState, Command[]> = {
  meta: {
    id: 'search.sequential',
    name: '顺序查找',
    nameEn: 'Sequential Search',
    chapter: 'search',
    order: 1,
    summary: '从头到尾逐个比较，最简单，O(n)。',
    coreIdea:
      '顺序查找从第一个元素开始，逐个与目标比较，相等则返回下标，遍历完仍未找到则返回 -1。可用「哨兵」优化：在数组头部放目标值，从后向前查找，省去每轮的越界判断。',
    operationSteps: [
      '从下标 0 开始逐个比较 a[i] 与 target。',
      '相等则命中，返回下标 i。',
      '遍历完未命中则返回 -1。',
    ],
    useCases: ['无序表', '数据量小', '链表等无法随机访问的结构'],
    complexity: {
      time: { best: 'O(1) 首元素命中', average: 'O(n)', worst: 'O(n)' },
      space: 'O(1)',
    },
    pros: ['实现最简单', '对数据是否有序无要求', '适合链表'],
    cons: ['效率低 O(n)', '数据量大时不适用'],
    examPoints: [
      '顺序查找平均查找长度 ASL = (n+1)/2。',
      '顺序查找适用于顺序表和链表。',
      '哨兵可减少比较时的越界判断。',
    ],
    variableDocs: [
      { name: 'i', meaning: '当前比较下标' },
      { name: 'target', meaning: '待查找目标' },
    ],
    code: { c: cLines.join('\n'), cpp: cppLines.join('\n'), pseudocode: pseudoLines.join('\n') },
    inputSchema: [
      { key: 'ops', label: '命令', type: 'string', placeholder: 'build 3,1,5,7,2 ; search 5' },
    ],
    defaultInput: 'build 3, 1, 5, 7, 2, 9, 4 ; search 7',
    implemented: true,
    visualizer: 'array',
  },
  generateSteps: sequentialSearchSteps,
  parseInput,
  createInitialState,
};
