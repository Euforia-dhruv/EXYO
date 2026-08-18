import React, { useEffect, useState, useRef, memo, useMemo } from 'react';
import { parseSubtitles, type SubtitleCue } from '../../lib/subtitleParser';
import { useSubtitleStore } from '../../store/subtitleStore';

interface Props {
  currentTime: number;
  subtitleUrl: string;
  isActive: boolean;
}

function SubtitleRenderer({ currentTime, subtitleUrl, isActive }: Props) {
  const [cues, setCues] = useState<SubtitleCue[]>([]);
  const [currentCue, setCurrentCue] = useState<SubtitleCue | null>(null);
  const lastUrlRef = useRef('');

  const settings = useSubtitleStore();

  useEffect(() => {
    if (!subtitleUrl || !isActive || subtitleUrl === lastUrlRef.current) return;
    lastUrlRef.current = subtitleUrl;
    let cancelled = false;

    fetch(subtitleUrl)
      .then((r) => r.text())
      .then((text) => {
        if (!cancelled) {
          const parsed = parseSubtitles(text);
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
    const adjusted = currentTime + (settings.delay / 1000);
    const active = cues.find((c) => adjusted >= c.start && adjusted <= c.end);
    setCurrentCue(active || null);
  }, [currentTime, cues, isActive, settings.delay]);

  const containerStyle = useMemo((): React.CSSProperties => {
    const bgAlpha = settings.backgroundOpacity / 100;
    const textAlpha = settings.opacity / 100;
    const baseSize = 16 * (settings.size / 100);
    const shadow = settings.edgeStyle === 'shadow'
      ? `0 2px 8px ${settings.edgeColor}, 0 0 4px ${settings.edgeColor}`
      : settings.edgeStyle === 'outline'
      ? `-1px -1px 0 ${settings.edgeColor}, 1px -1px 0 ${settings.edgeColor}, -1px 1px 0 ${settings.edgeColor}, 1px 1px 0 ${settings.edgeColor}`
      : settings.edgeStyle === 'glow'
      ? `0 0 10px ${settings.edgeColor}, 0 0 20px ${settings.edgeColor}`
      : 'none';

    return {
      opacity: textAlpha,
      fontSize: `${baseSize}px`,
      fontWeight: settings.fontWeight,
      fontFamily: settings.fontFamily,
      color: settings.color,
      textShadow: shadow,
      textAlign: settings.alignment,
      backgroundColor: bgAlpha > 0 ? settings.backgroundColor : 'transparent',
      borderRadius: '8px',
      padding: bgAlpha > 0 ? '6px 16px' : '0',
      lineHeight: 1.5,
      maxWidth: '85%',
      wordBreak: 'break-word',
    };
  }, [settings]);

  if (!isActive || !currentCue) return null;

  const lines = currentCue.text.split('\n');

  return (
    <div
      className="absolute inset-x-0 z-20 flex justify-center pointer-events-none px-8"
      style={{ bottom: settings.position === 'bottom' ? '80px' : undefined, top: settings.position === 'top' ? '60px' : undefined }}
    >
      <div style={containerStyle}>
        {lines.map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </div>
    </div>
  );
}

export default memo(SubtitleRenderer);
