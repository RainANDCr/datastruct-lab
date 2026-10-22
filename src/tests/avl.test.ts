import { describe, expect, it } from 'vitest';
import { avlModule } from '@/algorithms/search/avl';
import type { TreeState, TreeNodeState } from '@/algorithms/tree/types';
import { collectSteps } from '@/engine/step-generator';

function parse(mod: { parseInput: (s: string) => { ok: true; value: number[] } | { ok: false } }, input: string): number[] {
  const r = mod.parseInput(input);
  if (!r.ok) throw new Error('parse failed');
  return r.value;
}

function inorderValues(state: TreeState): number[] {
  const { nodes, rootId } = state;
  const result: number[] = [];
  const walk = (id: string | null): void => {
    if (id === null) return;
    const n = nodes[id];
    walk(n.leftId);
    result.push(n.value);
    walk(n.rightId);
  };
  walk(rootId);
  return result;
}

function isBalanced(nodes: Record<string, TreeNodeState>, id: string | null): { ok: boolean; h: number } {
  if (id === null) return { ok: true, h: 0 };
  const n = nodes[id];
  const l = isBalanced(nodes, n.leftId);
  const r = isBalanced(nodes, n.rightId);
  return { ok: l.ok && r.ok && Math.abs(l.h - r.h) <= 1, h: Math.max(l.h, r.h) + 1 };
}

describe('AVL 平衡二叉树', () => {
  it('插入后中序有序', () => {
    const steps = collectSteps(avlModule, parse(avlModule, '8, 3, 10, 1, 6, 4, 7, 14, 13'));
    const st = steps[steps.length - 1].state as TreeState;
    expect(inorderValues(st)).toEqual([1, 3, 4, 6, 7, 8, 10, 13, 14]);
  });

  it('插入后保持平衡（平衡因子绝对值 ≤ 1）', () => {
    const steps = collectSteps(avlModule, parse(avlModule, '10, 20, 30, 40, 50, 25'));
    const st = steps[steps.length - 1].state as TreeState;
    expect(isBalanced(st.nodes, st.rootId).ok).toBe(true);
  });

  it('重复值被忽略', () => {
    const steps = collectSteps(avlModule, parse(avlModule, '5, 3, 5, 7'));
    const st = steps[steps.length - 1].state as TreeState;
    expect(inorderValues(st)).toEqual([3, 5, 7]);
  });
});
