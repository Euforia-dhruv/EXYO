import Logo from './Logo';

const LINKS = {
  Product: ['Features', 'Pricing', 'Changelog'],
  Company: ['About', 'Blog', 'Careers'],
  Legal: ['Privacy', 'Terms', 'DMCA'],
};

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.04] mt-20">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-10 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          <div>
            <Logo size="sm" />
            <p className="text-white/30 text-sm mt-4 leading-relaxed max-w-[240px]">
              Stream everything. Movies, series, anime — all free.
            </p>
          </div>
          {Object.entries(LINKS).map(([heading, links]) => (
            <div key={heading}>
              <h4 className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-4">{heading}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link}>
                    <span className="text-white/30 hover:text-white/60 text-sm transition-colors cursor-pointer">
                      {link}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-white/[0.04] mt-12 pt-8 flex items-center justify-between">
          <p className="text-white/20 text-xs">&copy; 2026 EXYO. All rights reserved.</p>
          <p className="text-white/20 text-xs">Built with passion</p>
        </div>
      </div>
    </footer>
  );
}
