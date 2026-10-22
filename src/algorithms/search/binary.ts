/**
 * 折半查找（Binary Search）
 *
 * 在有序数组中反复取中间元素比较，每次将查找区间缩小一半。
 * 展示 low / mid / high 三个指针与查找区间的变化。
 * 操作脚本：build 1,3,5,7,9,11 ; search 7。
 * 代码行号与 C / C++ / 伪代码严格对齐（三者均为 11 行）。
 */
import type { AlgorithmModule, AlgorithmStep, ParseResult } from '@/engine/types';
import type { ArrayState, ArrayMarker } from '../linear-list/types';

const cLines = [
  '// 折半查找（数组必须有序）',
  'int binarySearch(int a[], int n, int target) {',
  '    int low = 0, high = n - 1;',
  '    while (low <= high) {',
  '        int mid = low + (high - low) / 2;',
  '        if (a[mid] == target) return mid;',
  '        else if (a[mid] < target) low = mid + 1;',
  '        else high = mid - 1;',
  '    }',
  '    return -1;',
  '}',
];

const cppLines = [
  '// 折半查找（数组必须有序）',
  'int binarySearch(vector<int>& a, int target) {',
  '    int low = 0, high = a.size() - 1;',
  '    while (low <= high) {',
  '        int mid = low + (high - low) / 2;',
  '        if (a[mid] == target) return mid;',
  '        else if (a[mid] < target) low = mid + 1;',
  '        else high = mid - 1;',
  '    }',
  '    return -1;',
  '}',
];

const pseudoLines = [
  '// 折半查找（数组必须有序）',
  '函数 binarySearch(a, target):',
  '    low ← 0, high ← n-1',
  '    while low ≤ high do',
  '        mid ← low + (high-low)/2',
  '        if a[mid] = target then return mid',
  '        else if a[mid] < target then low ← mid+1',
  '        else high ← mid-1',
  '    end while',
  '    return -1',
  '结束函数',
];

const LINES = {
  init: 3,
  mid: 5,
  equal: 6,
  lowUp: 7,
  highUp: 8,
  notFound: 10,
} as const;

type Command = { op: 'build'; values: number[] } | { op: 'search'; target: number };

