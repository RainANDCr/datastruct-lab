/**
 * 字符串基本操作（String Basic Operations）
 *
 * 展示字符串的字符数组存储与基本操作（求长、取字符）。
 * 复用 StringView，字符按索引高亮。
 * 操作脚本：text HelloWorld ; charAt 4。
 */
import type { AlgorithmModule, AlgorithmStep, ParseResult } from '@/engine/types';
import type { StringState } from './types';

const cLines = [
  '// 定长顺序存储的串',
  'typedef struct {',
  '    char ch[MAXLEN];',
  '    int length;',
  '} SString;',
  'int strLength(SString S) { return S.length; }',
  '// 取第 i 个字符（0-based）',
  'char charAt(SString S, int i) {',
  '    if (i < 0 || i >= S.length) return 0;',
  '    return S.ch[i];',
  '}',
  '// 子串：返回 S 中 pos 起 len 长的子串',
];

const cppLines = [
  '// 顺序存储的串（string 类）',
  'string s = "HelloWorld";',
  'int len = s.length();   // 求长',
  'char c = s[4];          // 取字符',
  'string sub = s.substr(0, 5); // 子串',
  '// string 封装了长度、下标访问、',
  '// 拼接 +、比较 == 等操作，',
  '// 底层仍是字符数组顺序存储。',
];

const pseudoLines = [
  '// 定长顺序存储的串',
  '串结构 SString { ch[0..MAXLEN-1], length }',
  '函数 strLength(S): return S.length',
  '函数 charAt(S, i):',
  '    if i < 0 或 i ≥ S.length then return 空',
  '    return S.ch[i]',
  '结束函数',
  '// 子串：返回 S 中 pos 起 len 长的子串',
];

type Cmd = { op: 'text'; text: string } | { op: 'charAt'; index: number } | { op: 'length' };

function parseInput(raw: string): ParseResult<Cmd[]> {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, error: '请输入命令（如 text HelloWorld ; charAt 4）' };
  const parts = trimmed.split(/[;；\n]+/).map((s) => s.trim()).filter(Boolean);
  const commands: Cmd[] = [];
  for (const part of parts) {
    const m = part.match(/^(\S+)\s*(.*)$/);
    if (!m) continue;
    const cmd = m[1].toLowerCase();
    const rest = m[2].trim();
    if (cmd === 'text') {
      if (!rest) return { ok: false, error: '"text" 需要字符串内容' };
      commands.push({ op: 'text', text: rest });
    } else if (cmd === 'charat' || cmd === 'char') {
      const index = Number(rest);
      if (!Number.isFinite(index) || index < 0) return { ok: false, error: '"charAt" 需要一个非负下标' };
      commands.push({ op: 'charAt', index });
    } else if (cmd === 'length' || cmd === 'len') {
      commands.push({ op: 'length' });
    } else {
      return { ok: false, error: `未知命令 "${cmd}"（支持 text / charAt / length）` };
    }
  }
  if (commands.length === 0) return { ok: false, error: '命令为空' };
  return { ok: true, value: commands };
}

function makeState(text: string, textHighlight: number[], info: Record<string, string | number>): StringState {
  return { text, pattern: '', offset: 0, textHighlight, patternHighlight: [], matchedPositions: [], info };
}

function createInitialState(): StringState {
  return makeState('', [], { 提示: '请先 text 输入字符串' });
}

function* stringBasicSteps(input: Cmd[]): Generator<AlgorithmStep<StringState>> {
  let text = '';

  yield {
    id: 'init',
    description: '初始状态：空串',
    state: makeState(text, [], { 提示: '请先 text 输入字符串' }),
    highlightedElements: [],
    highlightedLines: [],
    variables: {},
  };

  for (const cmd of input) {
    if (cmd.op === 'text') {
      text = cmd.text;
      yield {
        id: 'text',
        description: `字符串 "${text}"（长度 ${text.length}）`,
        state: makeState(text, [], { 长度: text.length }),
        highlightedElements: [],
        highlightedLines: [],
        variables: { text, 长度: text.length },
      };
    } else if (cmd.op === 'length') {
      yield {
        id: 'length',
        description: `strLength：长度为 ${text.length}`,
        state: makeState(text, [], { 长度: text.length }),
        highlightedElements: [],
        highlightedLines: [],
        variables: { 长度: text.length },
      };
    } else {
      if (cmd.index >= text.length) {
        yield {
          id: 'charAt-oob',
          description: `下标 ${cmd.index} 越界（长度 ${text.length}）`,
          state: makeState(text, [], { 结果: '越界' }),
          highlightedElements: [],
          highlightedLines: [],
          variables: { 结果: '越界' },
        };
      } else {
        yield {
          id: `charAt-${cmd.index}`,
          description: `charAt(${cmd.index}) = '${text[cmd.index]}'`,
          state: makeState(text, [cmd.index], { [`字符[${cmd.index}]`]: text[cmd.index] }),
          highlightedElements: [`cell-${cmd.index}`],
          highlightedLines: [],
          variables: { 下标: cmd.index, 字符: text[cmd.index] },
        };
      }
    }
  }

  yield {
    id: 'done',
    description: '操作执行完毕',
    state: makeState(text, [], { 长度: text.length }),
    highlightedElements: [],
    highlightedLines: [],
    variables: {},
  };
}

export const stringBasicModule: AlgorithmModule<StringState, Cmd[]> = {
  meta: {
    id: 'string.basic',
    name: '字符串基本操作',
    nameEn: 'String Basic Operations',
    chapter: 'string',
    order: 1,
    summary: '字符数组顺序存储，求长 / 取字符 / 子串等基本操作。',
    coreIdea:
      '串是由零个或多个字符组成的有限序列，通常用字符数组顺序存储。基本操作包括：求串长 StrLength、取第 i 个字符、取子串 SubString、串比较 StrCompare、串连接 Concat 等。',
    operationSteps: [
      'text 输入字符串，按字符数组顺序存储。',
      'length 求串长。',
      'charAt 取指定下标字符（越界返回空）。',
      '子串、比较、连接等操作基于下标与长度。',
    ],
    useCases: ['文本处理', '编辑器', '协议解析'],
    complexity: {
      time: { best: 'O(1) 求长/取字符', average: 'O(n) 子串/比较', worst: 'O(n)' },
      space: 'O(n)',
    },
    pros: ['结构简单', '下标访问 O(1)'],
    cons: ['插入删除需移动', '定长存储可能浪费空间'],
    examPoints: [
      '串是字符的有限序列。',
      '串的顺序存储：定长数组 + 长度。',
      '空串（长度为 0）与空格串（含空格）不同。',
      'SubString(pos, len) 返回子串。',
    ],
    variableDocs: [
      { name: 'length', meaning: '串的长度（字符个数）' },
      { name: 'ch', meaning: '字符数组' },
    ],
    code: { c: cLines.join('\n'), cpp: cppLines.join('\n'), pseudocode: pseudoLines.join('\n') },
    inputSchema: [
      { key: 'ops', label: '命令', type: 'string', placeholder: 'text HelloWorld ; charAt 4' },
    ],
    defaultInput: 'text HelloWorld ; charAt 4',
    implemented: true,
    visualizer: 'string',
  },
  generateSteps: stringBasicSteps,
  parseInput,
  createInitialState,
};
