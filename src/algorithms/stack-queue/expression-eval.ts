/**
 * 表达式求值（Expression Evaluation，中缀转后缀 + 求值）
 *
 * 用栈将中缀表达式转为后缀（逆波兰）表达式，再对后缀表达式求值。
 * 展示运算符栈、后缀表达式累积与操作数栈求值过程。
 * 输入：中缀表达式（支持 + - * / 与括号，操作数为整数）。
 */
import type { AlgorithmModule, AlgorithmStep, ParseResult } from '@/engine/types';
import type { StringState } from '../string/types';

const cLines = [
  '// 中缀转后缀（运算符栈）',
  'int priority(char op) {',
  '    if (op == \'+\' || op == \'-\') return 1;',
  '    if (op == \'*\' || op == \'/\') return 2;',
  '    return 0;',
  '}',
  'void infixToPostfix(char* s) {',
  '    char stack[MAXN]; int top = -1;',
  '    for (int i = 0; s[i]; i++) {',
  '        char c = s[i];',
  '        if (isdigit(c)) output(c);',
  '        else if (c == \'(\') stack[++top] = c;',
  '        else if (c == \')\') {',
  '            while (stack[top] != \'(\') output(stack[top--]);',
  '            top--;',
  '        } else {',
  '            while (top >= 0 && priority(stack[top]) >= priority(c))',
  '                output(stack[top--]);',
  '            stack[++top] = c;',
  '        }',
  '    }',
  '    while (top >= 0) output(stack[top--]);',
  '}',
];

const cppLines = [
  '// 中缀转后缀（运算符栈）',
  'int priority(char op) {',
  '    if (op == \'+\' || op == \'-\') return 1;',
  '    if (op == \'*\' || op == \'/\') return 2;',
  '    return 0;',
  '}',
  'void infixToPostfix(string s) {',
  '    stack<char> st;',
  '    for (char c : s) {',
  '        if (isdigit(c)) output(c);',
  '        else if (c == \'(\') st.push(c);',
  '        else if (c == \')\') {',
  '            while (st.top() != \'(\') { output(st.top()); st.pop(); }',
  '            st.pop();',
  '        } else {',
  '            while (!st.empty() && priority(st.top()) >= priority(c))',
  '                { output(st.top()); st.pop(); }',
  '            st.push(c);',
  '        }',
  '    }',
  '    while (!st.empty()) { output(st.top()); st.pop(); }',
  '}',
];

const pseudoLines = [
  '// 中缀转后缀（运算符栈）',
  '函数 priority(op): 返回运算符优先级',
  '函数 infixToPostfix(s):',
  '    stack ← 空栈',
  '    for c in s do',
  '        if c 是数字 then output(c)',
  '        else if c = "(" then stack.push(c)',
  '        else if c = ")" then',
  '            while stack.top ≠ "(" do output(stack.pop())',
  '            stack.pop()',
  '        else',
  '            while 栈非空 且 priority(stack.top) ≥ priority(c) do',
  '                output(stack.pop())',
  '            stack.push(c)',
  '        end if',
  '    end for',
  '    while 栈非空 do output(stack.pop())',
  '结束函数',
];

function priority(op: string): number {
  if (op === '+' || op === '-') return 1;
  if (op === '*' || op === '/') return 2;
  return 0;
}

function parseInput(raw: string): ParseResult<string> {
  const s = raw.trim().replace(/\s+/g, '');
  if (!s) return { ok: false, error: '请输入中缀表达式（如 3+4*2/(1-5)）' };
  if (!/^[\d+\-*/()]+$/.test(s)) return { ok: false, error: '仅支持数字与 + - * / ( )' };
  return { ok: true, value: s };
}

function makeState(text: string, textHighlight: number[], info: Record<string, string | number>): StringState {
  return { text, pattern: '', offset: 0, textHighlight, patternHighlight: [], matchedPositions: [], info };
}

function createInitialState(): StringState {
  return makeState('', [], { 提示: '请输入中缀表达式' });
}