function parseInput(raw: string): ParseResult<Command[]> {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, error: '请输入命令（如 build 1,3,5,7,9,11 ; search 7）' };
  const parts = trimmed.split(/[;；\n]+/).map((s) => s.trim()).filter(Boolean);
  const commands: Command[] = [];
  for (const part of parts) {
    const tokens = part.split(/[\s,，]+/).map((s) => s.trim()).filter(Boolean);
    if (tokens.length === 0) continue;
    const cmd = tokens[0].toLowerCase();
    if (cmd === 'build') {
      const values = tokens.slice(1).map(Number);
      if (values.some((v) => !Number.isFinite(v))) return { ok: false, error: `"${part}" 含非法数字` };
      if (values.length < 2) return { ok: false, error: '"build" 至少需要 2 个数字' };
      commands.push({ op: 'build', values });
    } else if (cmd === 'search' || cmd === 'find') {
      if (tokens.length !== 2) return { ok: false, error: '"search" 需要一个目标值（如 search 7）' };
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

function makeState(
  items: number[],
  highlighted: number[],
  markers: ArrayMarker[],
  info: Record<string, string | number>,
): ArrayState {
  return { items: [...items], highlighted, markers, info };
}

function createInitialState(): ArrayState {
  return makeState([], [], [], { 提示: '请先 build 有序数组' });
}

function* binarySearchSteps(input: Command[]): Generator<AlgorithmStep<ArrayState>> {
  let arr: number[] = [];

  yield {
    id: 'init',
    description: '初始状态：尚未构建数组',
    state: makeState(arr, [], [], { 提示: '请先 build 有序数组' }),
    highlightedElements: [],
    highlightedLines: [],
    variables: {},
  };

  for (const cmd of input) {
    if (cmd.op === 'build') {
      arr = cmd.values;
      const sorted = arr.every((v, i) => i === 0 || arr[i - 1] <= v);
      yield {
        id: 'built',
        description: sorted
          ? `已构建有序数组（${arr.length} 个元素）`
          : `已构建数组（${arr.length} 个元素）——注意：折半查找要求数组有序！`,
        state: makeState(arr, [], [], { 长度: arr.length, 有序: sorted ? '是' : '否' }),
        highlightedElements: [],
        highlightedLines: [],
        variables: { 数组: arr.join(', ') },
      };
    } else {
      const target = cmd.target;
      if (arr.length === 0) {
        yield {
          id: 'search-empty',
          description: '数组为空，无法查找',
          state: makeState(arr, [], [], { 结果: '数组为空' }),
          highlightedElements: [],
          highlightedLines: [],
          variables: {},
        };
        continue;
      }

      let low = 0;
      let high = arr.length - 1;
      let found = -1;
      let comparisons = 0;

      yield {
        id: 'search-init',
        description: `查找 ${target}：初始化 low = ${low}，high = ${high}`,
        state: makeState(arr, [], [{ label: 'low', index: low }, { label: 'high', index: high }], { low, high, target, 比较次数: 0 }),
        highlightedElements: [],
        highlightedLines: [LINES.init],
        variables: { low, high, target },
      };

      while (low <= high) {
        const mid = Math.floor(low + (high - low) / 2);
        comparisons += 1;
        yield {
          id: `mid-${mid}`,
          description: `取中间 mid = (${low} + ${high}) / 2 = ${mid}，比较 a[${mid}] = ${arr[mid]} 与 ${target}`,
          state: makeState(arr, [mid], [{ label: 'low', index: low }, { label: 'mid', index: mid }, { label: 'high', index: high }], { low, mid, high, target, 比较次数: comparisons }),
          highlightedElements: [`cell-${mid}`],
          highlightedLines: [LINES.mid],
          variables: { low, mid, high, 'a[mid]': arr[mid], target },
        };

        if (arr[mid] === target) {
          found = mid;
          yield {
            id: `found-${mid}`,
            description: `a[${mid}] == ${target}，找到！下标为 ${mid}`,
            state: makeState(arr, [mid], [{ label: 'low', index: low }, { label: 'mid', index: mid }, { label: 'high', index: high }], { low, mid, high, target, 比较次数: comparisons, 结果: `下标 ${mid}` }),
            highlightedElements: [`cell-${mid}`],
            highlightedLines: [LINES.equal],
            variables: { 结果: `下标 ${mid}`, 比较次数: comparisons },
          };
          break;
        } else if (arr[mid] < target) {
          low = mid + 1;
          yield {
            id: `low-up-${mid}`,
            description: `a[${mid}] < ${target}：目标在右半区，low = mid + 1 = ${low}`,
            state: makeState(arr, [], [{ label: 'low', index: low }, { label: 'high', index: high }], { low, high, target, 比较次数: comparisons }),
            highlightedElements: [],
            highlightedLines: [LINES.lowUp],
            variables: { low, high, 'a[mid]': arr[mid], target },
          };
        } else {
          high = mid - 1;
          yield {
            id: `high-up-${mid}`,
            description: `a[${mid}] > ${target}：目标在左半区，high = mid - 1 = ${high}`,
            state: makeState(arr, [], [{ label: 'low', index: low }, { label: 'high', index: high }], { low, high, target, 比较次数: comparisons }),
            highlightedElements: [],
            highlightedLines: [LINES.highUp],
            variables: { low, high, 'a[mid]': arr[mid], target },
          };
        }
      }

      if (found < 0) {
        yield {
          id: 'notfound',
          description: `low(${low}) > high(${high})，查找区间为空，未找到 ${target}`,
          state: makeState(arr, [], [], { 结果: '未找到', 比较次数: comparisons }),
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
    state: makeState(arr, [], [], { 长度: arr.length }),
    highlightedElements: [],
    highlightedLines: [],
    variables: {},
  };
}

export const binarySearchModule: AlgorithmModule<ArrayState, Command[]> = {
  meta: {
    id: 'search.binary',
    name: '折半查找',
    nameEn: 'Binary Search',
    chapter: 'search',
    order: 2,
    summary: '有序数组每次折半区间查找，O(log n)，展示 low/mid/high。',
    coreIdea:
      '折半查找（二分查找）要求数据有序。每次取区间中点 mid 与目标比较：相等则命中；目标更大则去右半区（low=mid+1），更小则去左半区（high=mid-1），区间每轮减半。',
    operationSteps: [
      '初始化 low=0、high=n-1。',
      '取 mid=(low+high)/2，比较 a[mid] 与目标。',
      '相等命中返回；小于目标则 low=mid+1；大于目标则 high=mid-1。',
      '当 low>high 时区间为空，查找失败。',
    ],
    useCases: ['有序表的快速查找', '数据库索引/二分查找', '求平方根等二分答案场景'],
    complexity: {
      time: { best: 'O(1) 首轮命中', average: 'O(log n)', worst: 'O(log n)' },
      space: 'O(1)',
    },
    pros: ['查找效率高 O(log n)', '实现简单', '空间 O(1)'],
    cons: ['要求数据有序', '只适用于顺序存储（随机访问）', '插入删除维护有序代价高'],
    examPoints: [
      '折半查找时间复杂度 O(log n)。',
      '仅适用于有序的顺序表（需随机访问）。',
      'mid = low + (high-low)/2 可避免 (low+high) 溢出。',
    ],
    variableDocs: [
      { name: 'low', meaning: '查找区间下界' },
      { name: 'high', meaning: '查找区间上界' },
      { name: 'mid', meaning: '区间中点，当前比较位置' },
      { name: 'target', meaning: '待查找目标值' },
    ],
    code: { c: cLines.join('\n'), cpp: cppLines.join('\n'), pseudocode: pseudoLines.join('\n') },
    inputSchema: [
      { key: 'ops', label: '命令', type: 'string', placeholder: 'build 1,3,5,7,9,11 ; search 7' },
    ],
    defaultInput: 'build 1,3,5,7,9,11,13,15 ; search 7',
    implemented: true,
    visualizer: 'array',
  },
  generateSteps: binarySearchSteps,
  parseInput,
  createInitialState,
};
