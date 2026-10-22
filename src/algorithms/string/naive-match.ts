/**
 * 朴素字符串匹配（Naive Pattern Matching，BF 算法）
 *
 * 主串每个位置尝试与模式串逐位比较，失配则主串回退一位、模式串归零。
 * 复用 StringView，展示主串与模式串的对齐比较。
 * 操作脚本：text ABAABAB ; pattern ABAB。
 * 代码行号与 C / C++ / 伪代码严格对齐（三者均为 11 行）。
 */
import type { AlgorithmModule, AlgorithmStep } from '@/engine/types';
import type { StringState } from './types';
import { parseTextPattern, type TextPattern } from './shared';

const cLines = [
  '// 朴素匹配（BF）：暴力逐位比较',
  'int naiveMatch(char* s, char* p) {',
  '    int n = strlen(s), m = strlen(p);',
  '    for (int i = 0; i <= n - m; i++) {',
  '        int j = 0;',
  '        while (j < m && s[i + j] == p[j]) j++;',
  '        if (j == m) return i;   // 匹配成功',
  '    }',
  '    return -1;',
  '}',
  '// 最坏 O(n·m)，如 S="AAAAAB", P="AAAB"。',
];

const cppLines = [
  '// 朴素匹配（BF）：暴力逐位比较',
  'int naiveMatch(string& s, string& p) {',
  '    int n = s.size(), m = p.size();',
  '    for (int i = 0; i <= n - m; i++) {',
  '        int j = 0;',
  '        while (j < m && s[i + j] == p[j]) j++;',
  '        if (j == m) return i;   // 匹配成功',
  '    }',
  '    return -1;',
  '}',
  '// 最坏 O(n·m)，如 S="AAAAAB", P="AAAB"。',
];

const pseudoLines = [
  '// 朴素匹配（BF）：暴力逐位比较',
  '函数 naiveMatch(s, p):',
  '    n ← length(s), m ← length(p)',
  '    for i ← 0 to n-m do',
  '        j ← 0',
  '        while j < m 且 s[i+j] = p[j] do j ← j+1',
  '        if j = m then return i  // 匹配成功',
  '    end for',
  '    return -1',
  '结束函数',
  '// 最坏 O(n·m)，如 S="AAAAAB", P="AAAB"。',
];

const LINES = { outer: [3, 4], compare: [6], match: [7] } as const;

function makeState(text: string, pattern: string, offset: number, textHighlight: number[], patternHighlight: number[], matchedPositions: number[], info: Record<string, string | number>): StringState {
  return { text, pattern, offset, textHighlight, patternHighlight, matchedPositions, info };
}

function createInitialState(): StringState {
  return makeState('', '', 0, [], [], [], { 提示: '请先 text / pattern' });
}

function* naiveMatchSteps(input: TextPattern): Generator<AlgorithmStep<StringState>> {
  const { text, pattern } = input;
  const n = text.length;
  const m = pattern.length;
  const matched: number[] = [];
  let comparisons = 0;

  yield {
    id: 'init',
    description: `主串 "${text}"（长度 ${n}），模式串 "${pattern}"（长度 ${m}）`,
    state: makeState(text, pattern, 0, [], [], [], { 主串长: n, 模式串长: m }),
    highlightedElements: [],
    highlightedLines: [],
    variables: { n, m },
  };

  for (let i = 0; i <= n - m; i++) {
    yield {
      id: `align-${i}`,
      description: `模式串对齐到主串位置 ${i}`,
      state: makeState(text, pattern, i, [], [], matched, { 对齐: i }),
      highlightedElements: [],
      highlightedLines: [...LINES.outer],
      variables: { i },
    };
    let j = 0;
    while (j < m && text[i + j] === pattern[j]) {
      comparisons += 1;
      yield {
        id: `cmp-${i}-${j}`,
        description: `比较 s[${i + j}] = '${text[i + j]}' 与 p[${j}] = '${pattern[j]}'：相等`,
        state: makeState(text, pattern, i, [i + j], [j], matched, { 比较次数: comparisons }),
        highlightedElements: [`cell-${i + j}`],
        highlightedLines: [...LINES.compare],
        variables: { i, j, 's[i+j]': text[i + j], 'p[j]': pattern[j] },
      };
      j++;
    }
    if (j < m) {
      comparisons += 1;
      yield {
        id: `mismatch-${i}-${j}`,
        description: `s[${i + j}] = '${text[i + j]}' ≠ p[${j}] = '${pattern[j]}'，失配，主串回退`,
        state: makeState(text, pattern, i, [i + j], [j], matched, { 比较次数: comparisons }),
        highlightedElements: [`cell-${i + j}`],
        highlightedLines: [...LINES.compare],
        variables: { 失配位置: i + j },
      };
    } else {
      matched.push(i);
      yield {
        id: `match-${i}`,
        description: `匹配成功！起始位置 ${i}`,
        state: makeState(text, pattern, i, [], [], matched, { 结果: `位置 ${i}`, 比较次数: comparisons }),
        highlightedElements: [],
        highlightedLines: [...LINES.match],
        variables: { 结果: `位置 ${i}` },
      };
    }
  }

  yield {
    id: 'done',
    description: matched.length > 0 ? `匹配结束，共找到 ${matched.length} 处：${matched.join(', ')}` : '匹配结束，未找到模式串',
    state: makeState(text, pattern, 0, [], [], matched, { 匹配数: matched.length, 比较次数: comparisons }),
    highlightedElements: [],
    highlightedLines: [],
    variables: { 结果: matched.join(', ') || '未找到', 比较次数: comparisons },
  };
}

export const naiveMatchModule: AlgorithmModule<StringState, TextPattern> = {
  meta: {
    id: 'string.naive-match',
    name: '朴素字符串匹配',
    nameEn: 'Naive Pattern Matching',
    chapter: 'string',
    order: 2,
    summary: '逐位对齐比较，失配回退，暴力 O(n·m)。',
    coreIdea:
      '朴素匹配（BF）从主串每个位置 i 开始，与模式串逐位比较；若全部相等则匹配成功，若失配则主串回退到 i+1、模式串归零重新比较。实现简单但最坏 O(n·m)。',
    operationSteps: [
      '主串位置 i 从 0 到 n-m 依次尝试。',
      '从位置 i 起与模式串逐位比较。',
      '全部相等则匹配成功，记录位置。',
      '失配则 i 后移一位，重新比较。',
    ],
    useCases: ['短串/短模式匹配', '教学入门', '简单文本查找'],
    complexity: {
      time: { best: 'O(n)', average: 'O(n·m)', worst: 'O(n·m)' },
      space: 'O(1)',
    },
    pros: ['实现简单', '无需预处理'],
    cons: ['最坏 O(n·m) 效率低', '失配需回退'],
    examPoints: [
      '朴素匹配又称 BF（Brute Force）。',
      '最坏时间复杂度 O(n·m)。',
      '失配时主串 i 回退、模式串 j 归零。',
    ],
    variableDocs: [
      { name: 'i', meaning: '主串起始位置' },
      { name: 'j', meaning: '模式串比较位置' },
    ],
    code: { c: cLines.join('\n'), cpp: cppLines.join('\n'), pseudocode: pseudoLines.join('\n') },
    inputSchema: [
      { key: 'ops', label: '命令', type: 'string', placeholder: 'text ABAABAB ; pattern ABAB' },
    ],
    defaultInput: 'text ABAABAB ; pattern ABAB',
    implemented: true,
    visualizer: 'string',
  },
  generateSteps: naiveMatchSteps,
  parseInput: parseTextPattern,
  createInitialState,
};
