/**
 * 散列查找（Hash Search，线性探测开放定址法）
 *
 * 散列函数 hash(key) = key % size，冲突时线性探测 (hash+1) % size。
 * 展示插入时的冲突探测与查找过程。
 * 操作脚本：build 表大小 ; insert 关键字... ; search 关键字。
 * 代码行号与 C / C++ / 伪代码严格对齐（三者均为 16 行）。
 */
import type { AlgorithmModule, AlgorithmStep, ParseResult } from '@/engine/types';
import type { HashState, HashSlotStatus } from './types';

const cLines = [
  '#define EMPTY -1',
  'int table[MAXSIZE];',
  'int hash(int key, int size) { return key % size; }',
  'void insert(int table[], int size, int key) {',
  '    int h = hash(key, size);',
  '    while (table[h] != EMPTY) {',
  '        h = (h + 1) % size;   // 线性探测',
  '    }',
  '    table[h] = key;',
  '}',
  'int search(int table[], int size, int key) {',
  '    int h = hash(key, size);',
  '    while (table[h] != EMPTY) {',
  '        if (table[h] == key) return h;',
  '        h = (h + 1) % size;',
  '    }',
  '    return -1;',
  '}',
];

const cppLines = [
  '#define EMPTY -1',
  'vector<int> table;',
  'int hash(int key, int size) { return key % size; }',
  'void insert(vector<int>& table, int key) {',
  '    int h = hash(key, table.size());',
  '    while (table[h] != EMPTY) {',
  '        h = (h + 1) % table.size(); // 线性探测',
  '    }',
  '    table[h] = key;',
  '}',
  'int search(vector<int>& table, int key) {',
  '    int h = hash(key, table.size());',
  '    while (table[h] != EMPTY) {',
  '        if (table[h] == key) return h;',
  '        h = (h + 1) % table.size();',
  '    }',
  '    return -1;',
  '}',
];

const pseudoLines = [
  '常量 EMPTY ← -1',
  '散列表 table[0..MAXSIZE-1]',
  '函数 hash(key, size): return key % size',
  '函数 insert(table, size, key):',
  '    h ← hash(key, size)',
  '    while table[h] ≠ EMPTY do',
  '        h ← (h+1) % size  // 线性探测',
  '    end while',
  '    table[h] ← key',
  '结束函数',
  '函数 search(table, size, key):',
  '    h ← hash(key, size)',
  '    while table[h] ≠ EMPTY do',
  '        if table[h] = key then return h',
  '        h ← (h+1) % size',
  '    end while',
  '    return -1',
  '结束函数',
];

const LINES = { hash: [3, 5], probe: [6, 7], place: [9], search: [12, 13, 14, 15] } as const;

type Command = { op: 'build'; size: number } | { op: 'insert'; keys: number[] } | { op: 'search'; key: number };

function parseInput(raw: string): ParseResult<Command[]> {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, error: '请输入命令（如 build 11 ; insert 5,16,27 ; search 27）' };
  const parts = trimmed.split(/[;；\n]+/).map((s) => s.trim()).filter(Boolean);
  const commands: Command[] = [];
  for (const part of parts) {
    const tokens = part.split(/[\s,，]+/).map((s) => s.trim()).filter(Boolean);
    if (tokens.length === 0) continue;
    const cmd = tokens[0].toLowerCase();
    if (cmd === 'build') {
      const size = Number(tokens[1]);
      if (!Number.isFinite(size) || size < 1) return { ok: false, error: '"build" 需要一个表大小（正整数）' };
      commands.push({ op: 'build', size });
    } else if (cmd === 'insert' || cmd === 'add') {
      const keys = tokens.slice(1).map(Number);
      if (keys.some((k) => !Number.isFinite(k))) return { ok: false, error: `"${part}" 含非法数字` };
      if (keys.length === 0) return { ok: false, error: '"insert" 需要关键字' };
      commands.push({ op: 'insert', keys });
    } else if (cmd === 'search' || cmd === 'find') {
      const key = Number(tokens[1]);
      if (!Number.isFinite(key)) return { ok: false, error: '"search" 需要一个关键字' };
      commands.push({ op: 'search', key });
    } else {
      return { ok: false, error: `未知命令 "${cmd}"（支持 build / insert / search）` };
    }
  }
  if (commands.length === 0) return { ok: false, error: '命令为空' };
  return { ok: true, value: commands };
}

function makeState(slots: (number | null)[], highlighted: number[], status: Record<number, HashSlotStatus>, info: Record<string, string | number>): HashState {
  return { size: slots.length, slots: [...slots], highlighted, status, info };
}

function createInitialState(): HashState {
  return makeState(Array(11).fill(null), [], {}, { 提示: '请先 build 表大小' });
}

