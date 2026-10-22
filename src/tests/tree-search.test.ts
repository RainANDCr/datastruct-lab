import { describe, expect, it } from 'vitest';
import { binarySearchModule } from '@/algorithms/search/binary';
import { binaryTreeModule } from '@/algorithms/tree/binary';
import type { TreeState } from '@/algorithms/tree/types';
import type { ArrayState } from '@/algorithms/linear-list/types';
import { collectSteps } from '@/engine/step-generator';

function parse<T>(mod: { parseInput: (s: string) => { ok: true; value: T } | { ok: false } }, input: string): T {
  const r = mod.parseInput(input);
  if (!r.ok) throw new Error('parse failed');
  return r.value;
}

function traversalResult(input: string, keyword: string): number[] {
  const steps = collectSteps(binaryTreeModule, parse(binaryTreeModule, input));
  const done = steps.find((s) => s.description.includes(keyword));
  expect(done).toBeDefined();
  const st = done!.state as TreeState;
  return (st.visitOrder ?? []).map((id) => st.nodes[id].value);
}

describe('二叉树构建', () => {
  it('层序构建（含空位）正确连接左右子', () => {
    const steps = collectSteps(binaryTreeModule, parse(binaryTreeModule, 'build 1,2,3,null,4,5'));
    const st = steps.find((s) => s.description.includes('构建完成'))!.state as TreeState;
    expect(st.nodes['0']).toEqual({ id: '0', value: 1, leftId: '1', rightId: '2' });
    expect(st.nodes['1']).toEqual({ id: '1', value: 2, leftId: null, rightId: '4' });
    expect(st.nodes['2']).toEqual({ id: '2', value: 3, leftId: '5', rightId: null });
    expect(st.rootId).toBe('0');
  });
});

describe('二叉树遍历', () => {
  const tree = 'build 1,2,3,4,5,6,7';

  it('前序遍历（根→左→右）', () => {
    expect(traversalResult(`${tree} ; preorder`, '前序遍历完成')).toEqual([1, 2, 4, 5, 3, 6, 7]);
  });

  it('中序遍历（左→根→右）', () => {
    expect(traversalResult(`${tree} ; inorder`, '中序遍历完成')).toEqual([4, 2, 5, 1, 6, 3, 7]);
  });

  it('后序遍历（左→右→根）', () => {
    expect(traversalResult(`${tree} ; postorder`, '后序遍历完成')).toEqual([4, 5, 2, 6, 7, 3, 1]);
  });

  it('层序遍历（逐层）', () => {
    expect(traversalResult(`${tree} ; levelorder`, '层序遍历完成')).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('非满二叉树的中序遍历', () => {
    expect(traversalResult('build 1,2,3,null,4,5 ; inorder', '中序遍历完成')).toEqual([2, 4, 1, 5, 3]);
  });
});

describe('折半查找', () => {
  const arr = 'build 1,3,5,7,9,11,13,15';

  it('找到目标并返回正确下标', () => {
    const steps = collectSteps(binarySearchModule, parse(binarySearchModule, `${arr} ; search 7`));
    expect(steps.some((s) => s.description.includes('找到') && s.description.includes('下标为 3'))).toBe(true);
  });

  it('未找到目标', () => {
    const steps = collectSteps(binarySearchModule, parse(binarySearchModule, `${arr} ; search 8`));
    expect(steps.some((s) => s.description.includes('未找到'))).toBe(true);
  });

  it('查找区间逐步缩小（比较次数正确）', () => {
    const steps = collectSteps(binarySearchModule, parse(binarySearchModule, `${arr} ; search 7`));
    const found = steps.find((s) => s.description.includes('找到'))!;
    const st = found.state as ArrayState;
    expect(st.info?.比较次数).toBe(1); // 首轮 mid=3 直接命中
  });
});
