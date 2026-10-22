/**
 * 哈夫曼树与哈夫曼编码（共享构建逻辑）。
 *
 * 输入「字符:权值」序列，贪心选取权值最小的两个结点反复合并，
 * 形成哈夫曼树；左 0 右 1 得到各字符的哈夫曼编码。
 * 复用 TreeView，叶子结点显示权值，字符映射与编码在 aux/info 中展示。
 */
import type { AlgorithmStep, ParseResult } from '@/engine/types';
import type { TreeState, TreeNodeState, TreeNodeStatus } from './types';

export interface HuffmanSymbol {
  char: string;
  weight: number;
}

export function parseHuffmanInput(raw: string): ParseResult<HuffmanSymbol[]> {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, error: '请输入「字符:权值」序列（如 A:5, B:3, C:2, D:4）' };
  const tokens = trimmed.split(/[,\s，、;；]+/).filter(Boolean);
  const symbols: HuffmanSymbol[] = [];
  for (const t of tokens) {
    const m = t.match(/^([A-Za-z0-9]):(\d+)$/);
    if (!m) return { ok: false, error: `"${t}" 格式错误（应为 字符:权值，如 A:5）` };
    const weight = Number(m[2]);
    if (!Number.isFinite(weight) || weight <= 0) return { ok: false, error: `"${t}" 权值应为正整数` };
    symbols.push({ char: m[1], weight });
  }
  if (symbols.length < 2) return { ok: false, error: '至少需要 2 个字符' };
  return { ok: true, value: symbols };
}

export interface HuffmanResult {
  nodes: Record<string, TreeNodeState>;
  rootId: string | null;
  charOf: Record<string, string>;
  codes: Record<string, string>;
}

export function createInitialState(): TreeState {
  return { nodes: {}, rootId: null, highlighted: [], status: {}, aux: { label: '编码', ids: [] } };
}

/** 构建哈夫曼树并产出步骤；build 由调用方提供（闭包持有 nodes/rootId 引用） */
export function* buildHuffman(
  symbols: HuffmanSymbol[],
  makeBuild: (nodes: Record<string, TreeNodeState>, getRoot: () => string | null, charOf: Record<string, string>) => (highlighted?: string[], current?: Record<string, TreeNodeStatus>, aux?: { label: string; ids: string[] }) => TreeState,
): Generator<AlgorithmStep<TreeState>, HuffmanResult> {
  const nodes: Record<string, TreeNodeState> = {};
  const charOf: Record<string, string> = {};
  let rootId: string | null = null;
  const build = makeBuild(nodes, () => rootId, charOf);

  // 优先队列（按权值升序，稳定）
  const heap: { id: string; weight: number }[] = [];
  const push = (id: string, weight: number) => {
    heap.push({ id, weight });
    heap.sort((a, b) => a.weight - b.weight || a.id.localeCompare(b.id));
  };
  const pop = () => heap.shift()!;

  let idx = 0;
  for (const s of symbols) {
    const id = `leaf-${idx++}`;
    nodes[id] = { id, value: s.weight, leftId: null, rightId: null };
    charOf[id] = s.char;
    push(id, s.weight);
    yield {
      id: `leaf-${s.char}`,
      description: `创建叶子结点 ${s.char}（权值 ${s.weight}）`,
      state: build([id], { [id]: 'new' }),
      highlightedElements: [`node-${id}`],
      highlightedLines: [],
      variables: { 字符: s.char, 权值: s.weight },
    };
  }

  let mergeId = 0;
  while (heap.length > 1) {
    const a = pop();
    const b = pop();
    const id = `m${mergeId++}`;
    const w = a.weight + b.weight;
    nodes[id] = { id, value: w, leftId: a.id, rightId: b.id };
    push(id, w);
    yield {
      id: `merge-${mergeId}`,
      description: `选取权值最小的 ${a.weight} 与 ${b.weight} 合并，新结点权值 ${w}`,
      state: build([id, a.id, b.id], { [id]: 'current', [a.id]: 'comparing', [b.id]: 'comparing' }),
      highlightedElements: [`node-${id}`, `node-${a.id}`, `node-${b.id}`],
      highlightedLines: [],
      variables: { 合并: `${a.weight}+${b.weight}=${w}` },
    };
  }

  rootId = heap[0]?.id ?? null;
  yield {
    id: 'built',
    description: '哈夫曼树构建完成',
    state: build([rootId ?? ''], { [rootId ?? '']: 'done' }),
    highlightedElements: [],
    highlightedLines: [],
    variables: { 根权值: rootId ? nodes[rootId].value : 0 },
  };

  // 计算编码（左 0 右 1）
  const codes: Record<string, string> = {};
  const dfs = (id: string | null, prefix: string) => {
    if (id === null) return;
    if (charOf[id]) codes[charOf[id]] = prefix || '0';
    dfs(nodes[id].leftId, prefix + '0');
    dfs(nodes[id].rightId, prefix + '1');
  };
  dfs(rootId, '');

  return { nodes, rootId, charOf, codes };
}
