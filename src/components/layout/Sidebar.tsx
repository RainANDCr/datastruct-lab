import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Check, ChevronDown, Search as SearchIcon } from 'lucide-react';
import { cn } from 'cn';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CHAPTERS } from '@/data/chapters';
import { getAlgorithmMeta } from '@/engine/registry';
import type { ChapterId } from '@/engine/types';
import { CHAPTER_ICONS } from '@/lib/icons';
import { useProgress } from '@/stores/progress';

function useActiveAlgorithmId(): string | null {
  const location = useLocation();
  const match = location.pathname.match(/^\/algorithm\/(.+)$/);
  return match ? decodeURIComponent(match[1]) : null;
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const navigate = useNavigate();
  const activeId = useActiveAlgorithmId();
  const learned = useProgress((s) => s.learned);
  const [query, setQuery] = useState('');
  const [openChapters, setOpenChapters] = useState<Set<ChapterId>>(
    () => new Set(CHAPTERS.map((c) => c.id)),
  );

  const go = (id: string) => {
    navigate(`/algorithm/${id}`);
    onNavigate?.();
  };

  const toggleChapter = (id: ChapterId) => {
    setOpenChapters((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const q = query.trim().toLowerCase();
  const searchResults = useMemo(() => {
    if (!q) return null;
    return CHAPTERS.flatMap((chapter) =>
      chapter.algorithms
        .filter((a) => a.name.toLowerCase().includes(q))
        .map((a) => ({ ...a, chapter })),
    );
  }, [q]);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-3">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索算法"
            className="h-9 pl-8"
          />
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <nav className="p-2">
          {searchResults !== null ? (
            searchResults.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                未找到相关算法
              </p>
            ) : (
              searchResults.map((item) => {
                const implemented = Boolean(getAlgorithmMeta(item.id));
                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled={!implemented}
                    onClick={() => implemented && go(item.id)}
                    className={cn(
                      'flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm',
                      implemented && 'hover:bg-accent',
                      !implemented && 'cursor-not-allowed opacity-50',
                    )}
                  >
                    <span>{item.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {item.chapter.shortTitle}
                    </span>
                  </button>
                );
              })
            )
          ) : (
            CHAPTERS.map((chapter) => {
              const Icon = CHAPTER_ICONS[chapter.id];
              const isOpen = openChapters.has(chapter.id);
              const implementedIn = chapter.algorithms.filter((a) =>
                getAlgorithmMeta(a.id),
              ).length;
              const learnedIn = chapter.algorithms.filter(
                (a) => getAlgorithmMeta(a.id) && learned[a.id],
              ).length;

              return (
                <div key={chapter.id} className="mb-0.5">
                  <button
                    type="button"
                    onClick={() => toggleChapter(chapter.id)}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left hover:bg-accent"
                  >
                    <Icon className="size-4 shrink-0 text-muted-foreground" />
                    <span className="flex-1 text-sm font-medium">{chapter.shortTitle}</span>
                    {implementedIn > 0 && (
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {learnedIn}/{implementedIn}
                      </span>
                    )}
                    <ChevronDown
                      className={cn(
                        'size-4 text-muted-foreground transition-transform',
                        !isOpen && '-rotate-90',
                      )}
                    />
                  </button>

                  {isOpen && (
                    <ul className="mb-1 ml-4 border-l pl-1">
                      {chapter.algorithms.map((algo) => {
                        const implemented = Boolean(getAlgorithmMeta(algo.id));
                        const isActive = activeId === algo.id;
                        const isLearned = learned[algo.id];
                        return (
                          <li key={algo.id}>
                            <button
                              type="button"
                              disabled={!implemented}
                              onClick={() => implemented && go(algo.id)}
                              className={cn(
                                'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm',
                                implemented && 'hover:bg-accent',
                                !implemented && 'cursor-not-allowed',
                                isActive && 'bg-primary/10 font-medium text-primary',
                              )}
                            >
                              <span
                                className={cn(
                                  'flex-1 truncate',
                                  !implemented && 'text-muted-foreground',
                                )}
                              >
                                {algo.name}
                              </span>
                              {implemented && isLearned && (
                                <Check className="size-3.5 shrink-0 text-green-500" />
                              )}
                              {!implemented && (
                                <Badge variant="outline" className="shrink-0 text-[10px]">
                                  开发中
                                </Badge>
                              )}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              );
            })
          )}
        </nav>
      </ScrollArea>
    </div>
  );
}

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <>
      <aside className="hidden w-[280px] shrink-0 border-r bg-sidebar md:flex md:flex-col">
        <SidebarContent />
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={onClose} />
          <aside className="absolute inset-y-0 left-0 w-[280px] bg-sidebar shadow-xl">
            <SidebarContent onNavigate={onClose} />
          </aside>
        </div>
      )}
    </>
  );
}
