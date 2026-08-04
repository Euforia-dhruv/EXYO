import { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '../../utils/helpers';

interface SubtitleRendererProps {
  currentTime: number;
  subtitleUrl: string;
  isActive: boolean;
}

interface SubtitleCue {
  startTime: number;
  endTime: number;
  text: string;
}

interface SubtitlePreferences {
  fontSize: 'small' | 'medium' | 'large';
  color: 'white' | 'yellow';
  background: 'none' | 'semi-transparent' | 'black-box';
  position: 'bottom' | 'top';
}

const STORAGE_KEY = 'exyo-subtitle-prefs';

function getStoredPreferences(): SubtitlePreferences {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return {
    fontSize: 'medium',
    color: 'white',
    background: 'semi-transparent',
    position: 'bottom',
  };
}

function parseTimestamp(ts: string): number {
  const parts = ts.split(':');
  if (parts.length === 3) {
    const [h, m, rest] = parts;
    const [s, ms] = rest.split('.');
    return (
      parseInt(h) * 3600 +
      parseInt(m) * 60 +
      parseInt(s) +
      (ms ? parseInt(ms.padEnd(3, '0').slice(0, 3)) / 1000 : 0)
    );
  }
  if (parts.length === 2) {
    const [m, rest] = parts;
    const [s, ms] = rest.split('.');
    return (
      parseInt(m) * 60 +
      parseInt(s) +
      (ms ? parseInt(ms.padEnd(3, '0').slice(0, 3)) / 1000 : 0)
    );
  }
  return parseFloat(ts) || 0;
}

function parseVTT(text: string): SubtitleCue[] {
  const cues: SubtitleCue[] = [];
  const lines = text.split('\n');
  let i = 0;

  while (i < lines.length && !lines[i].includes('-->')) {
    i++;
  }

  while (i < lines.length) {
    const line = lines[i];
    if (line.includes('-->')) {
      const [startStr, endStr] = line.split('-->').map((s) => s.trim());
      const startTime = parseTimestamp(startStr);
      const endTime = parseTimestamp(endStr);
      const textLines: string[] = [];
      i++;
      while (i < lines.length && lines[i].trim() !== '') {
        textLines.push(lines[i]);
        i++;
      }
      if (textLines.length > 0) {
        cues.push({
          startTime,
          endTime,
          text: textLines.join('\n').replace(/<[^>]*>/g, ''),
        });
      }
    }
    i++;
  }

  return cues;
}

function parseSRT(text: string): SubtitleCue[] {
  const cues: SubtitleCue[] = [];
  const blocks = text.trim().split(/\n\s*\n/);

  for (const block of blocks) {
    const lines = block.split('\n');
    if (lines.length < 2) continue;

    const timeLine = lines.find((l) => l.includes('-->'));
    if (!timeLine) continue;

    const [startStr, endStr] = timeLine.split('-->').map((s) => s.trim());
    const startTime = parseTimestamp(startStr.replace(',', '.'));
    const endTime = parseTimestamp(endStr.replace(',', '.'));
    const textLines = lines.slice(lines.indexOf(timeLine) + 1);

    if (textLines.length > 0) {
      cues.push({
        startTime,
        endTime,
        text: textLines.join('\n').replace(/<[^>]*>/g, ''),
      });
    }
  }

  return cues;
}

export default function SubtitleRenderer({
  currentTime,
  subtitleUrl,
  isActive,
}: SubtitleRendererProps) {
  const [cues, setCues] = useState<SubtitleCue[]>([]);
  const [preferences, setPreferences] = useState<SubtitlePreferences>(getStoredPreferences);
  const [showPrefs, setShowPrefs] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!subtitleUrl || !isActive) {
      setCues([]);
      return;
    }

    const fetchSubtitles = async () => {
      try {
        const response = await fetch(subtitleUrl);
        const text = await response.text();
        const ext = subtitleUrl.split('.').pop()?.toLowerCase();

        if (ext === 'vtt') {
          setCues(parseVTT(text));
        } else if (ext === 'srt') {
          setCues(parseSRT(text));
        } else {
          setCues(parseVTT(text));
        }
      } catch {
        setCues([]);
      }
    };

    fetchSubtitles();
  }, [subtitleUrl, isActive]);

  const currentCue = cues.find(
    (cue) => currentTime >= cue.startTime && currentTime <= cue.endTime
  );

  const updatePreferences = useCallback((prefs: Partial<SubtitlePreferences>) => {
    setPreferences((prev) => {
      const next = { ...prev, ...prefs };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch { /* ignore */ }
      return next;
    });
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'c' && !e.ctrlKey && !e.metaKey && !(e.target instanceof HTMLInputElement)) {
        setShowPrefs((prev) => !prev);
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  if (!isActive || !currentCue) return null;

  const fontSizeClass = {
    small: 'text-sm',
    medium: 'text-lg',
    large: 'text-2xl',
  }[preferences.fontSize];

  const colorClass = {
    white: 'text-white',
    yellow: 'text-yellow-300',
  }[preferences.color];

  const bgClass = {
    none: '',
    'semi-transparent': 'bg-black/40 rounded px-2 py-0.5',
    'black-box': 'bg-black rounded px-2 py-0.5',
  }[preferences.background];

  const positionClass = preferences.position === 'top' ? 'top-16' : 'bottom-24';

  return (
    <>
      <div
        className={cn(
          'absolute left-0 right-0 flex justify-center pointer-events-none z-20',
          positionClass
        )}
      >
        <div
          className={cn(
            'font-bold text-center max-w-[80%] leading-relaxed drop-shadow-lg',
            fontSizeClass,
            colorClass,
            bgClass
          )}
        >
          {currentCue.text}
        </div>
      </div>

      {showPrefs && (
        <div
          ref={containerRef}
          className="absolute bottom-28 left-1/2 -translate-x-1/2 z-30 bg-black/90 backdrop-blur-xl rounded-2xl p-4 min-w-[200px] border border-white/10 shadow-2xl"
        >
          <div className="text-[11px] text-gray-500 uppercase tracking-wider font-bold mb-3">
            Subtitle Settings
          </div>

          <div className="mb-3">
            <div className="text-[11px] text-gray-400 mb-1">Size</div>
            <div className="flex gap-1">
              {(['small', 'medium', 'large'] as const).map((size) => (
                <button
                  key={size}
                  onClick={() => updatePreferences({ fontSize: size })}
                  className={cn(
                    'px-3 py-1 text-xs rounded-lg transition-colors font-medium capitalize',
                    preferences.fontSize === size
                      ? 'bg-white text-black'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  )}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-3">
            <div className="text-[11px] text-gray-400 mb-1">Color</div>
            <div className="flex gap-1">
              {(['white', 'yellow'] as const).map((color) => (
                <button
                  key={color}
                  onClick={() => updatePreferences({ color })}
                  className={cn(
                    'px-3 py-1 text-xs rounded-lg transition-colors font-medium capitalize',
                    preferences.color === color
                      ? 'bg-white text-black'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  )}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-3">
            <div className="text-[11px] text-gray-400 mb-1">Background</div>
            <div className="flex gap-1">
              {(['none', 'semi-transparent', 'black-box'] as const).map((bg) => (
                <button
                  key={bg}
                  onClick={() => updatePreferences({ background: bg })}
                  className={cn(
                    'px-2 py-1 text-[10px] rounded-lg transition-colors font-medium',
                    preferences.background === bg
                      ? 'bg-white text-black'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  )}
                >
                  {bg === 'black-box' ? 'Box' : bg === 'semi-transparent' ? 'Semi' : 'None'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[11px] text-gray-400 mb-1">Position</div>
            <div className="flex gap-1">
              {(['bottom', 'top'] as const).map((pos) => (
                <button
                  key={pos}
                  onClick={() => updatePreferences({ position: pos })}
                  className={cn(
                    'px-3 py-1 text-xs rounded-lg transition-colors font-medium capitalize',
                    preferences.position === pos
                      ? 'bg-white text-black'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  )}
                >
                  {pos}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
