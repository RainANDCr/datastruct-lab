/**
 * 图章节算法注册入口。
 */
import { registerAlgorithm } from '@/engine/registry';
import { adjListModule } from './adj-list';
import { adjMatrixModule } from './adj-matrix';
import { bfsModule } from './bfs';
import { criticalPathModule } from './critical-path';
import { dfsModule } from './dfs';
import { dijkstraModule } from './dijkstra';
import { floydModule } from './floyd';
import { kruskalModule } from './kruskal';
import { primModule } from './prim';
import { topologicalModule } from './topological';

registerAlgorithm(adjMatrixModule);
registerAlgorithm(adjListModule);
registerAlgorithm(dfsModule);
registerAlgorithm(bfsModule);
registerAlgorithm(primModule);
registerAlgorithm(kruskalModule);
registerAlgorithm(dijkstraModule);
registerAlgorithm(floydModule);
registerAlgorithm(topologicalModule);
registerAlgorithm(criticalPathModule);
