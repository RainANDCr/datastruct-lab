import { describe, expect, it } from 'vitest';
import { CHAPTERS } from '@/data/chapters';
import { getAlgorithm, getAlgorithmMeta } from '@/engine/registry';
import { collectSteps } from '@/engine/step-generator';
import '@/algorithms';

describe('章节完整性', () => {
  it('所有章节目录登记的算法均已实现', () => {
    const missing: string[] = [];
    let total = 0;
    for (const ch of CHAPTERS) {
      for (const alg of ch.algorithms) {
        total += 1;
        const meta = getAlgorithmMeta(alg.id);
        if (!meta || !meta.implemented) missing.push(alg.id);
      }
    }
    expect(missing).toEqual([]);
    expect(total).toBeGreaterThan(50);
  });
});

describe('状态快照独立性', () => {
  // 这些算法在 yield 之间会逐步修改 nodes/vertices 结构，
  // 必须保证每一步持有独立快照，否则中间动画丢失（回放时看到的是最终态）。
  const STRUCTURAL_IDS = [
    'tree.general',
    'tree.create-delete',
    'tree.huffman-tree',
    'tree.huffman-coding',
    'tree.threaded',
    'array.generalized-list',
    'search.bst',
    'search.avl',
    'graph.dfs',
    'graph.bfs',
    'graph.prim',
    'graph.dijkstra',
    'graph.kruskal',
    'graph.floyd',
    'graph.topological',
    'graph.critical-path',
    'graph.adj-list',
  ];

  it('结构性算法每一步状态为独立快照（不共享引用）', () => {
    for (const id of STRUCTURAL_IDS) {
      const mod = getAlgorithm(id);
      expect(mod, `${id} 应已注册`).toBeDefined();
      if (!mod) continue;
      const parsed = mod.parseInput(mod.meta.defaultInput);
      expect(parsed.ok, `${id} 默认输入应可解析`).toBe(true);
      if (!parsed.ok) continue;

      const steps = collectSteps(mod, parsed.value);
      expect(steps.length).toBeGreaterThan(1);

      const first = steps[0].state as Record<string, unknown>;
      const last = steps[steps.length - 1].state as Record<string, unknown>;

      // 首步应为空结构，末步应有内容（证明动画有从空到满的推进过程）
      if ('nodes' in first) {
        const firstNodes = first.nodes as Record<string, unknown>;
        const lastNodes = last.nodes as Record<string, unknown>;
        expect(Object.keys(firstNodes).length, `${id} 首步应为空树`).toBe(0);
        expect(Object.keys(lastNodes).length, `${id} 末步应有节点`).toBeGreaterThan(0);
        expect(first.nodes).not.toBe(last.nodes);
      }
      if ('vertices' in first) {
        const firstV = first.vertices as Record<string, unknown>;
        const lastV = last.vertices as Record<string, unknown>;
        expect(Object.keys(firstV).length, `${id} 首步应为空图`).toBe(0);
        expect(Object.keys(lastV).length, `${id} 末步应有顶点`).toBeGreaterThan(0);
        expect(first.vertices).not.toBe(last.vertices);
      }
    }
  });
});
