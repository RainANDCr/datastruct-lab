import type { MemorySnapshot, VisualizerKind } from '@/engine/types';
import type { ComplexityState } from '@/algorithms/intro/types';
import type { ArrayState, LinkedListState } from '@/algorithms/linear-list/types';
import type { SortState } from '@/algorithms/sorting/types';
import type { GraphState } from '@/algorithms/graph/types';
import type { TreeState } from '@/algorithms/tree/types';
import type { HashState } from '@/algorithms/search/types';
import type { StringState } from '@/algorithms/string/types';
import type { MatrixState } from '@/algorithms/array/types';
import { ArrayView } from './ArrayView';
import { BarsCanvas } from './BarsCanvas';
import { ComplexityChart } from './ComplexityChart';
import { GraphView } from './GraphView';
import { HashView } from './HashView';
import { LinkedListView } from './LinkedListView';
import { MatrixView } from './MatrixView';
import { StringView } from './StringView';
import { TreeView } from './TreeView';

interface VisualizerProps {
  kind: VisualizerKind;
  state: unknown;
  memory?: MemorySnapshot;
}

function UnimplementedVisualizer({ kind }: { kind: string }) {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <div className="mb-2 rounded-md border border-dashed px-3 py-1 text-xs text-muted-foreground">
          渲染器「{kind}」开发中
        </div>
        <p className="text-sm text-muted-foreground">该可视化的画布将在后续阶段实现。</p>
      </div>
    </div>
  );
}

/**
 * 可视化渲染分发：根据算法声明的渲染器种类选择画布组件。
 * 算法层只生成状态，渲染逻辑集中在此处（UI 层）。
 */
export function Visualizer({ kind, state, memory }: VisualizerProps) {
  switch (kind) {
    case 'bars':
      return <BarsCanvas state={state as SortState} />;
    case 'chart':
      return <ComplexityChart state={state as ComplexityState} />;
    case 'array':
    case 'stack':
    case 'queue':
      return <ArrayView state={state as ArrayState} />;
    case 'linked-list':
      return <LinkedListView state={state as LinkedListState} memory={memory} />;
    case 'tree':
      return <TreeView state={state as TreeState} />;
    case 'graph':
      return <GraphView state={state as GraphState} />;
    case 'hash':
      return <HashView state={state as HashState} />;
    case 'string':
      return <StringView state={state as StringState} />;
    case 'matrix':
      return <MatrixView state={state as MatrixState} />;
    default:
      return <UnimplementedVisualizer kind={kind} />;
  }
}
