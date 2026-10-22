/**
 * 括号匹配（Bracket Matching）
 *
 * 用栈检查括号是否匹配：左括号入栈，右括号与栈顶匹配，匹配则出栈。
 * 复用 StringView 展示括号串，栈内容在 info 中展示。
 * 输入：含括号的表达式（如 (a+b)*[c-d]）。
 */
import type { AlgorithmModule, AlgorithmStep, ParseResult } from '@/engine/types';
import type { StringState } from '../string/types';

const cLines = [
  '// 括号匹配（栈）',
  'int match(char* s) {',
  '    char stack[MAXN]; int top = -1;',
  '    for (int i = 0; s[i]; i++) {',
  '        char c = s[i];',
  '        if (c == \'(\' || c == \'[\' || c == \'{\')',
  '            stack[++top] = c;        // 左括号入栈',
  '        else if (c == \')\' || c == \']\' || c == \'}\') {',
  '            if (top < 0 || !pair(stack[top], c)) return 0;',
  '            top--;                    // 匹配出栈',
  '        }',
  '    }',
  '    return top == -1;   // 栈空则匹配',
  '}',
];

const cppLines = [
  '// 括号匹配（栈）',
  'bool match(string s) {',
  '    stack<char> st;',
  '    for (char c : s) {',
  '        if (c == \'(\' || c == \'[\' || c == \'{\')',
  '            st.push(c);        // 左括号入栈',
  '        else if (c == \')\' || c == \']\' || c == \'}\') {',
  '            if (st.empty() || !pair(st.top(), c)) return false;',
  '            st.pop();          // 匹配出栈',
  '        }',
  '    }',
  '    return st.empty();   // 栈空则匹配',
  '}',
];

const pseudoLines = [
  '// 括号匹配（栈）',
  '函数 match(s):',
  '    stack ← 空栈',
  '    for c in s do',
  '        if c 是左括号 then stack.push(c)',
  '        else if c 是右括号 then',
  '            if stack 空 或 不配对(stack.top, c) then return false',
  '            stack.pop()',
  '        end if',
  '    end for',
  '    return stack 空',
  '结束函数',
];

const PAIRS: Record<string, string> = { ')': '(', ']': '[', '}': '{' };

function parseInput(raw: string): ParseResult<string> {
  const s = raw.trim();
  if (!s) return { ok: false, error: '请输入含括号的表达式（如 (a+b)*[c-d]）' };
  return { ok: true, value: s };
}

function makeState(text: string, textHighlight: number[], info: Record<string, string | number>): StringState {
  return { text, pattern: '', offset: 0, textHighlight, patternHighlight: [], matchedPositions: [], info };
}

function createInitialState(): StringState {
  return makeState('', [], { 提示: '请输入含括号的表达式' });
}

function* bracketSteps(input: string): Generator<AlgorithmStep<StringState>> {
  const stack: string[] = [];
  let ok = true;

  yield {
    id: 'init',
    description: `检查 "${input}" 的括号匹配`,
    state: makeState(input, [], { 栈: '空' }),
    highlightedElements: [],
    highlightedLines: [],
    variables: { 表达式: input },
  };

  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    if (c === '(' || c === '[' || c === '{') {
      stack.push(c);
      yield {
        id: `push-${i}`,
        description: `左括号 '${c}' 入栈（位置 ${i}）`,
        state: makeState(input, [i], { 栈: stack.join(' ') }),
        highlightedElements: [`cell-${i}`],
        highlightedLines: [],
        variables: { 字符: c, 栈: stack.join(' ') },
      };
    } else if (c === ')' || c === ']' || c === '}') {
      const top = stack[stack.length - 1];
      if (top === PAIRS[c]) {
        stack.pop();
        yield {
          id: `pop-${i}`,
          description: `右括号 '${c}' 与栈顶 '${top}' 匹配，出栈`,
          state: makeState(input, [i], { 栈: stack.join(' ') || '空' }),
          highlightedElements: [`cell-${i}`],
          highlightedLines: [],
          variables: { 字符: c, 栈: stack.join(' ') || '空' },
        };
      } else {
        ok = false;
        yield {
          id: `mismatch-${i}`,
          description: `右括号 '${c}' 与栈顶 ${top ? `'${top}'` : '（空）'} 不匹配！`,
          state: makeState(input, [i], { 栈: stack.join(' ') || '空', 结果: '不匹配' }),
          highlightedElements: [`cell-${i}`],
          highlightedLines: [],
          variables: { 结果: '不匹配', 字符: c },
        };
        break;
      }
    }
  }

  if (ok && stack.length > 0) {
    ok = false;
    yield {
      id: 'leftover',
      description: `扫描结束，栈中还有 ${stack.length} 个未匹配的左括号：${stack.join(' ')}`,
      state: makeState(input, [], { 栈: stack.join(' '), 结果: '不匹配' }),
      highlightedElements: [],
      highlightedLines: [],
      variables: { 结果: '不匹配', 剩余: stack.join(' ') },
    };
  }

  if (ok) {
    yield {
      id: 'done',
      description: '括号匹配正确',
      state: makeState(input, [], { 结果: '匹配', 栈: '空' }),
      highlightedElements: [],
      highlightedLines: [],
      variables: { 结果: '匹配' },
    };
  }
}

export const bracketMatchingModule: AlgorithmModule<StringState, string> = {
  meta: {
    id: 'stack-queue.bracket-matching',
    name: '括号匹配',
    nameEn: 'Bracket Matching',
    chapter: 'stack-queue',
    order: 6,
    summary: '栈检查括号配对，左括号入栈、右括号匹配出栈。',
    coreIdea: '括号匹配是栈的经典应用：遇到左括号入栈，遇到右括号与栈顶匹配，匹配则出栈；最终栈空则全部配对，否则不匹配。',
    operationSteps: ['扫描表达式。', '左括号入栈。', '右括号与栈顶匹配，匹配则出栈。', '结束后栈空则匹配正确。'],
    useCases: ['代码编辑器括号高亮', '编译器语法检查', '表达式合法性校验'],
    complexity: {
      time: { best: 'O(n)', average: 'O(n)', worst: 'O(n)' },
      space: 'O(n) 栈',
    },
    pros: ['实现简单', '线性时间'],
    cons: ['只检查括号配对'],
    examPoints: [
      '括号匹配用栈，左括号入栈、右括号匹配出栈。',
      '最终栈空则匹配成功。',
      '栈的 LIFO 特性天然适合括号配对。',
    ],
    variableDocs: [
      { name: 'stack', meaning: '未匹配的左括号栈' },
      { name: 'top', meaning: '栈顶元素' },
    ],
    code: { c: cLines.join('\n'), cpp: cppLines.join('\n'), pseudocode: pseudoLines.join('\n') },
    inputSchema: [{ key: 'expr', label: '表达式', type: 'string', placeholder: '(a+b)*[c-d]' }],
    defaultInput: '(a + b) * [c - {d / e}]',
    implemented: true,
    visualizer: 'string',
  },
  generateSteps: bracketSteps,
  parseInput,
  createInitialState,
};
