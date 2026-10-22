/**
 * KMP 字符串匹配（Knuth-Morris-Pratt）
 *
 * 先计算 next 数组（最长相等前后缀），匹配时失配利用 next 跳转，
 * 主串指针不回退，线性时间 O(n+m)。复用 StringView 展示 next 数组与匹配对齐。
 * 操作脚本：text ... ; pattern ...。
 * 代码行号与 C / C++ / 伪代码严格对齐（三者均为 24 行）。
 */
import type { AlgorithmModule, AlgorithmStep } from '@/engine/types';
import type { StringState } from './types';
import { parseTextPattern, type TextPattern } from './shared';

const cLines = [
  '// 计算 next 数组（next[0] = -1）',
  'void getNext(char* p, int next[]) {',
  '    int m = strlen(p), i = 0, j = -1;',
  '    next[0] = -1;',
  '    while (i < m - 1) {',
  '        if (j == -1 || p[i] == p[j]) {',
  '            i++; j++; next[i] = j;',
  '        } else {',
  '            j = next[j];',
  '        }',
  '    }',
  '}',
  'int kmp(char* s, char* p) {',
  '    int next[MAXLEN]; getNext(p, next);',
  '    int i = 0, j = 0, n = strlen(s), m = strlen(p);',
  '    while (i < n && j < m) {',
  '        if (j == -1 || s[i] == p[j]) { i++; j++; }',
  '        else j = next[j];   // 主串不回退',
  '    }',
  '    return j == m ? i - m : -1;',
  '}',
];

const cppLines = [
  '// 计算 next 数组（next[0] = -1）',
  'void getNext(string& p, vector<int>& next) {',
  '    int m = p.size(), i = 0, j = -1;',
  '    next[0] = -1;',
  '    while (i < m - 1) {',
  '        if (j == -1 || p[i] == p[j]) {',
  '            i++; j++; next[i] = j;',
  '        } else {',
  '            j = next[j];',
  '        }',
  '    }',
  '}',
  'int kmp(string& s, string& p) {',
  '    vector<int> next(p.size()); getNext(p, next);',
  '    int i = 0, j = 0;',
  '    while (i < (int)s.size() && j < (int)p.size()) {',
  '        if (j == -1 || s[i] == p[j]) { i++; j++; }',
  '        else j = next[j];   // 主串不回退',
  '    }',
  '    return j == (int)p.size() ? i - j : -1;',
  '}',
];

const pseudoLines = [
  '// 计算 next 数组（next[0] = -1）',
  '函数 getNext(p, next):',
  '    i ← 0, j ← -1, next[0] ← -1',
  '    while i < m-1 do',
  '        if j = -1 或 p[i] = p[j] then',
  '            i ← i+1, j ← j+1, next[i] ← j',
  '        else',
  '            j ← next[j]',
  '        end if',
  '    end while',
  '结束函数',
  '函数 kmp(s, p):',
  '    getNext(p, next)',
  '    i ← 0, j ← 0',
  '    while i < n 且 j < m do',
  '        if j = -1 或 s[i] = p[j] then i ← i+1, j ← j+1',
  '        else j ← next[j]  // 主串不回退',
  '        end if',
  '    end while',
  '    if j = m then return i-m else return -1',
  '结束函数',
];

const LINES = { next: [6, 7, 8, 9], match: [17, 18, 19] } as const;

function makeState(text: string, pattern: string, offset: number, textHighlight: number[], patternHighlight: number[], matchedPositions: number[], nextArray?: number[], nextHighlight?: number[], info?: Record<string, string | number>): StringState {
  return { text, pattern, offset, textHighlight, patternHighlight, matchedPositions, nextArray, nextHighlight, info };
}

function createInitialState(): StringState {
  return makeState('', '', 0, [], [], [], [], [], { 提示: '请先 text / pattern' });
}

