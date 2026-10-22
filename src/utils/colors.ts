/**
 * 画布统一颜色语义（见 PLAN.md 第 8 节）
 * 默认节点=蓝；当前访问=黄；比较中=橙；已完成=绿；删除/错误=红。
 */
export const COLORS = {
  default: '#3b82f6', // 蓝色 默认节点
  current: '#facc15', // 黄色 当前访问节点
  comparing: '#f97316', // 橙色 正在比较节点
  done: '#22c55e', // 绿色 已完成节点
  error: '#ef4444', // 红色 删除/错误状态
  pivot: '#a855f7', // 紫色 基准元素（快排）
} as const;

export type ColorKey = keyof typeof COLORS;

/** 画布语义颜色图例（按规范顺序） */
export const COLOR_LEGEND: { key: ColorKey; label: string; color: string }[] = [
  { key: 'default', label: '默认节点', color: COLORS.default },
  { key: 'current', label: '当前访问', color: COLORS.current },
  { key: 'comparing', label: '比较中', color: COLORS.comparing },
  { key: 'done', label: '已完成', color: COLORS.done },
  { key: 'pivot', label: '基准元素', color: COLORS.pivot },
  { key: 'error', label: '删除/错误', color: COLORS.error },
];
