import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Binary,
  Boxes,
  Cpu,
  GitBranch,
  Layers,
  MemoryStick,
  Sparkles,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CHAPTERS } from '@/data/chapters';
import { getAlgorithmMeta, getAllAlgorithmMeta } from '@/engine/registry';
import { CHAPTER_ICONS } from '@/lib/icons';

export function HomePage() {
  const navigate = useNavigate();

  const implemented = getAllAlgorithmMeta();
  const totalPlanned = CHAPTERS.reduce((sum, c) => sum + c.algorithms.length, 0);

  return (
    <div className="h-full overflow-auto">
      <div className="mx-auto max-w-5xl px-6 py-10">
        {/* Hero */}
        <section className="mb-10">
          <div className="mb-4 flex items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              <Sparkles className="size-3.5" />
              数据结构与算法可视化学习平台
            </Badge>
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            把抽象的数据结构
            <br />
            <span className="text-primary">变成看得见的动画</span>
          </h1>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            覆盖高校《数据结构》教材九章内容。真实算法驱动动画、同步高亮代码行、
            支持单步回溯，并逐步引入 C/C++ 指针与堆内存的可视化。
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Button onClick={() => navigate('/algorithm/sorting.bubble')}>
              开始学习
              <ArrowRight />
            </Button>
            <div className="flex gap-6 text-sm">
              <div>
                <div className="text-2xl font-bold tabular-nums">{CHAPTERS.length}</div>
                <div className="text-muted-foreground">章内容</div>
              </div>
              <div>
                <div className="text-2xl font-bold tabular-nums">{implemented.length}</div>
                <div className="text-muted-foreground">已实现算法</div>
              </div>
              <div>
                <div className="text-2xl font-bold tabular-nums">{totalPlanned}</div>
                <div className="text-muted-foreground">规划模块</div>
              </div>
            </div>
          </div>
        </section>

        {/* 核心特色 */}
        <section className="mb-10 grid gap-4 sm:grid-cols-3">
          {[
            {
              icon: Cpu,
              title: '真实算法驱动',
              desc: '所有动画由算法逐步产生的状态快照驱动，可任意前进、后退与跳转。',
            },
            {
              icon: Layers,
              title: '代码与动画同步',
              desc: '执行过程与 C / C++ / 伪代码逐行高亮同步，变量值实时呈现。',
            },
            {
              icon: MemoryStick,
              title: '内存结构可视化',
              desc: '链表等模块展示指针变量与堆内存节点关系，直观理解 new、指针赋值与 free。',
            },
          ].map((f) => (
            <Card key={f.title}>
              <CardHeader>
                <f.icon className="size-5 text-primary" />
                <CardTitle className="text-base">{f.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{f.desc}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </section>

        {/* 章节目录 */}
        <section>
          <h2 className="mb-4 text-lg font-semibold">章节目录</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {CHAPTERS.map((chapter) => {
              const Icon = CHAPTER_ICONS[chapter.id];
              const implementedIn = chapter.algorithms.filter((a) =>
                getAlgorithmMeta(a.id),
              );
              const firstImplemented = implementedIn[0];
              return (
                <Card
                  key={chapter.id}
                  className="group cursor-pointer transition-colors hover:border-primary/40"
                  onClick={() => firstImplemented && navigate(`/algorithm/${firstImplemented.id}`)}
                >
                  <CardHeader className="flex-row items-center gap-3 space-y-0">
                    <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-sm">{chapter.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="mb-2 line-clamp-2">
                      {chapter.description}
                    </CardDescription>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {implementedIn.length}/{chapter.algorithms.length} 已实现
                      </span>
                      {firstImplemented && (
                        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        <footer className="mt-12 flex items-center justify-center gap-2 border-t pt-6 text-sm text-muted-foreground">
          <Boxes className="size-4" />
          <Binary className="size-3" />
          <GitBranch className="size-4" />
          <span>DataStruct Lab · 长期迭代中的数据结构学习工具</span>
        </footer>
      </div>
    </div>
  );
}