function* hashSearchSteps(input: Command[]): Generator<AlgorithmStep<HashState>> {
  let size = 11;
  let slots: (number | null)[] = Array(size).fill(null);
  let status: Record<number, HashSlotStatus> = {};

  yield {
    id: 'init',
    description: '初始状态：空散列表',
    state: makeState(slots, [], {}, { 提示: '请先 build 表大小' }),
    highlightedElements: [],
    highlightedLines: [],
    variables: {},
  };

  for (const cmd of input) {
    if (cmd.op === 'build') {
      size = cmd.size;
      slots = Array(size).fill(null);
      status = {};
      yield {
        id: 'built',
        description: `已创建大小为 ${size} 的散列表（hash(key) = key % ${size}）`,
        state: makeState(slots, [], {}, { 表大小: size }),
        highlightedElements: [],
        highlightedLines: [...LINES.hash],
        variables: { 表大小: size },
      };
    } else if (cmd.op === 'insert') {
      for (const key of cmd.keys) {
        let h = ((key % size) + size) % size;
        yield {
          id: `ins-hash-${key}`,
          description: `插入 ${key}：hash = ${key} % ${size} = ${h}`,
          state: makeState(slots, [h], status, { key, hash: h }),
          highlightedElements: [`slot-${h}`],
          highlightedLines: [...LINES.hash],
          variables: { key, hash: h },
        };
        while (slots[h] !== null) {
          yield {
            id: `ins-probe-${key}-${h}`,
            description: `槽位 ${h} 已被 ${slots[h]} 占用，线性探测到 ${(h + 1) % size}`,
            state: makeState(slots, [h], { [h]: 'comparing' }, { key, 冲突: `槽 ${h}` }),
            highlightedElements: [`slot-${h}`],
            highlightedLines: [...LINES.probe],
            variables: { 冲突槽位: h, 已占用: slots[h] },
          };
          h = (h + 1) % size;
        }
        slots[h] = key;
        status = { ...status, [h]: 'done' };
        yield {
          id: `ins-place-${key}`,
          description: `${key} 放入槽位 ${h}`,
          state: makeState(slots, [h], status, { key, 位置: h }),
          highlightedElements: [`slot-${h}`],
          highlightedLines: [...LINES.place],
          variables: { key, 位置: h },
        };
      }
    } else {
      const key = cmd.key;
      let h = ((key % size) + size) % size;
      let found = -1;
      yield {
        id: `search-hash-${key}`,
        description: `查找 ${key}：hash = ${key} % ${size} = ${h}`,
        state: makeState(slots, [h], status, { key, hash: h }),
        highlightedElements: [`slot-${h}`],
        highlightedLines: [...LINES.search],
        variables: { key, hash: h },
      };
      const visited = new Set<number>();
      while (slots[h] !== null && !visited.has(h)) {
        visited.add(h);
        yield {
          id: `search-cmp-${key}-${h}`,
          description: `比较槽位 ${h} 的 ${slots[h]} 与 ${key}`,
          state: makeState(slots, [h], status, { key, 比较: `槽 ${h}` }),
          highlightedElements: [`slot-${h}`],
          highlightedLines: [...LINES.search],
          variables: { 'table[h]': slots[h], key },
        };
        if (slots[h] === key) {
          found = h;
          yield {
            id: `found-${h}`,
            description: `槽位 ${h} 命中 ${key}`,
            state: makeState(slots, [h], status, { 结果: `槽 ${h}` }),
            highlightedElements: [`slot-${h}`],
            highlightedLines: [...LINES.search],
            variables: { 结果: `槽 ${h}` },
          };
          break;
        }
        h = (h + 1) % size;
      }
      if (found < 0) {
        yield {
          id: 'notfound',
          description: `探测到空槽，未找到 ${key}`,
          state: makeState(slots, [], status, { 结果: '未找到' }),
          highlightedElements: [],
          highlightedLines: [...LINES.search],
          variables: { 结果: '未找到' },
        };
      }
    }
  }

  yield {
    id: 'done',
    description: '操作执行完毕',
    state: makeState(slots, [], status, { 表大小: size }),
    highlightedElements: [],
    highlightedLines: [],
    variables: {},
  };
}

export const hashSearchModule: AlgorithmModule<HashState, Command[]> = {
  meta: {
    id: 'search.hash',
    name: '散列查找',
    nameEn: 'Hash Search',
    chapter: 'search',
    order: 6,
    summary: '散列函数直接定址，冲突用线性探测，平均 O(1)。',
    coreIdea:
      '散列查找通过散列函数 hash(key) 把关键字映射到表中位置，理想情况 O(1) 直接定位。冲突时用开放定址法（如线性探测 (h+1)%size）或链地址法解决。装填因子 α 越大冲突越多。',
    operationSteps: [
      '构造散列函数 hash(key) = key % size。',
      '插入：计算散列地址，冲突则线性探测到空槽。',
      '查找：从散列地址开始探测，命中返回，遇空槽失败。',
      '冲突处理：线性探测 / 链地址法。',
    ],
    useCases: ['符号表', '数据库索引', '缓存 / 字典'],
    complexity: {
      time: { best: 'O(1)', average: 'O(1)', worst: 'O(n) 全冲突' },
      space: 'O(n)',
    },
    pros: ['平均 O(1) 极快', '查找/插入/删除都高效', '无需有序'],
    cons: ['最坏退化 O(n)', '需设计好的散列函数', '空间利用率受装填因子限制'],
    examPoints: [
      '散列查找平均时间复杂度 O(1)。',
      '冲突处理方法：开放定址法（线性探测、二次探测）、链地址法。',
      '装填因子 α = 元素数 / 表长，越大冲突越多。',
      '线性探测会产生「堆积」现象。',
    ],
    variableDocs: [
      { name: 'hash', meaning: '散列函数，key % size' },
      { name: 'h', meaning: '当前探测的槽位' },
      { name: 'α', meaning: '装填因子 = 元素数/表长' },
    ],
    code: { c: cLines.join('\n'), cpp: cppLines.join('\n'), pseudocode: pseudoLines.join('\n') },
    inputSchema: [
      { key: 'ops', label: '命令', type: 'string', placeholder: 'build 11 ; insert 5,16,27 ; search 27' },
    ],
    defaultInput: 'build 11 ; insert 5, 16, 27, 38, 49 ; search 38',
    implemented: true,
    visualizer: 'hash',
  },
  generateSteps: hashSearchSteps,
  parseInput,
  createInitialState,
};
