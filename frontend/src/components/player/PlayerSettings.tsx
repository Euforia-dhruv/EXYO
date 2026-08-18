import { motion } from 'framer-motion';
import {
  X, ChevronRight, ChevronLeft, Settings, Type, Volume2,
} from 'lucide-react';
import { useSubtitleStore } from '../../store/subtitleStore';
import { useState } from 'react';
import { cn } from '../../utils/helpers';

interface Props {
  open: boolean;
  onClose: () => void;
  playbackRate: number;
  onSpeedChange: (rate: number) => void;
  audioTracks: AudioTrackInfo[];
  onAudioTrackSelect: (track: AudioTrackInfo) => void;
  activeAudioTrack: AudioTrackInfo | null;
  subtitleTracks: SubtitleTrackInfo[];
  activeSubtitleUrl: string | null;
  onSubtitleTrackSelect: (track: SubtitleTrackInfo | null) => void;
  showSubtitles: boolean;
}

export interface AudioTrackInfo {
  id: string;
  label: string;
  language?: string;
}

export interface SubtitleTrackInfo {
  url: string;
  lang: string;
  label: string;
}

const SPEED_OPTIONS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3];

type SettingsView = 'main' | 'speed' | 'subtitles' | 'audio' | 'subtitle-track';

const COLOR_PRESETS = [
  { label: 'White', value: '#ffffff' },
  { label: 'Yellow', value: '#ffff00' },
  { label: 'Cyan', value: '#00ffff' },
  { label: 'Green', value: '#00ff00' },
  { label: 'Red', value: '#ff0000' },
  { label: 'Magenta', value: '#ff00ff' },
  { label: 'Blue', value: '#0088ff' },
];

const BG_COLOR_PRESETS = [
  { label: 'Black', value: '#000000' },
  { label: 'Dark', value: '#1a1a2e' },
  { label: 'Navy', value: '#000080' },
  { label: 'None', value: 'transparent' },
];

const EDGE_STYLES: Array<{ label: string; value: 'none' | 'shadow' | 'outline' | 'glow' }> = [
  { label: 'None', value: 'none' },
  { label: 'Shadow', value: 'shadow' },
  { label: 'Outline', value: 'outline' },
  { label: 'Glow', value: 'glow' },
];

const POSITION_OPTIONS: Array<{ label: string; value: 'bottom' | 'top' }> = [
  { label: 'Bottom', value: 'bottom' },
  { label: 'Top', value: 'top' },
];

const ALIGN_OPTIONS: Array<{ label: string; value: 'left' | 'center' | 'right' }> = [
  { label: 'Left', value: 'left' },
  { label: 'Center', value: 'center' },
  { label: 'Right', value: 'right' },
];

