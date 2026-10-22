/**
 * 自动播放驱动：在「播放中」状态下按速度推进游标。
 *
 * 说明：算法步骤在加载时已全部生成完毕，本 Hook 仅负责按时钟推进游标，
 * 不使用 setTimeout 模拟算法逻辑，播放速度不影响算法正确性。
 */
import { useEffect } from 'react';
import { usePlayer } from '@/stores/player';

/** 1x 速度下的基准步进时长（毫秒） */
const BASE_STEP_MS = 800;
/** 单步最小/最大时长，避免极端速度下闪烁或卡顿 */
const MIN_STEP_MS = 60;
const MAX_STEP_MS = 4000;

export function useAutoPlay(): void {
  const isPlaying = usePlayer((s) => s.isPlaying);
  const speed = usePlayer((s) => s.speed);
  const currentStep = usePlayer((s) => s.steps[s.currentIndex]);
  const stepForward = usePlayer((s) => s.stepForward);

  useEffect(() => {
    if (!isPlaying) return;

    const raw = currentStep?.duration ? currentStep.duration / speed : BASE_STEP_MS / speed;
    const delay = Math.max(MIN_STEP_MS, Math.min(MAX_STEP_MS, raw));

    const timer = window.setTimeout(() => stepForward(), delay);
    return () => window.clearTimeout(timer);
  }, [isPlaying, speed, currentStep, stepForward]);
}
