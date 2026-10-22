/**
 * 链栈（Linked Stack）
 *
 * 链式存储的栈：以链表头作为栈顶，top 指针指向栈顶结点。
 * 复用链表渲染器与内存快照，展示栈帧指针变量 top / p 与堆内存结点关系。
 * 操作脚本：push v / pop。
 * 代码行号与 C / C++ / 伪代码严格对齐（三者均为 22 行）。
 */
import type { AlgorithmModule, AlgorithmStep, ParseResult } from '@/engine/types';
import type { LinkedListState } from '../linear-list/types';
import { parseCommandScript } from '../linear-list/commands';
import { buildListState, buildMemory, createAddrAllocator, ptrVar, type HeapNode } from '../linear-list/linked-shared';

/* ---------------- 参考代码（22 行，三语言对齐） ---------------- */
const cLines = [
  'typedef struct Node {',
  '    int data;',
  '    struct Node* next;',
  '} Node;',
  '',
  '// 入栈（头插法）',
  'void push(Node** top, int value) {',
  '    Node* p = (Node*)malloc(sizeof(Node));',
  '    p->data = value;',
  '    p->next = *top;',
  '    *top = p;',
  '}',
  '',
  '// 出栈',
  'int pop(Node** top) {',
  '    if (*top == NULL) return -1;  // 栈空',
  '    Node* p = *top;',
  '    int value = p->data;',
  '    *top = p->next;',
  '    free(p);',
  '    return value;',
  '}',
];

const cppLines = [
  'struct Node {',
  '    int data;',
  '    Node* next;',
  '};',
  '',
  '// 入栈（头插法）',
  'void push(Node*& top, int value) {',
  '    Node* p = new Node();',
  '    p->data = value;',
  '    p->next = top;',
  '    top = p;',
  '}',
  '',
  '// 出栈',
  'int pop(Node*& top) {',
  '    if (top == nullptr) return -1;  // 栈空',
  '    Node* p = top;',
  '    int value = p->data;',
  '    top = p->next;',
  '    delete p;',
  '    return value;',
  '}',
];

const pseudoLines = [
  '结点结构 Node:',
  '    data 域',
  '    next 指针域',
  '结束结构',
  '',
  '// 入栈（头插法）',
  '函数 push(top, value):',
  '    p ← 新建结点',
  '    p.data ← value',
  '    p.next ← top',
  '    top ← p',
  '结束函数',
  '',
  '// 出栈',
  '函数 pop(top):',
  '    if top = NULL then return -1  // 栈空',
  '    p ← top',
  '    value ← p.data',
  '    top ← p.next',
  '    释放 p',
  '    return value',
  '结束函数',
];

const LINES = {
  pushNew: [8, 9],
  pushLink: 10,
  pushUpdate: 11,
  popEmpty: 16,
  popTake: [17, 18],
  popUpdate: 19,
  popFree: 20,
} as const;

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

function createInitialState(): LinkedListState {
  return { nodes: [], headId: null, kind: 'singly', headLabel: 'top', highlighted: [], status: {} };
}

