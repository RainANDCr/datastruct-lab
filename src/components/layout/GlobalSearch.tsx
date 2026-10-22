import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { cn } from 'cn';
import { Input } from '@/components/ui/input';
import { CHAPTERS } from '@/data/chapters';
import { getAlgorithmMeta } from '@/engine/registry';
import type { ChapterId } from '@/engine/types';

interface SearchItem {
  id: string;
  name: string;
  chapterId: ChapterId;
  chapterTitle: string;
  implemented: boolean;
}

const ALL_ITEMS: SearchItem[] = CHAPTERS.flatMap((chapter) =>
  chapter.algorithms.map((a) => ({
    id: a.id,
    name: a.name,
    chapterId: chapter.id,
    chapterTitle: chapter.shortTitle,
    implemented: Boolean(getAlgorithmMeta(a.id)),
  })),
);

export function GlobalSearch({ className }: { className?: string }) {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const navigate = useNavigate();
  const rootRef = useRef<HTMLDivElement | null>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return ALL_ITEMS.filter(
      (item) =>
        item.name.toLowerCase().includes(q) || item.chapterTitle.toLowerCase().includes(q),
    ).slice(0, 8);
  }, [query]);

  useEffect(() => {
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFocused(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const open = focused && query.trim().length > 0;

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setFocused(true)}
        placeholder="搜索算法…"
        className="h-9 pl-8"
      />
      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border bg-popover shadow-lg">
          {results.length === 0 ? (
            <div className="px-3 py-4 text-center text-sm text-muted-foreground">
              未找到相关算法
            </div>
          ) : (
            <ul className="max-h-80 overflow-auto py-1">
              {results.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    disabled={!item.implemented}
                    onClick={() => {
                      if (!item.implemented) return;
                      setFocused(false);
                      setQuery('');
                      navigate(`/algorithm/${item.id}`);
                    }}
                    className={cn(
                      'flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm',
                      item.implemented
                        ? 'hover:bg-accent'
                        : 'cursor-not-allowed opacity-50',
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <span className="font-medium">{item.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {item.chapterTitle}
                      </span>
                    </span>
                    {!item.implemented && (
                      <span className="text-xs text-muted-foreground">开发中</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