export default function PlayerSettings({
  open: _open, onClose, playbackRate, onSpeedChange, audioTracks, onAudioTrackSelect, activeAudioTrack,
  subtitleTracks, activeSubtitleUrl, onSubtitleTrackSelect, showSubtitles,
}: Props) {
  const subtitle = useSubtitleStore();
  const [view, setView] = useState<SettingsView>('main');

  const handleClose = () => {
    setView('main');
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-40 flex items-center justify-end"
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="relative w-full max-w-sm h-full glass-heavy border-l border-white/[0.06] overflow-y-auto"
      >
        <div className="sticky top-0 glass-heavy border-b border-white/[0.06] px-5 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            {view !== 'main' && (
              <button
                onClick={() => setView('main')}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/[0.06] transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            <h3 className="text-white font-bold text-base">
              {view === 'main' && 'Settings'}
              {view === 'speed' && 'Playback Speed'}
              {view === 'subtitles' && 'Subtitle Style'}
              {view === 'subtitle-track' && 'Subtitles'}
              {view === 'audio' && 'Audio Track'}
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white/40 hover:text-white hover:bg-white/[0.06] transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4">
          {view === 'main' && (
            <div className="space-y-1">
              <SettingRow
                icon={<Settings className="w-4 h-4" />}
                label="Speed"
                value={`${playbackRate}x`}
                onClick={() => setView('speed')}
              />
              <SettingRow
                icon={<Type className="w-4 h-4" />}
                label="Subtitles"
                value={showSubtitles ? (activeSubtitleUrl ? subtitleTracks.find(t => t.url === activeSubtitleUrl)?.label || 'On' : 'On') : 'Off'}
                onClick={() => setView('subtitle-track')}
              />
              <SettingRow
                icon={<Type className="w-4 h-4" />}
                label="Subtitle Style"
                value={subtitle.enabled ? 'Customized' : 'Default'}
                onClick={() => setView('subtitles')}
              />
              {audioTracks.length > 0 && (
                <SettingRow
                  icon={<Volume2 className="w-4 h-4" />}
                  label="Audio"
                  value={activeAudioTrack?.label || 'Default'}
                  onClick={() => setView('audio')}
                />
              )}
            </div>
          )}

          {view === 'speed' && (
            <div className="space-y-2">
              {SPEED_OPTIONS.map((rate) => (
                <button
                  key={rate}
                  onClick={() => onSpeedChange(rate)}
                  className={cn(
                    'w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all border',
                    playbackRate === rate
                      ? 'bg-red/10 border-red/20 text-red'
                      : 'bg-white/[0.02] border-white/[0.04] text-white/60 hover:bg-white/[0.05]'
                  )}
                >
                  {rate}x {rate === 1 && <span className="text-white/25 ml-2">(Normal)</span>}
                </button>
              ))}
            </div>
          )}

          {view === 'subtitles' && (
            <div className="space-y-5">
              <Toggle label="Enable Subtitles" checked={subtitle.enabled} onChange={subtitle.setEnabled} />

              <Section label="Size">
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={50}
                    max={200}
                    step={10}
                    value={subtitle.size}
                    onChange={(e) => subtitle.setSize(Number(e.target.value))}
                    className="flex-1 accent-red h-1"
                  />
                  <span className="text-white/50 text-xs font-mono w-10 text-right">{subtitle.size}%</span>
                </div>
              </Section>

              <Section label="Opacity">
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={10}
                    max={100}
                    step={5}
                    value={subtitle.opacity}
                    onChange={(e) => subtitle.setOpacity(Number(e.target.value))}
                    className="flex-1 accent-red h-1"
                  />
                  <span className="text-white/50 text-xs font-mono w-10 text-right">{subtitle.opacity}%</span>
                </div>
              </Section>

              <Section label="Text Color">
                <div className="flex flex-wrap gap-2">
                  {COLOR_PRESETS.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => subtitle.setColor(c.value)}
                      className={cn(
                        'w-8 h-8 rounded-lg border-2 transition-all',
                        subtitle.color === c.value ? 'border-red scale-110' : 'border-white/10 hover:border-white/30'
                      )}
                      style={{ backgroundColor: c.value }}
                      title={c.label}
                    />
                  ))}
                </div>
              </Section>

              <Section label="Background">
                <div className="flex flex-wrap gap-2 mb-3">
                  {BG_COLOR_PRESETS.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => subtitle.setBackgroundColor(c.value)}
                      className={cn(
                        'w-8 h-8 rounded-lg border-2 transition-all',
                        subtitle.backgroundColor === c.value ? 'border-red scale-110' : 'border-white/10 hover:border-white/30'
                      )}
                      style={{ backgroundColor: c.value === 'transparent' ? '#333' : c.value }}
                      title={c.label}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={subtitle.backgroundOpacity}
                    onChange={(e) => subtitle.setBackgroundOpacity(Number(e.target.value))}
                    className="flex-1 accent-red h-1"
                  />
                  <span className="text-white/50 text-xs font-mono w-10 text-right">{subtitle.backgroundOpacity}%</span>
                </div>
              </Section>

              <Section label="Position">
                <div className="flex gap-2">
                  {POSITION_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => subtitle.setPosition(opt.value)}
                      className={cn(
                        'flex-1 py-2 rounded-lg text-xs font-medium border transition-all',
                        subtitle.position === opt.value
                          ? 'bg-red/10 border-red/20 text-red'
                          : 'bg-white/[0.02] border-white/[0.04] text-white/50 hover:bg-white/[0.05]'
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </Section>

              <Section label="Alignment">
                <div className="flex gap-2">
                  {ALIGN_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => subtitle.setAlignment(opt.value)}
                      className={cn(
                        'flex-1 py-2 rounded-lg text-xs font-medium border transition-all',
                        subtitle.alignment === opt.value
                          ? 'bg-red/10 border-red/20 text-red'
                          : 'bg-white/[0.02] border-white/[0.04] text-white/50 hover:bg-white/[0.05]'
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </Section>

              <Section label="Edge Style">
                <div className="flex gap-2 flex-wrap">
                  {EDGE_STYLES.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => subtitle.setEdgeStyle(opt.value)}
                      className={cn(
                        'px-3 py-2 rounded-lg text-xs font-medium border transition-all',
                        subtitle.edgeStyle === opt.value
                          ? 'bg-red/10 border-red/20 text-red'
                          : 'bg-white/[0.02] border-white/[0.04] text-white/50 hover:bg-white/[0.05]'
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </Section>

              <Section label="Font Weight">
                <div className="flex gap-2">
                  {[300, 400, 600, 700, 900].map((w) => (
                    <button
                      key={w}
                      onClick={() => subtitle.setFontWeight(w)}
                      className={cn(
                        'flex-1 py-2 rounded-lg text-xs font-medium border transition-all',
                        subtitle.fontWeight === w
                          ? 'bg-red/10 border-red/20 text-red'
                          : 'bg-white/[0.02] border-white/[0.04] text-white/50 hover:bg-white/[0.05]'
                      )}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </Section>

              <Section label="Delay">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => subtitle.setDelay(Math.max(-5000, subtitle.delay - 500))}
                    className="px-3 py-2 rounded-lg text-xs font-medium border bg-white/[0.02] border-white/[0.04] text-white/50 hover:bg-white/[0.05] transition-all"
                  >
                    -0.5s
                  </button>
                  <div className="flex-1 text-center">
                    <input
                      type="range"
                      min={-5000}
                      max={5000}
                      step={100}
                      value={subtitle.delay}
                      onChange={(e) => subtitle.setDelay(Number(e.target.value))}
                      className="w-full accent-red h-1"
                    />
                    <span className="text-white/50 text-xs font-mono">
                      {subtitle.delay > 0 ? '+' : ''}{(subtitle.delay / 1000).toFixed(1)}s
                    </span>
                  </div>
                  <button
                    onClick={() => subtitle.setDelay(Math.min(5000, subtitle.delay + 500))}
                    className="px-3 py-2 rounded-lg text-xs font-medium border bg-white/[0.02] border-white/[0.04] text-white/50 hover:bg-white/[0.05] transition-all"
                  >
                    +0.5s
                  </button>
                </div>
              </Section>
            </div>
          )}

          {view === 'audio' && (
            <div className="space-y-2">
              {audioTracks.map((track) => (
                <button
                  key={track.id}
                  onClick={() => onAudioTrackSelect(track)}
                  className={cn(
                    'w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all border',
                    activeAudioTrack?.id === track.id
                      ? 'bg-red/10 border-red/20 text-red'
                      : 'bg-white/[0.02] border-white/[0.04] text-white/60 hover:bg-white/[0.05]'
                  )}
                >
                  {track.label}
                  {track.language && <span className="text-white/30 ml-2">({track.language})</span>}
                </button>
              ))}
            </div>
          )}

          {view === 'subtitle-track' && (
            <div className="space-y-2">
              <button
                onClick={() => onSubtitleTrackSelect(null)}
                className={cn(
                  'w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all border',
                  !showSubtitles || !activeSubtitleUrl
                    ? 'bg-red/10 border-red/20 text-red'
                    : 'bg-white/[0.02] border-white/[0.04] text-white/60 hover:bg-white/[0.05]'
                )}
              >
                Off
              </button>
              {subtitleTracks.map((track) => (
                <button
                  key={track.url}
                  onClick={() => onSubtitleTrackSelect(track)}
                  className={cn(
                    'w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all border',
                    activeSubtitleUrl === track.url
                      ? 'bg-red/10 border-red/20 text-red'
                      : 'bg-white/[0.02] border-white/[0.04] text-white/60 hover:bg-white/[0.05]'
                  )}
                >
                  {track.label}
                  <span className="text-white/30 ml-2">({track.lang})</span>
                </button>
              ))}
              {subtitleTracks.length === 0 && (
                <p className="text-white/30 text-sm text-center py-4">No subtitle tracks available</p>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function SettingRow({ icon, label, value, onClick }: { icon: React.ReactNode; label: string; value: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.05] transition-all"
    >
      <div className="flex items-center gap-3">
        <span className="text-white/40">{icon}</span>
        <span className="text-white text-sm font-medium">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-white/40 text-sm">{value}</span>
        <ChevronRight className="w-4 h-4 text-white/20" />
      </div>
    </button>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-2">{label}</h4>
      {children}
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.04] cursor-pointer">
      <span className="text-white text-sm font-medium">{label}</span>
      <div
        className={cn('relative w-11 h-6 rounded-full transition-colors', checked ? 'bg-red' : 'bg-white/10')}
        onClick={() => onChange(!checked)}
      >
        <div
          className={cn('absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform', checked ? 'translate-x-5.5 left-0.5' : 'left-0.5')}
          style={{ transform: checked ? 'translateX(22px)' : 'translateX(2px)' }}
        />
      </div>
    </label>
  );
}
