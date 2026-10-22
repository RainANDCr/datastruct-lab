import { COLOR_LEGEND } from '@/utils/colors';

/**
 * 画布颜色语义图例。
 */
export function ColorLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {COLOR_LEGEND.map((item) => (
        <span key={item.key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span
            className="inline-block size-3 rounded-sm"
            style={{ backgroundColor: item.color }}
          />
          {item.label}
        </span>
      ))}
    </div>
  );
}
