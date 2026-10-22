/**
 * 顺序表（Sequential List）
 *
 * 数组存储的线性表，支持末尾追加、指定位置插入/删除、查找。
 * 操作脚本：append v / insert i v / delete i / search v。
 */
import type { AlgorithmModule, AlgorithmStep, ParseResult } from '@/engine/types';
import type { ArrayState } from './types';
import { parseCommandScript } from './commands';

const cLines = [
  '// 在位置 i 插入元素 value（后移元素）',
  'void insert(int a[], int* n, int i, int value) {',
  '    for (int j = *n; j > i; j--)',
  '        a[j] = a[j - 1];',
  '    a[i] = value;',
  '    (*n)++;',
  '}',
  '',
  '// 删除位置 i 的元素（前移元素）',
  'void removeAt(int a[], int* n, int i) {',
  '    for (int j = i; j < *n - 1; j++)',
  '        a[j] = a[j + 1];',
  '    (*n)--;',
  '}',
  '',
  '// 查找值为 value 的元素，返回下标',
  'int search(int a[], int n, int value) {',
  '    for (int i = 0; i < n; i++)',
  '        if (a[i] == value) return i;',
  '    return -1;',
  '}',
];

const cppLines = [
  '// 在位置 i 插入元素 value（后移元素）',
  'void insert(vector<int>& a, int i, int value) {',
  '    a.insert(a.begin() + i, value);',
  '}',
  '',
  '// 删除位置 i 的元素',
  'void removeAt(vector<int>& a, int i) {',
  '    a.erase(a.begin() + i);',
  '}',
  '',
  '// 查找值为 value 的元素，返回下标',
  'int search(vector<int>& a, int value) {',
  '    for (int i = 0; i < (int)a.size(); i++)',
  '        if (a[i] == value) return i;',
  '    return -1;',
  '}',
];

const pseudoLines = [
  '// 在位置 i 插入 value',
  '函数 insert(a, n, i, value):',
  '    for j ← n down to i+1 do',
  '        a[j] ← a[j-1]',
  '    a[i] ← value',
  '    n ← n+1',
  '结束函数',
  '',
  '// 删除位置 i 的元素',
  '函数 removeAt(a, n, i):',
  '    for j ← i to n-2 do',
  '        a[j] ← a[j+1]',
  '    n ← n-1',
  '结束函数',
  '',
  '// 查找值为 value 的元素',
  '函数 search(a, n, value):',
  '    for i ← 0 to n-1 do',
  '        if a[i] = value then return i',
  '    return -1',
  '结束函数',
];

const LINES = {
  insertShift: [3, 4],
  insertPlace: 5,
  deleteShift: [11, 12],
  searchScan: 18,
} as const;

type SeqOp = 'append' | 'insert' | 'delete' | 'search';
interface SeqCommand {
  op: SeqOp;
  args: number[];
}

function parseInput(raw: string): ParseResult<SeqCommand[]> {
  const parsed = parseCommandScript(raw);
  if (!parsed.ok) return parsed;
  const commands: SeqCommand[] = [];
  for (const c of parsed.value) {
    switch (c.cmd) {
      case 'append':
        if (c.args.length !== 1) return { ok: false, error: '"append" 需要一个参数（如 append 10）' };
        commands.push({ op: 'append', args: c.args });
        break;
      case 'insert':
        if (c.args.length !== 2) return { ok: false, error: '"insert" 需要两个参数（如 insert 1 99）' };
        commands.push({ op: 'insert', args: c.args });
        break;
      case 'delete':
      case 'remove':
        if (c.args.length !== 1) return { ok: false, error: '"delete" 需要一个参数（位置下标）' };
        commands.push({ op: 'delete', args: c.args });
        break;
      case 'search':
        if (c.args.length !== 1) return { ok: false, error: '"search" 需要一个参数' };
        commands.push({ op: 'search', args: c.args });
        break;
      default:
        return { ok: false, error: `未知命令 "${c.cmd}"（支持 append / insert / delete / search）` };
    }
  }
  return { ok: true, value: commands };
}

function makeState(
  items: number[],
  highlighted: number[],
  info: Record<string, string | number>,
): ArrayState {
  return { items: [...items], highlighted, markers: [], info };
}

function createInitialState(): ArrayState {
  return makeState([], [], { 长度: 0 });
}

