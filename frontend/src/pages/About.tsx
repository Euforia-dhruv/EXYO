import SettingsLayout from '../components/SettingsLayout';

export default function About() {
  return (
    <SettingsLayout title="About" subtitle="Information about EXYO.">
      <div className="space-y-6">
        {/* Logo + Version */}
        <section className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-8 text-center">
          <img src="/Exyologo-Photoroom.png" alt="EXYO" className="h-16 mx-auto mb-4" draggable={false} />
          <p className="text-[13px] text-gray-400">Version 1.0.0</p>
          <p className="text-[12px] text-gray-600 mt-1">Built with React, Vite, Tailwind CSS, Convex & Clerk</p>
        </section>

        {/* Credits */}
        <section className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
          <h2 className="text-[15px] font-bold text-white mb-4">Technology</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { name: 'React 19', desc: 'UI framework' },
              { name: 'Vite 8', desc: 'Build tool' },
              { name: 'Tailwind CSS 4', desc: 'Styling' },
              { name: 'Convex', desc: 'Backend & database' },
              { name: 'Clerk', desc: 'Authentication' },
              { name: 'Framer Motion', desc: 'Animations' },
              { name: 'HLS.js', desc: 'Video streaming' },
              { name: 'Stremio', desc: 'Addon protocol' },
            ].map((tech) => (
              <div key={tech.name} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
                <p className="text-[13px] font-semibold text-white">{tech.name}</p>
                <p className="text-[11px] text-gray-500">{tech.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Links */}
        <section className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
          <h2 className="text-[15px] font-bold text-white mb-4">Links</h2>
          <div className="space-y-2">
            {[
              { label: 'Privacy Policy', href: '/privacy' },
              { label: 'Terms of Service', href: '/terms' },
              { label: 'Open Source Licenses', href: '/licenses' },
            ].map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-white/[0.04] transition-colors group"
              >
                <span className="text-[13px] text-gray-400 group-hover:text-white transition-colors">{link.label}</span>
                <svg className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </a>
            ))}
          </div>
        </section>
      </div>
    </SettingsLayout>
  );
}
