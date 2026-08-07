export interface SubtitleCue {
  start: number;
  end: number;
  text: string;
  style?: {
    color?: string;
    fontSize?: number;
    fontFamily?: string;
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    alignment?: 'left' | 'center' | 'right';
  };
  position?: { x: number; y: number };
}

export type SubtitleFormat = 'vtt' | 'srt' | 'ass' | 'ssa' | 'unknown';

export function detectFormat(content: string): SubtitleFormat {
  const trimmed = content.trim();
  if (trimmed.startsWith('WEBVTT')) return 'vtt';
  if (trimmed.startsWith('Script Type: v4') || trimmed.startsWith('[Script Info]')) {
    if (trimmed.includes('ScriptType: v4.00+') || trimmed.includes('ScriptType: v4.00')) return 'ass';
    return 'ssa';
  }
  if (/^\d+\r?\n\d{2}:\d{2}:\d{2}[,.:]\d{3}/m.test(trimmed)) return 'srt';
  return 'unknown';
}

function parseTime(str: string): number {
  const s = str.trim();
  const hmsMatch = s.match(/^(\d{1,2}):(\d{2}):(\d{2})[.,:](\d{3})$/);
  if (hmsMatch) {
    return parseInt(hmsMatch[1]) * 3600 + parseInt(hmsMatch[2]) * 60 + parseInt(hmsMatch[3]) + parseInt(hmsMatch[4]) / 1000;
  }
  const msMatch = s.match(/^(\d{2}):(\d{2})[.,:](\d{3})$/);
  if (msMatch) {
    return parseInt(msMatch[1]) * 60 + parseInt(msMatch[2]) + parseInt(msMatch[3]) / 1000;
  }
  const secMatch = s.match(/^(\d{2}):(\d{2})$/);
  if (secMatch) {
    return parseInt(secMatch[1]) * 60 + parseInt(secMatch[2]);
  }
  return parseFloat(s) || 0;
}

function parseVTT(text: string): SubtitleCue[] {
  const cues: SubtitleCue[] = [];
  const lines = text.split('\n');
  let i = 0;

  while (i < lines.length && !lines[i].includes('-->')) i++;

  while (i < lines.length) {
    const line = lines[i].trim();
    if (line.includes('-->')) {
      const [startStr, rest] = line.split('-->').map((s) => s.trim());
      const endStr = rest.split(/\s/)[0];
      const start = parseTime(startStr);
      const end = parseTime(endStr);
      i++;
      const textLines: string[] = [];
      while (i < lines.length && lines[i].trim() !== '') {
        textLines.push(lines[i].trim());
        i++;
      }
      const raw = textLines.join('\n');
      const { text, style } = parseInlineStyles(raw);
      cues.push({ start, end, text, style });
    }
    i++;
  }
  return cues;
}

function parseSRT(text: string): SubtitleCue[] {
  const cues: SubtitleCue[] = [];
  const blocks = text.trim().split(/\r?\n\r?\n/);

  for (const block of blocks) {
    const lines = block.trim().split('\n');
    if (lines.length < 2) continue;

    let timeLineIdx = -1;
    for (let j = 0; j < lines.length; j++) {
      if (lines[j].includes('-->')) {
        timeLineIdx = j;
        break;
      }
    }
    if (timeLineIdx === -1) continue;

    const timeLine = lines[timeLineIdx];
    const [startStr, endStr] = timeLine.split('-->').map((s) => s.trim());
    const start = parseTime(startStr);
    const end = parseTime(endStr.split(/\s/)[0]);

    const textLines = lines.slice(timeLineIdx + 1).filter((l) => l.trim());
    const raw = textLines.join('\n');
    const { text, style } = parseInlineStyles(raw);
    cues.push({ start, end, text, style });
  }
  return cues;
}

function parseInlineStyles(raw: string): { text: string; style?: SubtitleCue['style'] } {
  const style: NonNullable<SubtitleCue['style']> = {};
  let text = raw;

  text = text.replace(/<[^>]*>/g, (tag) => {
    if (tag === '<b>' || tag === '</b>') style.bold = true;
    if (tag === '<i>' || tag === '</i>') style.italic = true;
    if (tag === '<u>' || tag === '</u>') style.underline = true;
    const colorMatch = tag.match(/<font\s+color="?(#?[a-fA-F0-9]+)"?>/i);
    if (colorMatch) style.color = colorMatch[1];
    return '';
  });

  text = text.replace(/\{\\an[1-9]\}/g, '');
  text = text.replace(/\{\\[^}]*\}/g, '');

  return { text: text.trim(), style: Object.keys(style).length > 0 ? style : undefined };
}

