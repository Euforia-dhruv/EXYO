import { useDownloadStore, type DownloadItem } from '../store/downloadStore';
import SettingsLayout from '../components/SettingsLayout';
import { motion, AnimatePresence } from 'framer-motion';

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${
        enabled ? 'bg-exyo-red' : 'bg-white/10'
      }`}
    >
      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ${
        enabled ? 'translate-x-[18px]' : 'translate-x-0.5'
      }`} />
    </button>
  );
}

function DownloadRow({ item }: { item: DownloadItem }) {
  const { pauseDownload, resumeDownload, cancelDownload, retryDownload, removeDownload } = useDownloadStore();

  const statusColors: Record<string, string> = {
    queued: 'text-gray-400',
    downloading: 'text-green-400',
    paused: 'text-yellow-400',
    completed: 'text-blue-400',
    failed: 'text-red-400',
    retrying: 'text-yellow-400',
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 hover:bg-white/[0.05] transition-all"
    >
      <div className="flex items-center gap-4">
        {/* Poster */}
        <div className="w-12 h-16 rounded-lg bg-white/[0.04] overflow-hidden flex-shrink-0">
          {item.posterUrl ? (
            <img src={item.posterUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125m17.25 0a1.125 1.125 0 00-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375M3.75 6V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072" />
              </svg>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-[13px] font-semibold text-white truncate">{item.title}</h4>
            {item.season && item.episode && (
              <span className="text-[10px] text-gray-500 bg-white/[0.04] px-1.5 py-0.5 rounded flex-shrink-0">
                S{item.season}E{item.episode}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span className={`text-[11px] font-medium capitalize ${statusColors[item.status]}`}>
              {item.status === 'downloading' ? `${Math.round(item.progress)}%` : item.status}
            </span>
            {item.status === 'downloading' && (
              <>
                <span className="text-[11px] text-gray-500">{item.speed > 0 ? `${(item.speed / 1024 / 1024).toFixed(1)} MB/s` : '--'}</span>
                <span className="text-[11px] text-gray-500">ETA: {item.eta}</span>
                <span className="text-[11px] text-gray-500">{item.peers} peers</span>
              </>
            )}
            {item.status === 'completed' && (
              <span className="text-[11px] text-blue-400">{item.size}</span>
            )}
            {item.error && (
              <span className="text-[11px] text-red-400 truncate">{item.error}</span>
            )}
          </div>
          {(item.status === 'downloading' || item.status === 'paused' || item.status === 'retrying') && (
            <div className="mt-2 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-exyo-red rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${item.progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {(item.status === 'downloading' || item.status === 'queued') && (
            <button
              onClick={() => pauseDownload(item.id)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Pause"
            >
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
              </svg>
            </button>
          )}
          {item.status === 'paused' && (
            <button
              onClick={() => resumeDownload(item.id)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Resume"
            >
              <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
          )}
          {item.status === 'failed' && (
            <button
              onClick={() => retryDownload(item.id)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Retry"
            >
              <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
              </svg>
            </button>
          )}
          <button
            onClick={() => item.status === 'completed' ? removeDownload(item.id) : cancelDownload(item.id)}
            className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
            title={item.status === 'completed' ? 'Remove' : 'Cancel'}
          >
            <svg className="w-4 h-4 text-gray-500 hover:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function Downloads() {
  const {
    downloads, maxParallel, wifiOnly, pauseOnBattery, deleteAfterWatching,
    autoDownloadNext, prioritizeCurrent, highestQuality, autoSubtitles, downloadLocation,
    setMaxParallel, setWifiOnly, setPauseOnBattery, setDeleteAfterWatching,
    setAutoDownloadNext, setPrioritizeCurrent, setHighestQuality, setAutoSubtitles,
    setDownloadLocation, getActiveDownloads, getQueuedDownloads,
  } = useDownloadStore();

  const active = getActiveDownloads();
  const queued = getQueuedDownloads();
  const completed = downloads.filter((d) => d.status === 'completed');
  const failed = downloads.filter((d) => d.status === 'failed');
  const totalSpeed = downloads.filter((d) => d.status === 'downloading').reduce((s, d) => s + d.speed, 0);

  return (
    <SettingsLayout title="Downloads" subtitle="Manage your downloads and storage.">
      <div className="space-y-6">
        {/* Active Downloads Header */}
        {active.length > 0 && (
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-400 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-white">{active.length} Active Download{active.length > 1 ? 's' : ''}</p>
                  <p className="text-[11px] text-gray-500">{(totalSpeed / 1024 / 1024).toFixed(1)} MB/s total</p>
                </div>
              </div>
              <span className="text-[12px] text-gray-500">{queued.length} queued</span>
            </div>
          </div>
        )}

        {/* Current Downloads */}
        {downloads.filter((d) => d.status !== 'completed').length > 0 && (
          <section>
            <h2 className="text-[14px] font-bold text-white mb-3">Current Downloads</h2>
            <div className="space-y-2">
              <AnimatePresence>
                {downloads.filter((d) => d.status !== 'completed').map((item) => (
                  <DownloadRow key={item.id} item={item} />
                ))}
              </AnimatePresence>
            </div>
          </section>
        )}

        {/* Completed */}
        {completed.length > 0 && (
          <section>
            <h2 className="text-[14px] font-bold text-white mb-3">Completed ({completed.length})</h2>
            <div className="space-y-2">
              <AnimatePresence>
                {completed.map((item) => (
                  <DownloadRow key={item.id} item={item} />
                ))}
              </AnimatePresence>
            </div>
          </section>
        )}

        {/* Empty state */}
        {downloads.length === 0 && (
          <div className="text-center py-16">
            <svg className="w-16 h-16 mx-auto text-gray-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            <p className="text-gray-400 text-[15px] font-medium">No downloads yet</p>
            <p className="text-gray-600 text-[13px] mt-1">Start downloading from any movie or series page.</p>
          </div>
        )}

        {/* Smart Download Settings */}
        <section className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
          <h2 className="text-[15px] font-bold text-white mb-4">Smart Download</h2>
          <div className="space-y-4">
            {[
              { label: 'Wi-Fi Only', desc: 'Only download on Wi-Fi connections', value: wifiOnly, onChange: () => setWifiOnly(!wifiOnly) },
              { label: 'Pause On Battery', desc: 'Pause downloads when on battery power', value: pauseOnBattery, onChange: () => setPauseOnBattery(!pauseOnBattery) },
              { label: 'Delete After Watching', desc: 'Auto-delete downloads after watching', value: deleteAfterWatching, onChange: () => setDeleteAfterWatching(!deleteAfterWatching) },
              { label: 'Auto Download Next Episode', desc: 'Queue the next episode automatically', value: autoDownloadNext, onChange: () => setAutoDownloadNext(!autoDownloadNext) },
              { label: 'Prioritize Current Download', desc: 'Allocate more bandwidth to active download', value: prioritizeCurrent, onChange: () => setPrioritizeCurrent(!prioritizeCurrent) },
              { label: 'Download Highest Quality', desc: 'Always prefer the best available quality', value: highestQuality, onChange: () => setHighestQuality(!highestQuality) },
              { label: 'Download Subtitles', desc: 'Auto-download subtitles with content', value: autoSubtitles, onChange: () => setAutoSubtitles(!autoSubtitles) },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-3 border-b border-white/[0.04] last:border-0">
                <div>
                  <p className="text-[13px] text-white font-medium">{item.label}</p>
                  <p className="text-[12px] text-gray-500 mt-0.5">{item.desc}</p>
                </div>
                <Toggle enabled={item.value} onChange={item.onChange} />
              </div>
            ))}
          </div>
        </section>

        {/* Max Parallel */}
        <section className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
          <h2 className="text-[15px] font-bold text-white mb-3">Concurrent Downloads</h2>
          <div className="flex items-center gap-4">
            {[1, 2, 3, 5, 10].map((n) => (
              <button
                key={n}
                onClick={() => setMaxParallel(n)}
                className={`w-10 h-10 rounded-xl text-[13px] font-bold transition-all ${
                  maxParallel === n
                    ? 'bg-exyo-red text-white'
                    : 'bg-white/[0.04] text-gray-400 hover:bg-white/[0.08] hover:text-white'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </section>

        {/* Download Location */}
        <section className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
          <h2 className="text-[15px] font-bold text-white mb-3">Download Location</h2>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-[13px] text-gray-300 font-mono">
              {downloadLocation}
            </div>
            <button className="bg-white/[0.06] border border-white/[0.08] text-white px-4 py-2.5 rounded-xl text-[13px] font-semibold hover:bg-white/[0.1] transition-colors">
              Browse
            </button>
            <button className="bg-white/[0.06] border border-white/[0.08] text-white px-4 py-2.5 rounded-xl text-[13px] font-semibold hover:bg-white/[0.1] transition-colors">
              Open
            </button>
          </div>
        </section>

        {/* Cache */}
        <section className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
          <h2 className="text-[15px] font-bold text-white mb-3">Cache</h2>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <p className="text-[18px] font-bold text-white">1.2 GB</p>
              <p className="text-[11px] text-gray-500">Used Space</p>
            </div>
            <div className="text-center">
              <p className="text-[18px] font-bold text-green-400">48.8 GB</p>
              <p className="text-[11px] text-gray-500">Free Space</p>
            </div>
            <div className="text-center">
              <p className="text-[18px] font-bold text-white">50 GB</p>
              <p className="text-[11px] text-gray-500">Total</p>
            </div>
          </div>
          <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden mb-4">
            <div className="h-full bg-exyo-red rounded-full" style={{ width: '2.4%' }} />
          </div>
          <div className="flex gap-3">
            <button className="bg-white/[0.06] border border-white/[0.08] text-white px-4 py-2 rounded-xl text-[13px] font-semibold hover:bg-white/[0.1] transition-colors">
              Clear Cache
            </button>
            <button className="bg-white/[0.06] border border-white/[0.08] text-white px-4 py-2 rounded-xl text-[13px] font-semibold hover:bg-white/[0.1] transition-colors">
              Optimize Storage
            </button>
          </div>
        </section>
      </div>
    </SettingsLayout>
  );
}
