import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Menu, X, LogOut, Settings, ChevronDown } from 'lucide-react';
import Logo, { ELogo } from './Logo';
import { useAuthStore } from '../stores/authStore';

const NAV_LINKS = [
  { path: '/home', label: 'Home' },
  { path: '/movies', label: 'Movies' },
  { path: '/tv', label: 'Series' },
  { path: '/home?catalogId=anime', label: 'Anime' },
];

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const lastScroll = useRef(0);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = () => {
      const st = window.scrollY;
      setScrolled(st > 40);
      setHidden(st > lastScroll.current && st > 200);
      lastScroll.current = st;
    };
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setProfileOpen(false);
    setSearchOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (searchOpen) {
      const handler = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setSearchOpen(false);
      };
      window.addEventListener('keydown', handler);
      return () => window.removeEventListener('keydown', handler);
    }
  }, [searchOpen]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isActive = useCallback(
    (path: string) => {
      const full = location.pathname + location.search;
      if (path === '/home')
        return (
          (location.pathname === '/home' || location.pathname === '/') &&
          !location.search.includes('catalogId=anime')
        );
      if (path.includes('?')) return full === path;
      return location.pathname === path || location.pathname.startsWith(path + '/');
    },
    [location]
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <motion.header
        initial={false}
        animate={{ y: hidden ? -100 : 0 }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
          scrolled ? 'glass glass-border' : 'bg-gradient-to-b from-black/60 to-transparent'
        }`}
      >
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="flex items-center justify-between h-16 lg:h-[72px]">
            <Link to="/home" className="shrink-0">
              <Logo size="sm" />
            </Link>

            <nav className="hidden lg:flex items-center gap-1">
              {NAV_LINKS.map(({ path, label }) => (
                <Link
                  key={path}
                  to={path}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive(path)
                      ? 'text-white bg-white/[0.08]'
                      : 'text-white/50 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  {label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setSearchOpen(true)}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white/50 hover:text-white hover:bg-white/[0.06] transition-all"
              >
                <Search className="w-5 h-5" />
              </button>

              {user ? (
                <div ref={profileRef} className="relative">
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-white/[0.06] transition-all"
                  >
                    <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <ELogo size={32} />
                      )}
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 text-white/40 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {profileOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-56 glass glass-border rounded-2xl p-2 card-shadow"
                      >
                        <div className="px-3 py-2.5 border-b border-white/[0.06] mb-1">
                          <p className="text-sm font-medium text-white truncate">{user.displayName || user.username || 'User'}</p>
                          <p className="text-xs text-white/40 truncate">{user.email}</p>
                        </div>
                        <Link to="/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/[0.06] transition-all">
                          <Settings className="w-4 h-4" /> Settings
                        </Link>
                        <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/[0.06] transition-all">
                          <LogOut className="w-4 h-4" /> Sign Out
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-xl bg-red text-white text-sm font-semibold hover:bg-red-hover transition-colors"
                >
                  Sign In
                </Link>
              )}

              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden w-10 h-10 rounded-xl flex items-center justify-center text-white/50 hover:text-white hover:bg-white/[0.06] transition-all"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 lg:hidden"
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
            <motion.nav
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="absolute right-0 top-0 bottom-0 w-72 glass-heavy border-l border-white/[0.06] p-6 pt-20"
            >
              <div className="flex flex-col gap-1">
                {NAV_LINKS.map(({ path, label }) => (
                  <Link
                    key={path}
                    to={path}
                    className={`px-4 py-3 rounded-xl text-base font-medium transition-all ${
                      isActive(path)
                        ? 'text-white bg-white/[0.08]'
                        : 'text-white/50 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh]"
          >
            <div className="absolute inset-0 bg-black/70 backdrop-blur-xl" onClick={() => setSearchOpen(false)} />
            <motion.form
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onSubmit={handleSearch}
              className="relative w-full max-w-2xl mx-4"
            >
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-white/30" />
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search movies, series, anime..."
                className="w-full glass glass-border rounded-2xl pl-14 pr-6 py-5 text-lg text-white placeholder-white/30 focus:outline-none focus:border-white/20 transition-colors"
              />
              <kbd className="absolute right-5 top-1/2 -translate-y-1/2 px-2 py-1 rounded-lg bg-white/[0.06] text-white/30 text-xs font-mono">
                ESC
              </kbd>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
