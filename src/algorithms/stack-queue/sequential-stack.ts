/**
 * 顺序栈（Sequential Stack）
 *
 * 数组实现的栈，展示栈顶指针 top 的变化。操作脚本：push v / pop。
 */
import type { AlgorithmModule, AlgorithmStep, ParseResult } from '@/engine/types';
import type { ArrayState } from '../linear-list/types';
import { parseCommandScript } from '../linear-list/commands';

const MAX = 8;

const cLines = [
  '#define MAX 8',
  'int stack[MAX];',
  'int top = -1;   // 栈顶指针',
  '',
  '// 入栈',
  'void push(int value) {',
  '    if (top >= MAX - 1) return;  // 栈满',
  '    stack[++top] = value;',
  '}',
  '',
  '// 出栈',
  'int pop() {',
  '    if (top < 0) return -1;  // 栈空',
  '    return stack[top--];',
  '}',
];

const cppLines = [
  'const int MAX = 8;',
  'int stack[MAX];',
  'int top = -1;   // 栈顶指针',
  '',
  '// 入栈',
  'void push(int value) {',
  '    if (top >= MAX - 1) return;  // 栈满',
  '    stack[++top] = value;',
  '}',
  '',
  '// 出栈',
  'int pop() {',
  '    if (top < 0) return -1;  // 栈空',
  '    return stack[top--];',
  '}',
];

const pseudoLines = [
  '常量 MAX ← 8',
  '栈数组 stack[0..MAX-1]',
  'top ← -1   // 栈顶指针',
  '',
  '// 入栈',
  '函数 push(value):',
  '    if top = MAX-1 then return   // 栈满',
  '    top ← top+1, stack[top] ← value',
  '结束函数',
  '',
  '// 出栈',
  '函数 pop():',
  '    if top < 0 then return -1   // 栈空',
  '    取出 stack[top], top ← top-1',
  '结束函数',
];

const LINES = { push: 7, pop: 13 } as const;

type StackOp = 'push' | 'pop';
interface StackCommand {
  op: StackOp;
  value?: number;
}

function parseInput(raw: string): ParseResult<StackCommand[]> {
  const parsed = parseCommandScript(raw);
  if (!parsed.ok) return parsed;
  const commands: StackCommand[] = [];
  for (const c of parsed.value) {
    if (c.cmd === 'push') {
      if (c.args.length !== 1) return { ok: false, error: '"push" 需要一个参数（如 push 10）' };
      commands.push({ op: 'push', value: c.args[0] });
    } else if (c.cmd === 'pop') {
      commands.push({ op: 'pop' });
    } else {
      return { ok: false, error: `未知命令 "${c.cmd}"（支持 push / pop）` };
    }
  }
  return { ok: true, value: commands };
}

function makeState(
  items: (number | null)[],
  top: number,
  highlighted: number[],
): ArrayState {
  const markers = top >= 0 ? [{ label: 'top', index: top }] : [];
  return { items: [...items], highlighted, markers, info: { top, 大小: top + 1 } };
}

function createInitialState(): ArrayState {
  return makeState(new Array<number | null>(MAX).fill(null), -1, []);
}

function* sequentialStackSteps(input: StackCommand[]): Generator<AlgorithmStep<ArrayState>> {
  const stack: (number | null)[] = new Array<number | null>(MAX).fill(null);
  let top = -1;

  yield {
    id: 'init',
    description: '初始状态：空栈，top = -1',
    state: makeState(stack, top, []),
    highlightedElements: [],
    highlightedLines: [],
    variables: { top: -1 },
  };

  for (const cmd of input) {
    if (cmd.op === 'push') {
      const value = cmd.value as number;
      if (top >= MAX - 1) {
        yield {
          id: 'push-full',
          description: `栈满（top=${top}），无法入栈 ${value}`,
          state: makeState(stack, top, []),
          highlightedElements: [],
          highlightedLines: [],
          variables: { top, 结果: '栈满' },
        };
        continue;
      }
      top += 1;
      stack[top] = value;
      yield {
        id: `push-${top}`,
        description: `入栈 ${value}：top 上移，stack[${top}] = ${value}`,
        state: makeState(stack, top, [top]),
        highlightedElements: [`cell-${top}`],
        highlightedLines: [LINES.push],
        variables: { top, value },
      };
    } else {
      if (top < 0) {
        yield {
          id: 'pop-empty',
          description: '栈空（top=-1），无法出栈',
          state: makeState(stack, top, []),
          highlightedElements: [],
          highlightedLines: [],
          variables: { top, 结果: '栈空' },
        };
        continue;
      }
      const value = stack[top] as number;
      stack[top] = null;
      top -= 1;
      yield {
        id: `pop-${top + 1}`,
        description: `出栈 ${value}：取出 stack[${top + 1}]，top 下移`,
        state: makeState(stack, top, []),
        highlightedElements: [],
        highlightedLines: [LINES.pop],
        variables: { top, 弹出: value },
      };
    }
  }

  yield {
    id: 'done',
    description: '操作执行完毕',
    state: makeState(stack, top, []),
    highlightedElements: [],
    highlightedLines: [],
    variables: { top, 大小: top + 1 },
  };
}

export const sequentialStackModule: AlgorithmModule<ArrayState, StackCommand[]> = {
  meta: {
    id: 'stack-queue.seq-stack',
    name: '顺序栈',
    nameEn: 'Sequential Stack',
    chapter: 'stack-queue',
    order: 1,
    summary: '后进先出（LIFO），用栈顶指针 top 标识栈顶。',
    coreIdea:
      '栈是一种后进先出（LIFO）的线性结构，只允许在栈顶进行插入（入栈）和删除（出栈）。顺序栈用数组存储，用 top 指针记录栈顶位置。',
    operationSteps: [
      '入栈 push：先检查栈满，再 top 上移并写入元素。',
      '出栈 pop：先检查栈空，再取出栈顶元素、top 下移。',
      'top = -1 表示空栈，top = MAX-1 表示栈满。',
    ],
    useCases: ['函数调用栈', '括号匹配', '表达式求值', '深度优先搜索'],
    complexity: {
      time: { best: 'O(1)', average: 'O(1)', worst: 'O(1)' },
      space: 'O(n)',
    },
    pros: ['入栈出栈均为 O(1)', '实现简单'],
    cons: ['容量固定，可能栈满溢出', '不支持随机访问'],
    examPoints: [
      '栈的特性：后进先出（LIFO）。',
      'top = -1 表示空栈。',
      '入栈先判满、出栈先判空（上溢/下溢）。',
    ],
    variableDocs: [
      { name: 'top', meaning: '栈顶指针，指向栈顶元素下标' },
      { name: 'MAX', meaning: '栈的最大容量' },
    ],
    code: { c: cLines.join('\n'), cpp: cppLines.join('\n'), pseudocode: pseudoLines.join('\n') },
    inputSchema: [
      { key: 'ops', label: '操作序列', type: 'string', placeholder: 'push 10, push 20, pop, push 30' },
    ],
    defaultInput: 'push 10, push 20, push 30, pop, push 40',
    implemented: true,
    visualizer: 'stack',
  },
  generateSteps: sequentialStackSteps,
  parseInput,
  createInitialState,
};