function parseASS(text: string): SubtitleCue[] {
  const cues: SubtitleCue[] = [];
  const lines = text.split('\n');

  let inEvents = false;
  let formatFields: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.toLowerCase() === '[events]') {
      inEvents = true;
      continue;
    }
    if (trimmed.startsWith('[') && trimmed.toLowerCase() !== '[events]') {
      inEvents = false;
      continue;
    }

    if (!inEvents) continue;

    if (trimmed.toLowerCase().startsWith('format:')) {
      formatFields = trimmed.substring(7).split(',').map((f) => f.trim().toLowerCase());
      continue;
    }

    if (trimmed.toLowerCase().startsWith('dialogue:')) {
      const content = trimmed.substring(9);
      const parts = content.split(',');
      if (parts.length < formatFields.length) continue;

      const fields: Record<string, string> = {};
      for (let i = 0; i < formatFields.length; i++) {
        if (i === formatFields.length - 1) {
          fields[formatFields[i]] = parts.slice(i).join(',');
        } else {
          fields[formatFields[i]] = parts[i].trim();
        }
      }

      const startStr = fields['start'] || '0:00:00.00';
      const endStr = fields['end'] || '0:00:00.00';
      const start = parseASSTime(startStr);
      const end = parseASSTime(endStr);

      const style: NonNullable<SubtitleCue['style']> = {};
      const rawText = fields['text'] || '';

      if (fields['style']) {
        const styleName = fields['style'].toLowerCase();
        if (styleName.includes('italic') || styleName.includes('it')) style.italic = true;
      }

      let text = rawText.replace(/\\N/g, '\n').replace(/\\n/g, '\n');
      text = text.replace(/\{\\[^}]*\}/g, (match) => {
        const inner = match.slice(2, -1);
        if (inner.startsWith('c&H')) {
          const color = assColorToHex(inner.substring(3));
          if (color) style.color = color;
        }
        if (inner === 'b1') style.bold = true;
        if (inner === 'b0') style.bold = false;
        if (inner === 'i1') style.italic = true;
        if (inner === 'i0') style.italic = false;
        if (inner.startsWith('an')) {
          const n = parseInt(inner.substring(2));
          if (n >= 1 && n <= 9) {
            style.alignment = assAlignmentToHorizontal(n);
          }
        }
        return '';
      });

      text = text.replace(/<[^>]*>/g, '');
      cues.push({ start, end, text: text.trim(), style: Object.keys(style).length > 0 ? style : undefined });
    }
  }
  return cues;
}

function parseASSTime(str: string): number {
  const parts = str.trim().split(':');
  if (parts.length === 3) {
    return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseFloat(parts[2]);
  }
  if (parts.length === 2) {
    return parseInt(parts[0]) * 60 + parseFloat(parts[1]);
  }
  return parseFloat(str) || 0;
}

function assColorToHex(color: string): string | undefined {
  const cleaned = color.replace(/&H|&h/gi, '').replace(/&/g, '');
  if (/^[0-9a-fA-F]{6,8}$/.test(cleaned)) {
    const bgr = cleaned.length === 8 ? cleaned.substring(2) : cleaned;
    if (bgr.length === 6) {
      return `#${bgr.substring(4, 6)}${bgr.substring(2, 4)}${bgr.substring(0, 2)}`;
    }
  }
  return undefined;
}

function assAlignmentToHorizontal(an: number): 'left' | 'center' | 'right' {
  if (an === 1 || an === 4 || an === 7) return 'left';
  if (an === 3 || an === 6 || an === 9) return 'right';
  return 'center';
}

export function parseSubtitles(content: string, format?: SubtitleFormat): SubtitleCue[] {
  const fmt = format || detectFormat(content);
  switch (fmt) {
    case 'vtt': return parseVTT(content);
    case 'srt': return parseSRT(content);
    case 'ass':
    case 'ssa': return parseASS(content);
    default: return parseVTT(content);
  }
}