function* kmpSteps(input: TextPattern): Generator<AlgorithmStep<StringState>> {
  const { text, pattern } = input;
  const n = text.length;
  const m = pattern.length;
  const matched: number[] = [];

  // 计算 next 数组
  const next: number[] = new Array(m).fill(0);
  next[0] = -1;

  yield {
    id: 'next-init',
    description: `计算模式串 "${pattern}" 的 next 数组（next[0] = -1）`,
    state: makeState(text, pattern, 0, [], [], [], [...next], [0]),
    highlightedElements: [],
    highlightedLines: [LINES.next[0]],
    variables: { 'next[0]': -1 },
  };

  let i = 0;
  let j = -1;
  while (i < m - 1) {
    if (j === -1 || pattern[i] === pattern[j]) {
      i++;
      j++;
      next[i] = j;
      yield {
        id: `next-${i}`,
        description: j === -1 || pattern[i - 1] === pattern[j - 1]
          ? `next[${i}] = ${j}`
          : `回退 j = next[${j}] 后再匹配：next[${i}] = ${j}`,
        state: makeState(text, pattern, 0, [], [], [], [...next], [i]),
        highlightedElements: [],
        highlightedLines: [...LINES.next],
        variables: { i, j, [`next[${i}]`]: next[i] },
      };
    } else {
      const prevJ = j;
      j = next[j];
      yield {
        id: `next-fallback-${i}`,
        description: `p[${i}] ≠ p[${prevJ}]，回退 j = next[${prevJ}] = ${j}`,
        state: makeState(text, pattern, 0, [], [], [], [...next], [i, prevJ]),
        highlightedElements: [],
        highlightedLines: [...LINES.next],
        variables: { 回退: `j ${prevJ} → ${j}` },
      };
    }
  }

  yield {
    id: 'next-done',
    description: `next 数组：${next.join(', ')}`,
    state: makeState(text, pattern, 0, [], [], [], [...next], []),
    highlightedElements: [],
    highlightedLines: [],
    variables: { next: next.join(' ') },
  };

  // 匹配
  let si = 0;
  let sj = 0;
  while (si < n && sj < m) {
    if (sj === -1 || text[si] === pattern[sj]) {
      const eq = text[si] === pattern[sj];
      yield {
        id: `cmp-${si}-${sj}`,
        description: eq ? `比较 s[${si}]='${text[si]}' 与 p[${sj}]='${pattern[sj]}'：相等` : `j = -1，主串前进`,
        state: makeState(text, pattern, si - sj, [si], [Math.max(sj, 0)], matched, [...next], []),
        highlightedElements: [`cell-${si}`],
        highlightedLines: [...LINES.match],
        variables: { i: si, j: sj },
      };
      si++;
      sj++;
    } else {
      yield {
        id: `fallback-${si}-${sj}`,
        description: `s[${si}]='${text[si]}' ≠ p[${sj}]='${pattern[sj]}'，失配：j = next[${sj}] = ${next[sj]}（主串 i 不回退）`,
        state: makeState(text, pattern, si - sj, [si], [sj], matched, [...next], [sj]),
        highlightedElements: [`cell-${si}`],
        highlightedLines: [...LINES.match],
        variables: { 失配: `j ${sj} → ${next[sj]}` },
      };
      sj = next[sj];
    }
  }

  if (sj === m) {
    const start = si - m;
    matched.push(start);
    yield {
      id: 'match',
      description: `匹配成功！起始位置 ${start}`,
      state: makeState(text, pattern, start, [], [], matched, [...next], []),
      highlightedElements: [],
      highlightedLines: [],
      variables: { 结果: `位置 ${start}` },
    };
  } else {
    yield {
      id: 'notfound',
      description: '匹配结束，未找到模式串',
      state: makeState(text, pattern, 0, [], [], matched, [...next], []),
      highlightedElements: [],
      highlightedLines: [],
      variables: { 结果: '未找到' },
    };
  }
}

export const kmpModule: AlgorithmModule<StringState, TextPattern> = {
  meta: {
    id: 'string.kmp',
    name: 'KMP 算法',
    nameEn: 'KMP Algorithm',
    chapter: 'string',
    order: 3,
    summary: 'next 数组利用前后缀，失配主串不回退，O(n+m)。',
    coreIdea:
      'KMP 算法先求模式串的 next 数组（next[j] = 前缀与后缀的最长相等长度，next[0]=-1）。匹配时若失配，主串指针 i 不回退，模式串指针 j 跳到 next[j]，从而避免重复比较，达到线性时间 O(n+m)。',
    operationSteps: [
      '计算模式串的 next 数组（最长相等前后缀）。',
      '主串 i 与模式串 j 从 0 开始比较。',
      '相等则 i、j 同时后移。',
      '失配则 j = next[j]，i 不动。',
      'j 到达模式串末尾则匹配成功。',
    ],
    useCases: ['文本编辑器查找', 'DNA 序列比对', '大规模文本搜索'],
    complexity: {
      time: { best: 'O(n+m)', average: 'O(n+m)', worst: 'O(n+m)' },
      space: 'O(m) next 数组',
    },
    pros: ['线性时间 O(n+m)', '主串不回退', '适合流式匹配'],
    cons: ['需预处理 next 数组', '实现较朴素复杂'],
    examPoints: [
      'KMP 时间复杂度 O(n+m)。',
      'next[j] 表示最长相等前后缀长度。',
      '失配时主串 i 不回退，j = next[j]。',
      'next[0] 通常取 -1 或 0（约定不同）。',
    ],
    variableDocs: [
      { name: 'next', meaning: 'next[j] = 最长相等前后缀长度' },
      { name: 'i', meaning: '主串指针（不回退）' },
      { name: 'j', meaning: '模式串指针（失配回退）' },
    ],
    code: { c: cLines.join('\n'), cpp: cppLines.join('\n'), pseudocode: pseudoLines.join('\n') },
    inputSchema: [
      { key: 'ops', label: '命令', type: 'string', placeholder: 'text ABABDABACD ; pattern ABACD' },
    ],
    defaultInput: 'text ABABDABACDABABCABAB ; pattern ABABCABAB',
    implemented: true,
    visualizer: 'string',
  },
  generateSteps: kmpSteps,
  parseInput: parseTextPattern,
  createInitialState,
};
