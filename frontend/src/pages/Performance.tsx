import { useState, useEffect } from 'react';
import { CpuChipIcon, ArrowPathIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { cn } from '../utils/helpers';

export default function Performance() {
  const [hardwareAcceleration, setHardwareAcceleration] = useState(true);
  const [webcodecsSupported, setWebcodecsSupported] = useState(false);
  const [webglSupported, setWebglSupported] = useState(false);

  useEffect(() => {
    setWebcodecsSupported('VideoDecoder' in window && 'VideoEncoder' in window);
    try {
      const canvas = document.createElement('canvas');
      setWebglSupported(!!canvas.getContext('webgl2') || !!canvas.getContext('webgl'));
    } catch {
      setWebglSupported(false);
    }
  }, []);

  const capabilities = [
    { label: 'WebCodecs', supported: webcodecsSupported, description: 'Hardware video decoding' },
    { label: 'WebGL', supported: webglSupported, description: 'GPU-accelerated rendering' },
    { label: 'Service Worker', supported: 'serviceWorker' in navigator, description: 'Offline support' },
    { label: 'Fetch API', supported: 'fetch' in window, description: 'Streaming network requests' },
  ];

  return (
    <div className="animate-fade-in-up">
      <h2 className="text-white text-[20px] font-semibold tracking-tight mb-6">Performance</h2>

      {/* Hardware Acceleration */}
      <div className="bg-exyo-card rounded-2xl border border-white/[0.04] p-5 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CpuChipIcon className="w-5 h-5 text-exyo-red" />
            <div>
              <p className="text-white text-[14px] font-medium">Hardware Acceleration</p>
              <p className="text-white/40 text-[12px] mt-0.5">Use GPU for video decoding when available</p>
            </div>
          </div>
          <button
            onClick={() => setHardwareAcceleration(!hardwareAcceleration)}
            className={cn(
              'relative w-12 h-7 rounded-full transition-all duration-200',
              hardwareAcceleration ? 'bg-exyo-red' : 'bg-white/10'
            )}
            role="switch"
            aria-checked={hardwareAcceleration}
          >
            <div
              className={cn(
                'absolute top-1 w-5 h-5 rounded-full bg-white transition-all duration-200',
                hardwareAcceleration ? 'left-6' : 'left-1'
              )}
            />
          </button>
        </div>
      </div>

      {/* Browser Capabilities */}
      <div className="bg-exyo-card rounded-2xl border border-white/[0.04] overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.04]">
          <h3 className="text-white text-[14px] font-semibold">Browser Capabilities</h3>
        </div>
        <div className="divide-y divide-white/[0.03]">
          {capabilities.map(({ label, supported, description }) => (
            <div key={label} className="flex items-center justify-between px-5 py-3.5">
              <div>
                <p className="text-white text-[13px] font-medium">{label}</p>
                <p className="text-white/30 text-[11px] mt-0.5">{description}</p>
              </div>
              {supported ? (
                <CheckCircleIcon className="w-5 h-5 text-emerald-400" />
              ) : (
                <span className="text-white/20 text-[12px]">Not supported</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