function* expressionSteps(input: string): Generator<AlgorithmStep<StringState>> {
  const opStack: string[] = [];
  let postfix = '';

  yield {
    id: 'init',
    description: `中缀表达式 "${input}"，转后缀并求值`,
    state: makeState(input, [], { 运算符栈: '空', 后缀: '' }),
    highlightedElements: [],
    highlightedLines: [],
    variables: { 表达式: input },
  };

  // 中缀转后缀
  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    if (/\d/.test(c)) {
      postfix += c;
      yield {
        id: `num-${i}`,
        description: `数字 ${c}：直接输出到后缀`,
        state: makeState(input, [i], { 运算符栈: opStack.join(' ') || '空', 后缀: postfix }),
        highlightedElements: [`cell-${i}`],
        highlightedLines: [],
        variables: { 后缀: postfix },
      };
    } else if (c === '(') {
      opStack.push(c);
      yield {
        id: `lp-${i}`,
        description: `左括号 '(' 入栈`,
        state: makeState(input, [i], { 运算符栈: opStack.join(' '), 后缀: postfix }),
        highlightedElements: [`cell-${i}`],
        highlightedLines: [],
        variables: { 运算符栈: opStack.join(' ') },
      };
    } else if (c === ')') {
      let popped = '';
      while (opStack.length && opStack[opStack.length - 1] !== '(') {
        popped = opStack.pop()!;
        postfix += popped;
      }
      if (opStack.length) opStack.pop(); // 弹出 (
      yield {
        id: `rp-${i}`,
        description: `右括号 ')'：弹出 ${popped || '（无）'} 到后缀，并弹出 '('`,
        state: makeState(input, [i], { 运算符栈: opStack.join(' ') || '空', 后缀: postfix }),
        highlightedElements: [`cell-${i}`],
        highlightedLines: [],
        variables: { 后缀: postfix },
      };
    } else {
      while (opStack.length && opStack[opStack.length - 1] !== '(' && priority(opStack[opStack.length - 1]) >= priority(c)) {
        postfix += opStack.pop()!;
      }
      opStack.push(c);
      yield {
        id: `op-${i}`,
        description: `运算符 '${c}'：弹出优先级更高的运算符，'${c}' 入栈`,
        state: makeState(input, [i], { 运算符栈: opStack.join(' '), 后缀: postfix }),
        highlightedElements: [`cell-${i}`],
        highlightedLines: [],
        variables: { 运算符栈: opStack.join(' '), 后缀: postfix },
      };
    }
  }
  while (opStack.length) postfix += opStack.pop()!;
  yield {
    id: 'postfix',
    description: `后缀表达式：${postfix}`,
    state: makeState(input, [], { 运算符栈: '空', 后缀: postfix }),
    highlightedElements: [],
    highlightedLines: [],
    variables: { 后缀: postfix },
  };

  // 后缀求值
  const valStack: number[] = [];
  for (const c of postfix) {
    if (/\d/.test(c)) {
      valStack.push(Number(c));
      yield {
        id: `vpush-${c}`,
        description: `操作数 ${c} 入栈`,
        state: makeState(postfix, [], { 操作数栈: valStack.join(' '), 后缀: postfix }),
        highlightedElements: [],
        highlightedLines: [],
        variables: { 操作数栈: valStack.join(' ') },
      };
    } else {
      const b = valStack.pop()!;
      const a = valStack.pop()!;
      let r = 0;
      if (c === '+') r = a + b;
      else if (c === '-') r = a - b;
      else if (c === '*') r = a * b;
      else if (c === '/') r = Math.trunc(a / b);
      valStack.push(r);
      yield {
        id: `vop-${c}`,
        description: `计算 ${a} ${c} ${b} = ${r}，结果入栈`,
        state: makeState(postfix, [], { 操作数栈: valStack.join(' '), 后缀: postfix }),
        highlightedElements: [],
        highlightedLines: [],
        variables: { 计算: `${a} ${c} ${b} = ${r}` },
      };
    }
  }

  yield {
    id: 'done',
    description: `求值结果：${valStack[0]}`,
    state: makeState(postfix, [], { 结果: valStack[0], 后缀: postfix }),
    highlightedElements: [],
    highlightedLines: [],
    variables: { 结果: valStack[0] },
  };
}

export const expressionEvalModule: AlgorithmModule<StringState, string> = {
  meta: {
    id: 'stack-queue.expression-eval',
    name: '表达式求值',
    nameEn: 'Expression Evaluation',
    chapter: 'stack-queue',
    order: 7,
    summary: '中缀转后缀（逆波兰），再对后缀求值。',
    coreIdea: '表达式求值分两步：先用运算符栈把中缀表达式转为后缀（逆波兰）表达式——数字直接输出、运算符按优先级弹栈、括号特殊处理；再对后缀表达式用操作数栈求值：遇到数字入栈、遇到运算符弹出两个操作数计算后入栈。',
    operationSteps: [
      '中缀转后缀：数字输出、运算符按优先级弹栈入栈。',
      '括号处理：左括号入栈，右括号弹出到左括号。',
      '后缀求值：数字入栈。',
      '运算符弹出两个操作数计算，结果入栈。',
    ],
    useCases: ['计算器实现', '编译器表达式解析', '逆波兰表达式'],
    complexity: {
      time: { best: 'O(n)', average: 'O(n)', worst: 'O(n)' },
      space: 'O(n) 栈',
    },
    pros: ['一次扫描求值', '无需考虑括号嵌套'],
    cons: ['需两遍（转换 + 求值）'],
    examPoints: [
      '后缀表达式（逆波兰）运算符在后。',
      '中缀转后缀用运算符栈。',
      '后缀求值用操作数栈。',
      '运算符优先级：* / 高于 + -。',
    ],
    variableDocs: [
      { name: 'stack', meaning: '运算符栈（转后缀）或操作数栈（求值）' },
      { name: 'priority', meaning: '运算符优先级' },
    ],
    code: { c: cLines.join('\n'), cpp: cppLines.join('\n'), pseudocode: pseudoLines.join('\n') },
    inputSchema: [{ key: 'expr', label: '中缀表达式', type: 'string', placeholder: '3+4*2/(1-5)' }],
    defaultInput: '3 + 4 * 2 / (1 - 5)',
    implemented: true,
    visualizer: 'string',
  },
  generateSteps: expressionSteps,
  parseInput,
  createInitialState,
};
