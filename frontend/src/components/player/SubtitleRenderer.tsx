import { useEffect, useState, useRef, memo } from 'react';

interface Props {
  currentTime: number;
  subtitleUrl: string;
  isActive: boolean;
}

interface Cue {
  start: number;
  end: number;
  text: string;
}

function parseVTT(text: string): Cue[] {
  const cues: Cue[] = [];
  const lines = text.split('\n');
  let i = 0;
  // Skip WEBVTT header
  while (i < lines.length && !lines[i].includes('-->')) i++;
  while (i < lines.length) {
    if (lines[i].includes('-->')) {
      const [startStr, endStr] = lines[i].split('-->').map((s) => s.trim());
      const start = parseTime(startStr);
      const end = parseTime(endStr);
      i++;
      const textLines: string[] = [];
      while (i < lines.length && lines[i].trim() !== '') {
        textLines.push(lines[i].trim());
        i++;
      }
      cues.push({ start, end, text: textLines.join('\n') });
    }
    i++;
  }
  return cues;
}

function parseTime(str: string): number {
  const parts = str.split(':');
  if (parts.length === 3) {
    const [h, m, s] = parts;
    return parseInt(h) * 3600 + parseInt(m) * 60 + parseFloat(s);
  }
  if (parts.length === 2) {
    const [m, s] = parts;
    return parseInt(m) * 60 + parseFloat(s);
  }
  return parseFloat(str) || 0;
}

function stripTags(text: string): string {
  return text.replace(/<[^>]*>/g, '');
}

function SubtitleRenderer({ currentTime, subtitleUrl, isActive }: Props) {
  const [cues, setCues] = useState<Cue[]>([]);
  const [currentCue, setCurrentCue] = useState<string | null>(null);

  useEffect(() => {
    if (!subtitleUrl || !isActive) return;
    let cancelled = false;
    fetch(subtitleUrl)
      .then((r) => r.text())
      .then((text) => {
        if (!cancelled) {
          const parsed = text.trim().startsWith('WEBVTT') ? parseVTT(text) : [];
          setCues(parsed);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [subtitleUrl, isActive]);

  useEffect(() => {
    if (!cues.length || !isActive) {
      setCurrentCue(null);
      return;
    }
    const active = cues.find((c) => currentTime >= c.start && currentTime <= c.end);
    setCurrentCue(active ? stripTags(active.text) : null);
  }, [currentTime, cues, isActive]);

  if (!isActive || !currentCue) return null;

  return (
    <div className="absolute bottom-24 inset-x-0 z-20 flex justify-center pointer-events-none px-8">
      <div
        className="px-5 py-2.5 rounded-xl bg-black/70 backdrop-blur-sm text-white text-base sm:text-lg font-medium text-center leading-relaxed max-w-[80%]"
        style={{ textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}
      >
        {currentCue}
      </div>
    </div>
  );
}

export default memo(SubtitleRenderer);
