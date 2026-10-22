import { describe, expect, it } from 'vitest';
import { bracketMatchingModule } from '@/algorithms/stack-queue/bracket-matching';
import { expressionEvalModule } from '@/algorithms/stack-queue/expression-eval';
import { kmpModule } from '@/algorithms/string/kmp';
import { huffmanCodingModule } from '@/algorithms/tree/huffman-coding';
import { symmetricModule, tridiagonalModule } from '@/algorithms/array/compressed';
import { preorderModule, inorderModule, postorderModule, levelorderModule } from '@/algorithms/tree/traversal-modules';
import type { StringState } from '@/algorithms/string/types';
import type { MatrixState } from '@/algorithms/array/types';
import type { TreeState } from '@/algorithms/tree/types';
import { collectSteps } from '@/engine/step-generator';

function parse<T>(mod: { parseInput: (s: string) => { ok: true; value: T } | { ok: false } }, input: string): T {
  const r = mod.parseInput(input);
  if (!r.ok) throw new Error('parse failed');
  return r.value;
}

describe('括号匹配', () => {
  it('配对正确', () => {
    const steps = collectSteps(bracketMatchingModule, parse(bracketMatchingModule, '(a+b)*[c-d]'));
    expect(steps.some((s) => s.description.includes('匹配正确'))).toBe(true);
  });
  it('不配对报错', () => {
    const steps = collectSteps(bracketMatchingModule, parse(bracketMatchingModule, '(a+b))'));
    expect(steps.some((s) => s.description.includes('不匹配'))).toBe(true);
  });
});

describe('表达式求值', () => {
  it('中缀转后缀并求值正确', () => {
    const steps = collectSteps(expressionEvalModule, parse(expressionEvalModule, '3+4*2/(1-5)'));
    const done = steps[steps.length - 1];
    expect((done.state as StringState).info?.结果).toBe(1);
  });
});

describe('KMP', () => {
  it('next 数组计算正确', () => {
    const steps = collectSteps(kmpModule, parse(kmpModule, 'text ABABCABAB ; pattern ABABCABAB'));
    const nextStep = steps.find((s) => s.id === 'next-done');
    expect(nextStep).toBeDefined();
    // 模式 ABABCABAB，next[0]=-1
    expect((nextStep!.state as StringState).nextArray![0]).toBe(-1);
  });
  it('匹配成功', () => {
    const steps = collectSteps(kmpModule, parse(kmpModule, 'text ABABDABACDABABCABAB ; pattern ABABCABAB'));
    expect(steps.some((s) => s.description.includes('匹配成功'))).toBe(true);
  });
});

describe('哈夫曼编码', () => {
  it('编码非空且覆盖所有字符', () => {
    const steps = collectSteps(huffmanCodingModule, parse(huffmanCodingModule, 'A:5, B:3, C:2, D:4'));
    const codes = steps.find((s) => s.id === 'codes');
    expect(codes).toBeDefined();
    const ids = (codes!.state as TreeState).aux?.ids ?? [];
    expect(ids.length).toBe(4);
  });
});

describe('矩阵压缩', () => {
  it('对称矩阵下三角压缩', () => {
    const steps = collectSteps(symmetricModule, parse(symmetricModule, '1,2,3 ; 2,4,5 ; 3,5,6'));
    const done = steps[steps.length - 1].state as MatrixState;
    // 下三角：1,2,4,3,5,6
    expect(done.storage).toEqual([1, 2, 4, 3, 5, 6]);
  });
  it('三对角矩阵压缩（3n-2）', () => {
    const steps = collectSteps(tridiagonalModule, parse(tridiagonalModule, '1,2,0,0 ; 3,4,5,0 ; 0,6,7,8 ; 0,0,9,10'));
    const done = steps[steps.length - 1].state as MatrixState;
    expect(done.storage!.length).toBe(10); // 3*4-2
  });
});

describe('树遍历独立模块', () => {
  const INPUT = 'build 1,2,3,4,5,6,7';
  const run = (mod: { parseInput: (s: string) => { ok: true; value: unknown } | { ok: false } }, traversal: string): number[] => {
    const steps = collectSteps(mod as never, parse(mod, `${INPUT} ; ${traversal}`));
    const done = steps.find((s) => s.description.includes('遍历完成'));
    const st = done!.state as TreeState;
    return (st.visitOrder ?? []).map((id) => st.nodes[id].value);
  };

  it('前序遍历正确', () => {
    expect(run(preorderModule, 'preorder')).toEqual([1, 2, 4, 5, 3, 6, 7]);
  });
  it('中序遍历正确', () => {
    expect(run(inorderModule, 'inorder')).toEqual([4, 2, 5, 1, 6, 3, 7]);
  });
  it('后序遍历正确', () => {
    expect(run(postorderModule, 'postorder')).toEqual([4, 5, 2, 6, 7, 3, 1]);
  });
  it('层序遍历正确', () => {
    expect(run(levelorderModule, 'levelorder')).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });
});
