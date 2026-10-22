import { Gauge, Pause, Play, RotateCcw, SkipBack, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { SPEED_OPTIONS, usePlayer, type Speed } from '@/stores/player';

/**
 * 底部动画控制栏：播放/暂停/上一步/下一步/重置/速度/进度条/步数。
 * @param disabled 外部强制禁用（如步骤尚未加载完成，避免操作到上一个算法的残留序列）
 */
export function ControlBar({ disabled: forceDisabled = false }: { disabled?: boolean }) {
  const isPlaying = usePlayer((s) => s.isPlaying);
  const currentIndex = usePlayer((s) => s.currentIndex);
  const steps = usePlayer((s) => s.steps);
  const speed = usePlayer((s) => s.speed);
  const togglePlay = usePlayer((s) => s.togglePlay);
  const stepBack = usePlayer((s) => s.stepBack);
  const stepForward = usePlayer((s) => s.stepForward);
  const reset = usePlayer((s) => s.reset);
  const seekTo = usePlayer((s) => s.seekTo);
  const setSpeed = usePlayer((s) => s.setSpeed);

  const total = steps.length;
  const disabled = total === 0 || forceDisabled;

  return (
    <div className="flex flex-col gap-1.5 border-t bg-background px-3 py-2 sm:gap-2">
      <div className="flex items-center gap-1.5 sm:gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={reset} disabled={disabled}>
              <RotateCcw />
            </Button>
          </TooltipTrigger>
          <TooltipContent>重置</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={stepBack}
              disabled={disabled || currentIndex <= 0}
            >
              <SkipBack />
            </Button>
          </TooltipTrigger>
          <TooltipContent>上一步</TooltipContent>
        </Tooltip>

        <Button
          variant="default"
          size="icon"
          onClick={togglePlay}
          disabled={disabled}
          className="size-9"
        >
          {isPlaying ? <Pause /> : <Play />}
        </Button>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={stepForward}
              disabled={disabled || currentIndex >= total - 1}
            >
              <SkipForward />
            </Button>
          </TooltipTrigger>
          <TooltipContent>下一步</TooltipContent>
        </Tooltip>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1 tabular-nums">
              <Gauge />
              {speed}x
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuRadioGroup
              value={String(speed)}
              onValueChange={(v) => setSpeed(Number(v) as Speed)}
            >
              {SPEED_OPTIONS.map((s) => (
                <DropdownMenuRadioItem key={s} value={String(s)} className="tabular-nums">
                  {s}x
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <span className="ml-auto whitespace-nowrap text-xs tabular-nums text-muted-foreground">
          {total > 0 ? `${currentIndex + 1} / ${total}` : '0 / 0'}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Slider
          value={[currentIndex]}
          min={0}
          max={Math.max(total - 1, 0)}
          step={1}
          onValueChange={([value]) => seekTo(value)}
          disabled={disabled}
          className="min-w-16 flex-1"
        />
      </div>
    </div>
  );
}
