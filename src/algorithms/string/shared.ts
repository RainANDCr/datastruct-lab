/**
 * 字符串匹配共享解析：text 主串 ; pattern 模式串。
 */
import type { ParseResult } from '@/engine/types';

export interface TextPattern {
  text: string;
  pattern: string;
}

export function parseTextPattern(raw: string): ParseResult<TextPattern> {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, error: '请输入命令（如 text ABAABAB ; pattern ABAB）' };
  const parts = trimmed.split(/[;；\n]+/).map((s) => s.trim()).filter(Boolean);
  let text: string | null = null;
  let pattern: string | null = null;
  for (const part of parts) {
    const m = part.match(/^(\S+)\s*(.*)$/);
    if (!m) continue;
    const cmd = m[1].toLowerCase();
    const rest = m[2].trim();
    if (cmd === 'text' || cmd === 't') {
      if (!rest) return { ok: false, error: '"text" 需要主串内容' };
      text = rest;
    } else if (cmd === 'pattern' || cmd === 'p') {
      if (!rest) return { ok: false, error: '"pattern" 需要模式串内容' };
      pattern = rest;
    } else {
      return { ok: false, error: `未知命令 "${cmd}"（支持 text / pattern）` };
    }
  }
  if (text === null) return { ok: false, error: '缺少主串（text ...）' };
  if (pattern === null) return { ok: false, error: '缺少模式串（pattern ...）' };
  if (pattern.length === 0) return { ok: false, error: '模式串不能为空' };
  if (pattern.length > text.length) return { ok: false, error: '模式串长度不能超过主串' };
  return { ok: true, value: { text, pattern } };
}
