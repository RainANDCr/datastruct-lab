import { describe, expect, it } from 'vitest';
import { bstModule } from '@/algorithms/search/bst';
import type { TreeState } from '@/algorithms/tree/types';
import { collectSteps } from '@/engine/step-generator';

function parse<T>(mod: { parseInput: (s: string) => { ok: true; value: T } | { ok: false } }, input: string): T {
  const r = mod.parseInput(input);
  if (!r.ok) throw new Error('parse failed');
  return r.value;
}

function finalTree(input: string): TreeState {
  const steps = collectSteps(bstModule, parse(bstModule, input));
  return steps[steps.length - 1].state as TreeState;
}

/** 中序遍历值序列（BST 应为升序） */
function inorderValues(st: TreeState): number[] {
  const result: number[] = [];
  const walk = (id: string | null) => {
    if (id === null) return;
    const n = st.nodes[id];
    walk(n.leftId);
    result.push(n.value);
    walk(n.rightId);
  };
  walk(st.rootId);
  return result;
}

describe('二叉排序树插入', () => {
  it('构建后中序遍历有序', () => {
    const st = finalTree('insert 8, insert 3, insert 10, insert 1, insert 6, insert 14, insert 4, insert 7');
    expect(inorderValues(st)).toEqual([1, 3, 4, 6, 7, 8, 10, 14]);
  });

  it('重复值被忽略', () => {
    const st = finalTree('insert 8, insert 8, insert 3');
    expect(inorderValues(st)).toEqual([3, 8]);
  });
});

describe('二叉排序树查找', () => {
  it('命中', () => {
    const steps = collectSteps(bstModule, parse(bstModule, 'insert 8, insert 3, insert 10, search 3'));
    expect(steps.some((s) => s.description.includes('找到 3'))).toBe(true);
  });

  it('未命中', () => {
    const steps = collectSteps(bstModule, parse(bstModule, 'insert 8, insert 3, insert 10, search 100'));
    expect(steps.some((s) => s.description.includes('未找到'))).toBe(true);
  });
});

describe('二叉排序树删除', () => {
  it('删除叶子结点', () => {
    const st = finalTree('insert 8, insert 3, insert 10, insert 1, delete 1');
    expect(inorderValues(st)).toEqual([3, 8, 10]);
  });

  it('删除单子结点（用孩子替换）', () => {
    const st = finalTree('insert 8, insert 3, insert 10, insert 1, delete 3');
    expect(inorderValues(st)).toEqual([1, 8, 10]);
  });

  it('删除双子结点（用中序后继替换）', () => {
    const st = finalTree('insert 8, insert 3, insert 10, insert 1, insert 6, insert 4, insert 7, delete 3');
    expect(inorderValues(st)).toEqual([1, 4, 6, 7, 8, 10]);
  });

  it('删除根结点（双子）', () => {
    const st = finalTree('insert 8, insert 3, insert 10, insert 1, insert 6, insert 14, insert 4, insert 7, delete 8');
    expect(inorderValues(st)).toEqual([1, 3, 4, 6, 7, 10, 14]);
  });
});
