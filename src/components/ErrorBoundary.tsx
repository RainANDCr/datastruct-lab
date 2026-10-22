import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** 错误提示的标题（默认「页面出错了」） */
  title?: string;
  /** 可选：重置回调（如重新导航到首页） */
  onReset?: () => void;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * 错误边界：隔离算法渲染或页面渲染的异常，避免单个模块崩溃导致整站白屏。
 * 用法：包在可能抛错的组件外层（如 <ErrorBoundary><Visualizer/></ErrorBoundary>）。
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // 保留日志，便于定位渲染错误（仅控制台输出，不打断用户）
    console.error('[DataStruct Lab] 渲染异常：', error, info.componentStack);
  }

  private reset = (): void => {
    this.setState({ error: null });
    this.props.onReset?.();
  };

  render(): ReactNode {
    if (this.state.error) {
      return (
        <div className="flex h-full min-h-[240px] w-full items-center justify-center p-6">
          <div className="max-w-sm text-center">
            <AlertTriangle className="mx-auto mb-3 size-10 text-destructive" />
            <h2 className="text-base font-semibold">{this.props.title ?? '页面出错了'}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              当前内容渲染时发生了异常。你可以尝试重试，或返回首页继续学习其他模块。
            </p>
            <p className="mt-2 line-clamp-2 text-xs text-muted-foreground/70">
              {this.state.error.message}
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <Button size="sm" onClick={this.reset}>
                <RotateCcw />
                重试
              </Button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