function* linkedStackSteps(input: StackCommand[]): Generator<AlgorithmStep<LinkedListState>> {
  const nodes = new Map<string, HeapNode>();
  let top: string | null = null;
  const newAddr = createAddrAllocator();

  const build = (highlighted: string[] = [], status: Record<string, 'new' | 'current' | 'done' | 'error'> = {}) =>
    buildListState({ head: top, nodes, highlighted, status, kind: 'singly', headLabel: 'top' });
  const mem = (vars: ReturnType<typeof ptrVar>[]) => buildMemory(nodes, vars, false);

  yield {
    id: 'init',
    description: '初始状态：空栈，top = NULL',
    state: build(),
    memory: mem([ptrVar('top', null)]),
    highlightedElements: [],
    highlightedLines: [],
    variables: { top: 'NULL' },
  };

  for (const cmd of input) {
    if (cmd.op === 'push') {
      const value = cmd.value as number;
      const addr = newAddr();
      const newNode: HeapNode = { address: addr, value, next: null };
      nodes.set(addr, newNode);

      yield {
        id: `push-new-${addr}`,
        description: `Node* p = new Node(${value})：堆中创建新结点 ${addr}`,
        state: build([], { [addr]: 'new' }),
        memory: mem([ptrVar('top', top), ptrVar('p', addr)]),
        highlightedElements: [],
        highlightedLines: [...LINES.pushNew],
        variables: { p: addr, value },
      };

      newNode.next = top;
      yield {
        id: `push-link-${addr}`,
        description: `p->next = top：新结点 ${addr} 的 next 指向原栈顶 ${top ?? 'NULL'}`,
        state: build([], { [addr]: 'new' }),
        memory: mem([ptrVar('top', top), ptrVar('p', addr)]),
        highlightedElements: [],
        highlightedLines: [LINES.pushLink],
        variables: { p: addr, 'p->next': top ?? 'NULL' },
      };

      top = addr;
      yield {
        id: `push-update-${addr}`,
        description: `top = p：栈顶指针更新为新结点 ${addr}`,
        state: build([addr], { [addr]: 'new' }),
        memory: mem([ptrVar('top', top), ptrVar('p', addr)]),
        highlightedElements: [`node-${addr}`],
        highlightedLines: [LINES.pushUpdate],
        variables: { top: addr, value },
      };
    } else {
      if (top === null) {
        yield {
          id: 'pop-empty',
          description: '栈空（top = NULL），无法出栈',
          state: build(),
          memory: mem([ptrVar('top', null)]),
          highlightedElements: [],
          highlightedLines: [],
          variables: { top: 'NULL', 结果: '栈空' },
        };
        continue;
      }
      const p: string = top;
      const value = nodes.get(p)!.value;
      yield {
        id: `pop-take-${p}`,
        description: `p = top：取出栈顶结点 ${p}（值 ${value}）`,
        state: build([p], { [p]: 'current' }),
        memory: mem([ptrVar('top', top), ptrVar('p', p)]),
        highlightedElements: [`node-${p}`],
        highlightedLines: [...LINES.popTake],
        variables: { p, 'p->data': value },
      };

      top = nodes.get(p)!.next;
      yield {
        id: `pop-update-${p}`,
        description: `top = p->next：栈顶指针下移为 ${top ?? 'NULL'}`,
        state: build(),
        memory: mem([ptrVar('top', top), ptrVar('p', p)]),
        highlightedElements: [],
        highlightedLines: [LINES.popUpdate],
        variables: { top: top ?? 'NULL', p },
      };

      nodes.get(p)!.freed = true;
      yield {
        id: `pop-free-${p}`,
        description: `free(p)：释放结点 ${p}（值 ${value}）`,
        state: build(),
        memory: mem([ptrVar('top', top), ptrVar('p', p)]),
        highlightedElements: [],
        highlightedLines: [LINES.popFree],
        variables: { 弹出: value, 已释放: p },
      };
    }
  }

  yield {
    id: 'done',
    description: '操作执行完毕',
    state: build(),
    memory: mem([ptrVar('top', top)]),
    highlightedElements: [],
    highlightedLines: [],
    variables: { top: top ?? 'NULL' },
  };
}

export const linkedStackModule: AlgorithmModule<LinkedListState, StackCommand[]> = {
  meta: {
    id: 'stack-queue.linked-stack',
    name: '链栈',
    nameEn: 'Linked Stack',
    chapter: 'stack-queue',
    order: 2,
    summary: '用链表实现的栈，top 指针指向栈顶，头插头删，无容量限制。',
    coreIdea:
      '链栈以链表头作为栈顶，用 top 指针指向栈顶结点。入栈即头插（新结点 next 指向原栈顶，再更新 top），出栈即删除头结点。因在头部操作，入栈出栈均为 O(1)，且不会栈满溢出。',
    operationSteps: [
      '入栈 push：Node* p = new Node(v) 创建结点 → p->next = top 连接 → top = p 更新栈顶。',
      '出栈 pop：先判栈空（top==NULL），再 top = top->next，并 free 原栈顶。',
      '链栈无需预分配空间，容量随需增长。',
    ],
    useCases: ['函数调用栈', '括号匹配', '表达式求值', '需要动态容量的栈场景'],
    complexity: {
      time: { best: 'O(1)', average: 'O(1)', worst: 'O(1)' },
      space: 'O(n)（含指针开销）',
    },
    pros: ['入栈出栈 O(1)', '无栈满溢出、容量动态', '共享链表结构，教学直观'],
    cons: ['每个结点需额外指针空间', '无随机访问'],
    examPoints: [
      '链栈以链表头作栈顶，头插头删。',
      '入栈出栈时间复杂度均为 O(1)。',
      '链栈与顺序栈的区别：是否需预分配容量。',
    ],
    variableDocs: [
      { name: 'top', meaning: '栈顶指针，指向栈顶结点' },
      { name: 'p', meaning: '临时指针（入栈指向新结点，出栈指向待释放结点）' },
    ],
    code: { c: cLines.join('\n'), cpp: cppLines.join('\n'), pseudocode: pseudoLines.join('\n') },
    inputSchema: [
      { key: 'ops', label: '操作序列', type: 'string', placeholder: 'push 10, push 20, pop, push 30' },
    ],
    defaultInput: 'push 10, push 20, push 30, pop, push 40',
    implemented: true,
    visualizer: 'linked-list',
  },
  generateSteps: linkedStackSteps,
  parseInput,
  createInitialState,
};
