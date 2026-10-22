/**
 * 线性结构操作脚本解析器。
 *
 * 输入形如：`insert 20, insert 30, search 30, delete 20`
 * 支持逗号 / 分号 / 换行分隔；每条命令由「命令名 + 参数」组成。
 */
import type { ParseResult } from '@/engine/types';

export interface RawCommand {
  cmd: string;
  args: number[];
}

export function parseCommandScript(raw: string): ParseResult<RawCommand[]> {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, error: '请输入操作序列' };

  const parts = trimmed.split(/[;,，；\n]+/).map((s) => s.trim()).filter(Boolean);
  const commands: RawCommand[] = [];
  for (const part of parts) {
    const tokens = part.split(/\s+/).filter(Boolean);
    if (tokens.length === 0) continue;
    const cmd = tokens[0].toLowerCase();
    const args = tokens.slice(1).map(Number);
    if (args.some((a) => !Number.isFinite(a))) {
      return { ok: false, error: `"${part}" 含非法参数` };
    }
    commands.push({ cmd, args });
  }
  if (commands.length === 0) return { ok: false, error: '操作序列为空' };
  return { ok: true, value: commands };
}
