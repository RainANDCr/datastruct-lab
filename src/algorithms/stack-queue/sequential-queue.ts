/**
 * 循环队列（Circular Queue）
 *
 * 数组实现的循环队列，展示队头 front / 队尾 rear 指针变化。操作脚本：enqueue v / dequeue。
 */
import type { AlgorithmModule, AlgorithmStep, ParseResult } from '@/engine/types';
import type { ArrayState } from '../linear-list/types';
import { parseCommandScript } from '../linear-list/commands';

const MAX = 8;

const cLines = [
  '#define MAX 8',
  'int queue[MAX];',
  'int front = 0, rear = 0;   // 队头、队尾指针',
  '',
  '// 入队',
  'void enqueue(int value) {',
  '    if ((rear + 1) % MAX == front) return;  // 队满',
  '    rear = (rear + 1) % MAX;',
  '    queue[rear] = value;',
  '}',
  '',
  '// 出队',
  'int dequeue() {',
  '    if (front == rear) return -1;  // 队空',
  '    front = (front + 1) % MAX;',
  '    return queue[front];',
  '}',
];

const cppLines = [
  'const int MAX = 8;',
  'int queue[MAX];',
  'int front = 0, rear = 0;   // 队头、队尾指针',
  '',
  '// 入队',
  'void enqueue(int value) {',
  '    if ((rear + 1) % MAX == front) return;  // 队满',
  '    rear = (rear + 1) % MAX;',
  '    queue[rear] = value;',
  '}',
  '',
  '// 出队',
  'int dequeue() {',
  '    if (front == rear) return -1;  // 队空',
  '    front = (front + 1) % MAX;',
  '    return queue[front];',
  '}',
];

const pseudoLines = [
  '常量 MAX ← 8',
  '队列数组 queue[0..MAX-1]',
  'front ← 0, rear ← 0   // 队头、队尾指针',
  '',
  '// 入队',
  '函数 enqueue(value):',
  '    if (rear+1) mod MAX = front then return   // 队满',
  '    rear ← (rear+1) mod MAX',
  '    queue[rear] ← value',
  '结束函数',
  '',
  '// 出队',
  '函数 dequeue():',
  '    if front = rear then return -1   // 队空',
  '    front ← (front+1) mod MAX',
  '    返回 queue[front]',
  '结束函数',
];

const LINES = { enqueue: [7, 8], dequeue: [14, 15] } as const;

type QueueOp = 'enqueue' | 'dequeue';
interface QueueCommand {
  op: QueueOp;
  value?: number;
}

function parseInput(raw: string): ParseResult<QueueCommand[]> {
  const parsed = parseCommandScript(raw);
  if (!parsed.ok) return parsed;
  const commands: QueueCommand[] = [];
  for (const c of parsed.value) {
    if (c.cmd === 'enqueue' || c.cmd === 'enq') {
      if (c.args.length !== 1) return { ok: false, error: '"enqueue" 需要一个参数（如 enqueue 10）' };
      commands.push({ op: 'enqueue', value: c.args[0] });
    } else if (c.cmd === 'dequeue' || c.cmd === 'deq') {
      commands.push({ op: 'dequeue' });
    } else {
      return { ok: false, error: `未知命令 "${c.cmd}"（支持 enqueue / dequeue）` };
    }
  }
  return { ok: true, value: commands };
}

function makeState(
  items: (number | null)[],
  front: number,
  rear: number,
  highlighted: number[],
): ArrayState {
  const markers = [{ label: 'front', index: front }, { label: 'rear', index: rear }];
  const size = (rear - front + MAX) % MAX;
  return { items: [...items], highlighted, markers, info: { front, rear, 大小: size } };
}

function createInitialState(): ArrayState {
  return makeState(new Array<number | null>(MAX).fill(null), 0, 0, []);
}