function* sequentialListSteps(input: SeqCommand[]): Generator<AlgorithmStep<ArrayState>> {
  const a: number[] = [];

  yield {
    id: 'init',
    description: '初始状态：空顺序表',
    state: makeState(a, [], { 长度: 0 }),
    highlightedElements: [],
    highlightedLines: [],
    variables: { 长度: 0 },
  };

  for (const cmd of input) {
    if (cmd.op === 'append') {
      const value = cmd.args[0];
      a.push(value);
      yield {
        id: `append-${a.length - 1}`,
        description: `在末尾追加元素 ${value}，位于下标 ${a.length - 1}`,
        state: makeState(a, [a.length - 1], { 长度: a.length }),
        highlightedElements: [`cell-${a.length - 1}`],
        highlightedLines: [],
        variables: { value, 长度: a.length },
      };
    } else if (cmd.op === 'insert') {
      const [i, value] = cmd.args;
      if (i < 0 || i > a.length) {
        yield {
          id: `insert-invalid-${i}`,
          description: `插入位置 ${i} 越界（合法范围 0..${a.length}），操作跳过`,
          state: makeState(a, [], { 长度: a.length }),
          highlightedElements: [],
          highlightedLines: [],
          variables: { 位置: i, 结果: '越界' },
        };
        continue;
      }
      for (let j = a.length; j > i; j--) {
        a[j] = a[j - 1];
        yield {
          id: `insert-shift-${j}`,
          description: `元素后移：a[${j - 1}] → a[${j}]`,
          state: makeState(a, [j, j - 1], { 长度: a.length + 1 }),
          highlightedElements: [`cell-${j}`],
          highlightedLines: [...LINES.insertShift],
          variables: { j },
        };
      }
      a[i] = value;
      yield {
        id: `insert-place-${i}`,
        description: `在位置 ${i} 写入元素 ${value}`,
        state: makeState(a, [i], { 长度: a.length }),
        highlightedElements: [`cell-${i}`],
        highlightedLines: [LINES.insertPlace],
        variables: { 位置: i, value, 长度: a.length },
      };
    } else if (cmd.op === 'delete') {
      const i = cmd.args[0];
      if (i < 0 || i >= a.length) {
        yield {
          id: `delete-invalid-${i}`,
          description: `删除位置 ${i} 越界，操作跳过`,
          state: makeState(a, [], { 长度: a.length }),
          highlightedElements: [],
          highlightedLines: [],
          variables: { 位置: i, 结果: '越界' },
        };
        continue;
      }
      const removed = a[i];
      for (let j = i; j < a.length - 1; j++) {
        a[j] = a[j + 1];
        yield {
          id: `delete-shift-${j}`,
          description: `元素前移：a[${j + 1}] → a[${j}]`,
          state: makeState(a, [j, j + 1], { 长度: a.length - 1 }),
          highlightedElements: [`cell-${j}`],
          highlightedLines: [...LINES.deleteShift],
          variables: { j },
        };
      }
      a.pop();
      yield {
        id: `delete-done-${i}`,
        description: `已删除位置 ${i} 的元素 ${removed}`,
        state: makeState(a, [], { 长度: a.length }),
        highlightedElements: [],
        highlightedLines: [],
        variables: { 已删除: removed, 长度: a.length },
      };
    } else if (cmd.op === 'search') {
      const value = cmd.args[0];
      let found = -1;
      for (let i = 0; i < a.length; i++) {
        yield {
          id: `search-${i}`,
          description: `比较 a[${i}]=${a[i]} 与目标 ${value}`,
          state: makeState(a, [i], { 长度: a.length }),
          highlightedElements: [`cell-${i}`],
          highlightedLines: [LINES.searchScan],
          variables: { i, 'a[i]': a[i], 目标: value },
        };
        if (a[i] === value) {
          found = i;
          break;
        }
      }
      yield {
        id: `search-result-${value}`,
        description: found >= 0 ? `找到 ${value}，下标为 ${found}` : `未找到 ${value}`,
        state: makeState(a, found >= 0 ? [found] : [], { 长度: a.length }),
        highlightedElements: [],
        highlightedLines: [],
        variables: { 结果: found >= 0 ? `下标 ${found}` : '未找到' },
      };
    }
  }

  yield {
    id: 'done',
    description: '操作执行完毕',
    state: makeState(a, [], { 长度: a.length }),
    highlightedElements: [],
    highlightedLines: [],
    variables: { 长度: a.length },
  };
}

export const sequentialListModule: AlgorithmModule<ArrayState, SeqCommand[]> = {
  meta: {
    id: 'linear-list.sequential',
    name: '顺序表',
    nameEn: 'Sequential List',
    chapter: 'linear-list',
    order: 1,
    summary: '用数组实现的线性表，支持随机访问，插入删除需移动元素。',
    coreIdea:
      '顺序表用一段连续内存（数组）存储元素，可 O(1) 随机访问；但在中间插入或删除时需要移动后续元素，平均 O(n)。',
    operationSteps: [
      '追加：在末尾直接写入，O(1)。',
      '插入：从末尾到位置 i 依次后移元素，再在 i 处写入，平均 O(n)。',
      '删除：从 i+1 到末尾依次前移元素，覆盖 i 处元素。',
      '查找：从头到尾依次比较。',
    ],
    useCases: ['需要频繁随机访问', '元素数量基本稳定', '插入删除集中在末尾'],
    complexity: {
      time: { best: 'O(1) 访问/末尾', average: 'O(n) 插入删除', worst: 'O(n)' },
      space: 'O(n)',
    },
    pros: ['支持 O(1) 随机访问', '存储密度高、无需额外指针', '缓存友好'],
    cons: ['插入删除需移动元素 O(n)', '扩容需整体搬迁', '空间需预先分配'],
    examPoints: [
      '顺序表随机访问第 i 个元素为 O(1)。',
      '在位置 i 插入需移动 n-i 个元素，平均移动 n/2 个。',
      '顺序表与链表的核心区别：随机访问 vs 插入删除效率。',
    ],
    variableDocs: [
      { name: 'a', meaning: '存储元素的数组' },
      { name: 'n', meaning: '当前元素个数（表长）' },
      { name: 'i', meaning: '操作位置下标' },
      { name: 'j', meaning: '移动元素时的游标' },
    ],
    code: { c: cLines.join('\n'), cpp: cppLines.join('\n'), pseudocode: pseudoLines.join('\n') },
    inputSchema: [
      { key: 'ops', label: '操作序列', type: 'string', placeholder: 'append 10, insert 1 99, delete 0, search 99' },
    ],
    defaultInput: 'append 10, append 20, append 30, insert 1 99, delete 0, search 99',
    implemented: true,
    visualizer: 'array',
  },
  generateSteps: sequentialListSteps,
  parseInput,
  createInitialState,
};
