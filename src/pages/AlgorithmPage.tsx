import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Check, Code2, Maximize, Minimize, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { CodePanel } from '@/components/code/CodePanel';
import { ControlBar } from '@/components/controls/ControlBar';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ColorLegend } from '@/components/visualization/ColorLegend';
import { Visualizer } from '@/components/visualization/Visualizer';
import { getAlgorithm } from '@/engine/registry';
import { collectSteps } from '@/engine/step-generator';
import { useAutoPlay } from '@/hooks/useAutoPlay';
import { usePlayer } from '@/stores/player';
import { useProgress } from '@/stores/progress';

export function AlgorithmPage() {
  const { id = '' } = useParams();
  const module = getAlgorithm(id);

  const load = usePlayer((s) => s.load);
  const activeAlgorithmId = usePlayer((s) => s.algorithmId);
  const currentStep = usePlayer((s) => s.steps[s.currentIndex]);
  const togglePlay = usePlayer((s) => s.togglePlay);
  const stepBack = usePlayer((s) => s.stepBack);
  const stepForward = usePlayer((s) => s.stepForward);

  /**
   * 步骤序列是否已属于当前算法。
   *
   * player store 是全局的，切换算法时「首次渲染」发生在 useEffect 的 load() 之前，
   * 此帧仍持有上一个算法的状态快照。若直接用当前算法的渲染器渲染旧状态，
   * 会因字段结构不匹配抛错（如 TreeView 收到排序状态 → Object.values(undefined)）。
   * 因此在就绪前不渲染画布，从根源上消除这类「脏帧」异常。
   */
  const stepsReady = activeAlgorithmId === id && currentStep !== undefined;

  const learned = useProgress((s) => s.learned[id]);
  const toggleLearned = useProgress((s) => s.toggleLearned);

  const [rawInput, setRawInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [codeOpen, setCodeOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const canvasRef = useRef<HTMLDivElement | null>(null);

  useAutoPlay();

  const run = useCallback(
    (raw: string) => {
      if (!module) return;
      const parsed = module.parseInput(raw);
      if (!parsed.ok) {
        setError(parsed.error);
        return;
      }
      setError(null);
      const steps = collectSteps(module, parsed.value);
      load(module.meta.id, steps);
    },
    [module, load],
  );

  // 首次进入 / 切换算法时，用默认输入重建步骤序列
  useEffect(() => {
    if (!module) return;
    setRawInput(module.meta.defaultInput);
    run(module.meta.defaultInput);
    setCodeOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [module]);

  // 键盘快捷键：空格播放/暂停，←/→ 上/下一步
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowRight') {
        stepForward();
      } else if (e.code === 'ArrowLeft') {
        stepBack();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [togglePlay, stepBack, stepForward]);

  // 全屏
  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggleFullscreen = () => {
    const el = canvasRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void el.requestFullscreen();
    }
  };

  if (!module) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <Badge variant="outline" className="mb-3">
            开发中
          </Badge>
          <h1 className="text-lg font-semibold">该算法尚未实现</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            模块 <code className="font-mono-code">{id}</code> 正在开发中，敬请期待。
          </p>
        </div>
      </div>
    );
  }

  const meta = module.meta;
  const inputField = meta.inputSchema[0];

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex min-h-0 flex-1">
        {/* 主区域：工具栏 + 画布 */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* 工具栏 */}
          <div className="border-b px-3 py-2">
            <div className="flex items-center gap-2">
              <h1 className="shrink-0 text-sm font-semibold">{meta.name}</h1>
              <Badge variant="secondary" className="hidden sm:inline-flex">
                {meta.nameEn}
              </Badge>
              <div className="ml-auto flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={learned ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => toggleLearned(id)}
                      className="gap-1"
                    >
                      <Check className={learned ? 'text-green-500' : ''} />
                      <span className="hidden sm:inline">{learned ? '已学习' : '标记已学'}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>标记学习进度</TooltipContent>
                </Tooltip>

                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  onClick={() => setCodeOpen(true)}
                >
                  <Code2 />
                </Button>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={toggleFullscreen}>
                      {isFullscreen ? <Minimize /> : <Maximize />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{isFullscreen ? '退出全屏' : '全屏查看'}</TooltipContent>
                </Tooltip>
              </div>
            </div>

            <div className="mt-2 flex items-center gap-2">
              <label className="shrink-0 text-xs text-muted-foreground">
                {inputField?.label ?? '输入'}
              </label>
              <Input
                value={rawInput}
                onChange={(e) => setRawInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') run(rawInput);
                }}
                placeholder={inputField?.placeholder}
                className="h-8 font-mono-code text-sm"
              />
              <Button size="sm" onClick={() => run(rawInput)}>
                运行
              </Button>
            </div>
            {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
          </div>

          {/* 步骤说明 */}
          <div className="border-b bg-muted/40 px-3 py-1.5 text-sm text-foreground">
            <span className="text-muted-foreground">当前步骤：</span>
            {stepsReady ? currentStep?.description : '正在生成步骤…'}
          </div>

          {/* 图例（排序画布用，独立于画布内容，避免与柱/索引重叠） */}
          {meta.visualizer === 'bars' && (
            <div className="border-b bg-background px-3 py-1.5">
              <ColorLegend />
            </div>
          )}

          {/* 画布 */}
          <div ref={canvasRef} className="relative min-h-0 flex-1 overflow-hidden">
            {stepsReady ? (
              <ErrorBoundary key={meta.id} title="画布渲染失败">
                <Visualizer
                  kind={meta.visualizer}
                  state={currentStep.state}
                  memory={currentStep.memory}
                />
              </ErrorBoundary>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                正在生成步骤…
              </div>
            )}
          </div>
        </div>

        {/* 右侧代码与知识面板（桌面端） */}
        <aside className="hidden w-[380px] shrink-0 border-l lg:block">
          <CodePanel
            meta={meta}
            highlightedLines={stepsReady ? (currentStep?.highlightedLines ?? []) : []}
            variables={stepsReady ? currentStep?.variables : undefined}
          />
        </aside>
      </div>

      <ControlBar disabled={!stepsReady} />

      {/* 移动端代码面板（抽屉） */}
      {codeOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setCodeOpen(false)} />
          <div className="absolute inset-y-0 right-0 flex w-[min(92vw,420px)] flex-col bg-background shadow-xl">
            <div className="flex items-center justify-between border-b px-3 py-2">
              <span className="text-sm font-semibold">代码与知识</span>
              <Button variant="ghost" size="icon" onClick={() => setCodeOpen(false)}>
                <X />
              </Button>
            </div>
            <div className="min-h-0 flex-1">
              <CodePanel
                meta={meta}
                highlightedLines={stepsReady ? (currentStep?.highlightedLines ?? []) : []}
                variables={stepsReady ? currentStep?.variables : undefined}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
