import { HeartIcon, CodeBracketIcon } from '@heroicons/react/24/outline';

export default function About() {
  return (
    <div className="animate-fade-in-up">
      <h2 className="text-white text-[20px] font-semibold tracking-tight mb-6">About EXYO</h2>

      <div className="bg-exyo-card rounded-2xl border border-white/[0.04] p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-exyo-red to-exyo-red-dark flex items-center justify-center">
            <svg viewBox="0 0 32 32" fill="none" className="w-6 h-6">
              <path d="M10 8L24 16L10 24V8Z" fill="white" />
            </svg>
          </div>
          <div>
            <h3 className="text-white text-[18px] font-bold">EXYO</h3>
            <p className="text-white/40 text-[12px]">Version 1.0.0</p>
          </div>
        </div>
        <p className="text-white/50 text-[13px] leading-relaxed">
          EXYO is a modern streaming platform that lets you watch movies, TV shows, and anime directly in your browser.
          Powered by community-built addons, EXYO aggregates content from multiple sources for a seamless viewing experience.
        </p>
      </div>

      {/* Tech Stack */}
      <div className="bg-exyo-card rounded-2xl border border-white/[0.04] p-5 mb-6">
        <h3 className="text-white text-[14px] font-semibold mb-3">Built With</h3>
        <div className="grid grid-cols-2 gap-2">
          {['React 19', 'Vite', 'Tailwind CSS', 'Convex', 'Clerk', 'HLS.js', 'movi-player', 'WebCodecs'].map((tech) => (
            <span key={tech} className="px-3 py-2 rounded-lg bg-white/[0.03] text-white/50 text-[12px] font-medium text-center border border-white/[0.03]">
              {tech}
            </span>
          ))}
        </div>
      </div>

      {/* Links */}
      <div className="flex gap-3">
        <a
          href="https://github.com/Euforia-dhruv/EXYO"
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-white/60 hover:text-white text-[13px] font-medium transition-all duration-200 border border-white/[0.06]"
        >
          <CodeBracketIcon className="w-4 h-4" />
          GitHub
        </a>
      </div>

      <p className="text-center text-white/15 text-[11px] mt-8">
        Made with <HeartIcon className="w-3 h-3 inline text-exyo-red fill-current" /> for streaming enthusiasts
      </p>
    </div>
  );
}