function* circularQueueSteps(input: QueueCommand[]): Generator<AlgorithmStep<ArrayState>> {
  const queue: (number | null)[] = new Array<number | null>(MAX).fill(null);
  let front = 0;
  let rear = 0;

  yield {
    id: 'init',
    description: '初始状态：空队，front = rear = 0',
    state: makeState(queue, front, rear, []),
    highlightedElements: [],
    highlightedLines: [],
    variables: { front, rear },
  };

  for (const cmd of input) {
    if (cmd.op === 'enqueue') {
      const value = cmd.value as number;
      if ((rear + 1) % MAX === front) {
        yield {
          id: 'enq-full',
          description: `队满，无法入队 ${value}`,
          state: makeState(queue, front, rear, []),
          highlightedElements: [],
          highlightedLines: [],
          variables: { front, rear, 结果: '队满' },
        };
        continue;
      }
      rear = (rear + 1) % MAX;
      queue[rear] = value;
      yield {
        id: `enq-${rear}`,
        description: `入队 ${value}：rear 移动到 ${rear}，queue[${rear}] = ${value}`,
        state: makeState(queue, front, rear, [rear]),
        highlightedElements: [`cell-${rear}`],
        highlightedLines: [...LINES.enqueue],
        variables: { front, rear, value },
      };
    } else {
      if (front === rear) {
        yield {
          id: 'deq-empty',
          description: '队空，无法出队',
          state: makeState(queue, front, rear, []),
          highlightedElements: [],
          highlightedLines: [],
          variables: { front, rear, 结果: '队空' },
        };
        continue;
      }
      front = (front + 1) % MAX;
      const value = queue[front] as number;
      queue[front] = null;
      yield {
        id: `deq-${front}`,
        description: `出队 ${value}：front 移动到 ${front}，取出 queue[${front}]`,
        state: makeState(queue, front, rear, [front]),
        highlightedElements: [`cell-${front}`],
        highlightedLines: [...LINES.dequeue],
        variables: { front, rear, 弹出: value },
      };
    }
  }

  yield {
    id: 'done',
    description: '操作执行完毕',
    state: makeState(queue, front, rear, []),
    highlightedElements: [],
    highlightedLines: [],
    variables: { front, rear },
  };
}

export const circularQueueModule: AlgorithmModule<ArrayState, QueueCommand[]> = {
  meta: {
    id: 'stack-queue.circular-queue',
    name: '循环队列',
    nameEn: 'Circular Queue',
    chapter: 'stack-queue',
    order: 4,
    summary: '先进先出（FIFO），用 front/rear 指针循环复用数组空间。',
    coreIdea:
      '队列是先进先出（FIFO）的线性结构，队尾入队、队头出队。循环队列把数组首尾相连，用 (rear+1) % MAX 取模实现循环，避免假溢出。',
    operationSteps: [
      '入队 enqueue：rear = (rear+1) % MAX 后写入元素。',
      '出队 dequeue：front = (front+1) % MAX 后取出元素。',
      '队空条件：front == rear；队满条件：(rear+1) % MAX == front（牺牲一个存储单元）。',
    ],
    useCases: ['任务调度队列', '广度优先搜索', '缓冲区', '消息队列'],
    complexity: {
      time: { best: 'O(1)', average: 'O(1)', worst: 'O(1)' },
      space: 'O(n)',
    },
    pros: ['入队出队均为 O(1)', '循环复用空间，避免假溢出'],
    cons: ['容量固定', '队满判断需牺牲一个单元（或用计数器）'],
    examPoints: [
      '队列特性：先进先出（FIFO）。',
      '队空条件 front == rear，队满条件 (rear+1)%MAX == front。',
      '循环队列用取模运算实现下标回绕。',
    ],
    variableDocs: [
      { name: 'front', meaning: '队头指针，指向队头元素的前一个位置' },
      { name: 'rear', meaning: '队尾指针，指向队尾元素' },
      { name: 'MAX', meaning: '队列最大容量' },
    ],
    code: { c: cLines.join('\n'), cpp: cppLines.join('\n'), pseudocode: pseudoLines.join('\n') },
    inputSchema: [
      { key: 'ops', label: '操作序列', type: 'string', placeholder: 'enqueue 10, enqueue 20, dequeue, enqueue 30' },
    ],
    defaultInput: 'enqueue 10, enqueue 20, enqueue 30, dequeue, enqueue 40',
    implemented: true,
    visualizer: 'queue',
  },
  generateSteps: circularQueueSteps,
  parseInput,
  createInitialState,
};
