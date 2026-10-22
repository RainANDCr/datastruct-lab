import { Link } from 'react-router-dom';
import { Binary, Menu, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { getAllAlgorithmMeta } from '@/engine/registry';
import { useProgress } from '@/stores/progress';
import { useSettings } from '@/stores/settings';
import { GlobalSearch } from './GlobalSearch';

function GitHubMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

export function TopNav({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const theme = useSettings((s) => s.theme);
  const toggleTheme = useSettings((s) => s.toggleTheme);
  const learned = useProgress((s) => s.learned);

  const metas = getAllAlgorithmMeta();
  const total = metas.length;
  const learnedCount = metas.filter((m) => learned[m.id]).length;
  const percent = total > 0 ? Math.round((learnedCount / total) * 100) : 0;

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-3">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={onToggleSidebar}
      >
        <Menu />
      </Button>

      <Link to="/" className="flex shrink-0 items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Binary className="size-5" />
        </span>
        <span className="text-base font-semibold tracking-tight">
          DataStruct<span className="text-primary"> Lab</span>
        </span>
      </Link>

      <GlobalSearch className="mx-2 hidden max-w-md flex-1 sm:block" />

      <div className="ml-auto flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="mr-1 hidden items-center gap-2 md:flex">
              <div className="text-xs tabular-nums text-muted-foreground">
                进度 {learnedCount}/{total}
              </div>
              <Progress value={percent} className="w-20" />
            </div>
          </TooltipTrigger>
          <TooltipContent>总体学习进度</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {theme === 'dark' ? <Sun /> : <Moon />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{theme === 'dark' ? '切换到浅色' : '切换到深色'}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" asChild>
              <a
                href="https://github.com/RainANDCr/datastruct-lab"
                target="_blank"
                rel="noreferrer"
                aria-label="GitHub"
              >
                <GitHubMark className="size-5" />
              </a>
            </Button>
          </TooltipTrigger>
          <TooltipContent>GitHub 仓库</TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
}
