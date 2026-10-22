import { Highlight, themes, type Language } from 'prism-react-renderer';
import { useSettings } from '@/stores/settings';
import { cn } from 'cn';

interface CodeViewerProps {
  code: string;
  language: 'c' | 'cpp' | 'text';
  highlightedLines: number[];
  className?: string;
}

/**
 * 轻量只读代码高亮组件，支持逐行高亮（与算法步骤同步）。
 */
export function CodeViewer({ code, language, highlightedLines, className }: CodeViewerProps) {
  const theme = useSettings((s) => s.theme);
  const prismTheme = theme === 'dark' ? themes.oneDark : themes.oneLight;
  const highlightSet = new Set(highlightedLines);

  return (
    <Highlight theme={prismTheme} code={code} language={language as Language}>
      {({ style, tokens, getTokenProps }) => (
        <pre
          className={cn('m-0 overflow-x-auto p-2 text-[13px] leading-6', className)}
          style={{ background: style.background }}
        >
          {tokens.map((line, i) => {
            const lineNumber = i + 1;
            const highlighted = highlightSet.has(lineNumber);
            return (
              <div
                key={lineNumber}
                className={cn(
                  'flex',
                  highlighted && 'bg-primary/15 shadow-[inset_3px_0_0_0_var(--color-primary)]',
                )}
              >
                <span
                  className="w-9 shrink-0 select-none pr-3 text-right"
                  style={{ color: style.color, opacity: 0.45 }}
                >
                  {lineNumber}
                </span>
                <span className="whitespace-pre">
                  {line.map((token, key) => (
                    <span key={key} {...getTokenProps({ token })} />
                  ))}
                </span>
              </div>
            );
          })}
        </pre>
      )}
    </Highlight>
  );
}
