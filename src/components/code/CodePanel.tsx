import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { AlgorithmMeta } from '@/engine/types';
import { CodeViewer } from './CodeViewer';

type TabKey = 'c' | 'cpp' | 'pseudocode' | 'principle' | 'complexity';

interface CodePanelProps {
  meta: AlgorithmMeta;
  highlightedLines: number[];
  variables?: Record<string, unknown>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-5">
      <h3 className="mb-2 text-sm font-semibold text-foreground">{title}</h3>
      {children}
    </section>
  );
}

function List({ items, numbered = false }: { items: string[]; numbered?: boolean }) {
  if (numbered) {
    return (
      <ol className="list-decimal space-y-1 pl-5 text-sm leading-relaxed text-muted-foreground">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ol>
    );
  }
  return (
    <ul className="space-y-1 text-sm leading-relaxed text-muted-foreground">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2">
          <span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-primary/60" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function CodePanel({ meta, highlightedLines, variables }: CodePanelProps) {
  const [tab, setTab] = useState<TabKey>('cpp');
  const [copied, setCopied] = useState(false);

  const isCodeTab = tab === 'c' || tab === 'cpp' || tab === 'pseudocode';

  const copy = async () => {
    const text =
      tab === 'c' ? meta.code.c : tab === 'cpp' ? meta.code.cpp : meta.code.pseudocode;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* 剪贴板不可用时静默忽略 */
    }
  };

  const hasVariables = variables && Object.keys(variables).length > 0;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <h2 className="text-sm font-semibold">代码与知识</h2>
        {isCodeTab && (
          <Button variant="ghost" size="sm" onClick={copy}>
            {copied ? <Check /> : <Copy />}
            {copied ? '已复制' : '复制'}
          </Button>
        )}
      </div>

      {hasVariables && (
        <div className="flex flex-wrap gap-1.5 border-b px-3 py-2">
          {Object.entries(variables!).map(([key, value]) => (
            <div key={key} className="rounded-md bg-muted px-2 py-0.5 text-xs">
              <span className="text-muted-foreground">{key}</span>
              <span className="mx-1 text-muted-foreground/50">=</span>
              <span className="font-mono-code font-semibold text-foreground">
                {String(value)}
              </span>
            </div>
          ))}
        </div>
      )}

      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as TabKey)}
        className="flex min-h-0 flex-1 flex-col"
      >
        <TabsList className="mx-3 mt-2 grid w-fit grid-cols-5">
          <TabsTrigger value="c">C</TabsTrigger>
          <TabsTrigger value="cpp">C++</TabsTrigger>
          <TabsTrigger value="pseudocode">伪代码</TabsTrigger>
          <TabsTrigger value="principle">原理</TabsTrigger>
          <TabsTrigger value="complexity">复杂度</TabsTrigger>
        </TabsList>

        <ScrollArea className="min-h-0 flex-1">
          <TabsContent value="c" className="m-0">
            <CodeViewer code={meta.code.c} language="c" highlightedLines={highlightedLines} />
          </TabsContent>
          <TabsContent value="cpp" className="m-0">
            <CodeViewer code={meta.code.cpp} language="cpp" highlightedLines={highlightedLines} />
          </TabsContent>
          <TabsContent value="pseudocode" className="m-0">
            <CodeViewer
              code={meta.code.pseudocode}
              language="text"
              highlightedLines={highlightedLines}
            />
          </TabsContent>

          <TabsContent value="principle" className="m-0 px-4 py-4">
            <Section title="核心思想">
              <p className="text-sm leading-relaxed text-muted-foreground">{meta.coreIdea}</p>
            </Section>
            <Section title="操作步骤">
              <List items={meta.operationSteps} numbered />
            </Section>
            {meta.variableDocs && meta.variableDocs.length > 0 && (
              <Section title="关键变量">
                <div className="space-y-1">
                  {meta.variableDocs.map((v) => (
                    <div key={v.name} className="flex items-baseline gap-2 text-sm">
                      <code className="font-mono-code rounded bg-muted px-1.5 py-0.5 text-[13px] text-foreground">
                        {v.name}
                      </code>
                      <span className="text-muted-foreground">{v.meaning}</span>
                    </div>
                  ))}
                </div>
              </Section>
            )}
            <Section title="适用场景">
              <List items={meta.useCases} />
            </Section>
            <Section title="优点与缺点">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="mb-1 text-xs font-medium text-green-600 dark:text-green-400">优点</p>
                  <List items={meta.pros} />
                </div>
                <div>
                  <p className="mb-1 text-xs font-medium text-red-600 dark:text-red-400">缺点</p>
                  <List items={meta.cons} />
                </div>
              </div>
            </Section>
            <Section title="常见考试知识点">
              <List items={meta.examPoints} />
            </Section>
          </TabsContent>

          <TabsContent value="complexity" className="m-0 px-4 py-4">
            <Section title="复杂度分析">
              <div className="overflow-hidden rounded-lg border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/60 text-left">
                      <th className="px-3 py-2 font-medium">指标</th>
                      <th className="px-3 py-2 font-medium">值</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t">
                      <td className="px-3 py-2 text-muted-foreground">最好时间复杂度</td>
                      <td className="px-3 py-2 font-mono-code">{meta.complexity.time.best}</td>
                    </tr>
                    <tr className="border-t">
                      <td className="px-3 py-2 text-muted-foreground">平均时间复杂度</td>
                      <td className="px-3 py-2 font-mono-code">{meta.complexity.time.average}</td>
                    </tr>
                    <tr className="border-t">
                      <td className="px-3 py-2 text-muted-foreground">最坏时间复杂度</td>
                      <td className="px-3 py-2 font-mono-code">{meta.complexity.time.worst}</td>
                    </tr>
                    <tr className="border-t">
                      <td className="px-3 py-2 text-muted-foreground">空间复杂度</td>
                      <td className="px-3 py-2 font-mono-code">{meta.complexity.space}</td>
                    </tr>
                    {meta.stable !== undefined && (
                      <tr className="border-t">
                        <td className="px-3 py-2 text-muted-foreground">稳定性</td>
                        <td className="px-3 py-2">
                          <Badge variant={meta.stable ? 'secondary' : 'outline'}>
                            {meta.stable ? '稳定' : '不稳定'}
                          </Badge>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Section>
            <Section title="优点与缺点">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="mb-1 text-xs font-medium text-green-600 dark:text-green-400">优点</p>
                  <List items={meta.pros} />
                </div>
                <div>
                  <p className="mb-1 text-xs font-medium text-red-600 dark:text-red-400">缺点</p>
                  <List items={meta.cons} />
                </div>
              </div>
            </Section>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}
