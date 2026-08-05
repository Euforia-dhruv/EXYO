import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Download, Trash2, Play } from 'lucide-react';
import { useDownloadStore } from '../store/downloadStore';

export default function Downloads() {
  const downloads = useDownloadStore((s) => s.downloads);
  const removeDownload = useDownloadStore((s) => s.removeDownload);

  const all = useMemo(() =>
    downloads.filter((d) => d.status === 'completed' || d.status === 'downloading' || d.status === 'queued'),
    [downloads]
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center">
          <Download className="w-5 h-5 text-white/40" />
        </div>
        <h1 className="text-white text-2xl font-extrabold tracking-tight">Downloads</h1>
      </div>

      {all.length === 0 ? (
        <div className="glass glass-border rounded-3xl p-12 text-center">
          <Download className="w-12 h-12 text-white/10 mx-auto mb-4" />
          <p className="text-white/50 font-medium mb-1">No downloads</p>
          <p className="text-white/25 text-sm">Downloaded content appears here</p>
        </div>
      ) : (
        <div className="space-y-2">
          {all.map((dl) => (
            <div key={dl.id} className="glass glass-border rounded-2xl p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/[0.04] flex items-center justify-center shrink-0">
                {dl.status === 'completed' ? <Play className="w-5 h-5 text-red" /> : <div className="w-5 h-5 border-2 border-red/30 border-t-red rounded-full animate-spin" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{dl.title}</p>
                <p className="text-xs text-white/30 mt-0.5">
                  {dl.status === 'completed' ? 'Downloaded' : `${Math.round(dl.progress || 0)}%`}
                </p>
              </div>
              <button onClick={() => removeDownload(dl.id)} className="p-2 rounded-xl hover:bg-white/[0.06] text-white/20 hover:text-red transition-all">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
