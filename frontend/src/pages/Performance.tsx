import { usePerformanceStore } from '../store/appStore';
import SettingsLayout from '../components/SettingsLayout';

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

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
          {icon}
        </div>
        <div>
          <p className="text-[11px] text-gray-500">{label}</p>
          <p className="text-[15px] font-bold text-white">{value}</p>
        </div>
      </div>
    </div>
  );
}

export default function Performance() {
  const store = usePerformanceStore();

  return (
    <SettingsLayout title="Performance" subtitle="Monitor and optimize app performance.">
      <div className="space-y-6">
        {/* Live Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <StatCard
            icon={<svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" /></svg>}
            label="GPU Decode"
            value={store.gpuDecode ? 'Active' : 'Disabled'}
            color="bg-green-500/10"
          />
          <StatCard
            icon={<svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25zm.75-12h9v9h-9v-9z" /></svg>}
            label="Hardware Acceleration"
            value={store.hardwareAcceleration ? 'Enabled' : 'Disabled'}
            color="bg-blue-500/10"
          />
          <StatCard
            icon={<svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L12 12.75 6.429 9.75m11.142 0l4.179 2.25-9.75 5.25-9.75-5.25 4.179-2.25" /></svg>}
            label="Memory Usage"
            value={store.gpuDecode ? "Active" : "N/A"}
            color="bg-purple-500/10"
          />
          <StatCard
            icon={<svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>}
            label="CPU Usage"
            value="N/A"
            color="bg-orange-500/10"
          />
          <StatCard
            icon={<svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" /></svg>}
            label="Network"
            value="Connected"
            color="bg-cyan-500/10"
          />
          <StatCard
            icon={<svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>}
            label="Streaming Buffer"
            value={`${store.streamingBuffer}s`}
            color="bg-yellow-500/10"
          />
        </div>

        {/* Settings */}
        <section className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
          <h2 className="text-[15px] font-bold text-white mb-4">Optimization</h2>
          <div className="space-y-4">
            {[
              { label: 'GPU Decode', desc: 'Use GPU for video decoding (requires restart)', value: store.gpuDecode, onChange: () => store.setGpuDecode(!store.gpuDecode) },
              { label: 'Hardware Acceleration', desc: 'Enable hardware-accelerated rendering', value: store.hardwareAcceleration, onChange: () => store.setHardwareAcceleration(!store.hardwareAcceleration) },
              { label: 'Cache', desc: 'Cache content for faster loading', value: store.cacheEnabled, onChange: () => store.setCacheEnabled(!store.cacheEnabled) },
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

        {/* Buffer Size */}
        <section className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
          <h2 className="text-[15px] font-bold text-white mb-4">Streaming Buffer</h2>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={5}
              max={60}
              value={store.streamingBuffer}
              onChange={(e) => store.setStreamingBuffer(Number(e.target.value))}
              className="flex-1 accent-exyo-red"
            />
            <span className="text-[13px] text-gray-400 font-mono w-12 text-right">{store.streamingBuffer}s</span>
          </div>
          <p className="text-[12px] text-gray-500 mt-2">Larger buffers use more memory but improve streaming stability.</p>
        </section>
      </div>
    </SettingsLayout>
  );
}
