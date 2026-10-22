import { describe, expect, it } from 'vitest';
import { bfsModule } from '@/algorithms/graph/bfs';
import { dfsModule } from '@/algorithms/graph/dfs';
import type { GraphState } from '@/algorithms/graph/types';
import type { AlgorithmModule } from '@/engine/types';
import { collectSteps } from '@/engine/step-generator';

function parse<T>(mod: { parseInput: (s: string) => { ok: true; value: T } | { ok: false } }, input: string): T {
  const r = mod.parseInput(input);
  if (!r.ok) throw new Error('parse failed');
  return r.value;
}

function traversalOrder<TInput>(mod: AlgorithmModule<GraphState, TInput>, input: string, keyword: string): string[] {
  const steps = collectSteps(mod, parse(mod, input));
  const done = steps.find((s) => s.description.includes(keyword));
  expect(done).toBeDefined();
  return (done!.state as GraphState).visitOrder ?? [];
}

const GRAPH = 'build A,B,C,D,E,F,G ; edge A-B, A-C, B-D, B-E, C-F, C-G';

describe('图构建', () => {
  it('build 与 edge 正确创建顶点和边', () => {
    const steps = collectSteps(dfsModule, parse(dfsModule, 'build A,B,C ; edge A-B, B-C'));
    const st = steps[steps.length - 1].state as GraphState;
    expect(Object.keys(st.vertices).sort()).toEqual(['A', 'B', 'C']);
    expect(Object.keys(st.edges).sort()).toEqual(['A-B', 'B-C']);
  });

  it('边未显式声明的顶点自动创建', () => {
    const steps = collectSteps(dfsModule, parse(dfsModule, 'edge A-B, B-C'));
    const st = steps[steps.length - 1].state as GraphState;
    expect(Object.keys(st.vertices).sort()).toEqual(['A', 'B', 'C']);
  });
});

describe('深度优先搜索 DFS', () => {
  it('访问顺序正确（先深后广）', () => {
    expect(traversalOrder(dfsModule, `${GRAPH} ; dfs A`, 'DFS 完成')).toEqual(['A', 'B', 'D', 'E', 'C', 'F', 'G']);
  });

  it('起始顶点不存在时报错提示', () => {
    const steps = collectSteps(dfsModule, parse(dfsModule, 'build A,B ; dfs Z'));
    expect(steps.some((s) => s.description.includes('不存在'))).toBe(true);
  });
});

describe('广度优先搜索 BFS', () => {
  it('访问顺序正确（按层扩展）', () => {
    expect(traversalOrder(bfsModule, `${GRAPH} ; bfs A`, 'BFS 完成')).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G']);
  });
});
