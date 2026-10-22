import {
  BarChart3,
  BookOpen,
  GitBranch,
  Grid3x3,
  Layers,
  List as ListIcon,
  Search as SearchIcon,
  Share2,
  Type,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ChapterId } from '@/engine/types';

/** 章节图标映射（侧边栏与首页共用） */
export const CHAPTER_ICONS: Record<ChapterId, LucideIcon> = {
  intro: BookOpen,
  'linear-list': ListIcon,
  'stack-queue': Layers,
  string: Type,
  array: Grid3x3,
  tree: GitBranch,
  graph: Share2,
  search: SearchIcon,
  sorting: BarChart3,
};
