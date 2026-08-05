import { memo } from 'react';
import { Link } from 'react-router-dom';
import Logo from './Logo';

const Footer = memo(function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative mt-32 border-t border-white/[0.04]">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-10 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-14">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Logo size="sm" />
            <p className="text-white/30 text-[13px] mt-4 leading-relaxed max-w-[240px]">
              Stream movies, TV shows, and anime in your browser. Powered by community addons.
            </p>
          </div>

          {/* Browse */}
          <div>
            <h4 className="text-white/50 text-[11px] font-semibold uppercase tracking-[0.16em] mb-4">Browse</h4>
            <ul className="space-y-2.5">
              {[
                { to: '/home', label: 'Home' },
                { to: '/movies', label: 'Movies' },
                { to: '/tv', label: 'TV Shows' },
                { to: '/search?type=anime', label: 'Anime' },
              ].map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-white/35 hover:text-white text-[13px] transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="text-white/50 text-[11px] font-semibold uppercase tracking-[0.16em] mb-4">Account</h4>
            <ul className="space-y-2.5">
              {[
                { to: '/settings', label: 'Settings' },
                { to: '/my-list', label: 'My List' },
                { to: '/continue-watching', label: 'Continue Watching' },
                { to: '/downloads', label: 'Downloads' },
              ].map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-white/35 hover:text-white text-[13px] transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white/50 text-[11px] font-semibold uppercase tracking-[0.16em] mb-4">Legal</h4>
            <ul className="space-y-2.5">
              {[
                { to: '/settings/about', label: 'About EXYO' },
                { to: 'https://github.com/Euforia-dhruv/EXYO', label: 'GitHub', external: true },
              ].map((link) => (
                <li key={link.to}>
                  {link.external ? (
                    <a
                      href={link.to}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white/35 hover:text-white text-[13px] transition-colors duration-200"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      to={link.to}
                      className="text-white/35 hover:text-white text-[13px] transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-white/[0.04] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/20 text-[12px]">
            &copy; {currentYear} EXYO. All rights reserved.
          </p>
          <p className="text-white/15 text-[11px]">
            EXYO does not host any content. All media is provided by third-party addons.
          </p>
        </div>
      </div>
    </footer>
  );
});

export default Footer;
