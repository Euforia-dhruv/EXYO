import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser, useClerk } from '@clerk/clerk-react';
import { useDownloadStore } from '../store/downloadStore';

const NAV_LINKS = [
  { label: 'Home', path: '/' },
  { label: 'TV Shows', path: '/?type=tv' },
  { label: 'Movies', path: '/?type=movie' },
  { label: 'My List', path: '/my-list' },
  { label: 'Downloads', path: '/settings/downloads' },
];

export default function Navbar() {
  const [showBackground, setShowBackground] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [navVisible, setNavVisible] = useState(true);
  const lastScrollY = useRef(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const location = useLocation();
  const activeDownloads = useDownloadStore((s) => s.getActiveDownloads().length);
  const totalDownloads = useDownloadStore((s) => s.downloads.filter((d) => d.status !== 'completed').length);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(true);
      }
      if (e.key === 'Escape') {
        setShowSearch(false);
        setShowMobileMenu(false);
        setShowDropdown(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setShowBackground(currentScrollY > 50);

      if (currentScrollY > lastScrollY.current && currentScrollY > 100 && !showDropdown) {
        setNavVisible(false);
      } else {
        setNavVisible(true);
      }
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [showDropdown]);

  useEffect(() => {
    setShowDropdown(false);
    setShowSearch(false);
    setShowMobileMenu(false);
  }, [location]);

  useEffect(() => {
    if (showSearch) searchInputRef.current?.focus();
  }, [showSearch]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowSearch(false);
      setSearchQuery('');
    }
  }, [searchQuery, navigate]);

  const handleLogout = useCallback(async () => {
    await signOut();
    navigate('/login');
  }, [signOut, navigate]);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          navVisible ? 'translate-y-0' : '-translate-y-full'
        } ${
          showBackground
            ? 'bg-exyo-black/95 backdrop-blur-xl shadow-2xl shadow-black/50'
            : 'bg-gradient-to-b from-exyo-black/80 via-exyo-black/40 to-transparent'
        }`}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="flex items-center justify-between px-6 md:px-12 lg:px-16 h-[72px]">
          {/* Left */}
          <div className="flex items-center gap-10">
            <Link to="/" className="flex-shrink-0 hover:opacity-80 transition-opacity duration-300">
              <img
                src="/Exyologo-Photoroom.png"
                alt="EXYO"
                className="h-10 w-auto"
                draggable={false}
              />
            </Link>

            <div className="hidden lg:flex items-center gap-0.5">
              {NAV_LINKS.map(({ label, path }) => (
                <Link
                  key={path}
                  to={path}
                  className={`relative px-3.5 py-2 text-[14px] font-medium transition-colors duration-200 ${
                    isActive(path)
                      ? 'text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {label}
                  {isActive(path) && (
                    <motion.div
                      layoutId="navIndicator"
                      className="absolute bottom-0 left-3.5 right-3.5 h-[2px] bg-exyo-red rounded-full"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              ))}
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-1">
            {/* Search */}
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="p-2.5 hover:bg-white/10 rounded-full transition-colors duration-200"
              aria-label="Search"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </button>

            {/* Downloads indicator */}
            <Link
              to="/settings/downloads"
              className="relative p-2.5 hover:bg-white/10 rounded-full transition-colors duration-200"
              aria-label="Downloads"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              {totalDownloads > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-exyo-red text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {totalDownloads}
                </span>
              )}
            </Link>

            {/* Mobile hamburger */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="lg:hidden p-2.5 hover:bg-white/10 rounded-full transition-colors duration-200"
              aria-label="Menu"
              aria-expanded={showMobileMenu}
            >
              {showMobileMenu ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>

            {/* Profile */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 p-1 pl-1 pr-2 hover:bg-white/10 rounded-full transition-colors duration-200"
                aria-label="User menu"
                aria-expanded={showDropdown}
                aria-haspopup="true"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-exyo-red">
                  {user?.imageUrl ? (
                    <img src={user.imageUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white font-bold text-xs">
                      {(user?.fullName || 'U')[0]}
                    </div>
                  )}
                </div>
                <motion.svg
                  animate={{ rotate: showDropdown ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="w-3.5 h-3.5 hidden sm:block text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path d="M19 9l-7 7-7-7" />
                </motion.svg>
              </button>

              <AnimatePresence>
                {showDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute right-0 top-full mt-3 w-64 bg-exyo-surface/95 backdrop-blur-2xl border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/60 overflow-hidden"
                  >
                    {/* User info */}
                    <div className="px-4 py-3.5 border-b border-white/[0.06]">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-exyo-red">
                          {user?.imageUrl ? (
                            <img src={user.imageUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm">
                              {(user?.fullName || 'U')[0]}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-white truncate">
                            {user?.fullName || user?.username || 'User'}
                          </p>
                          <p className="text-[11px] text-gray-500 truncate mt-0.5">
                            {user?.primaryEmailAddress?.emailAddress}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Links */}
                    <div className="py-1.5">
                      {[
                        { label: 'My List', path: '/my-list', icon: 'M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z' },
                        { label: 'Continue Watching', path: '/continue-watching', icon: 'M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
                        { label: 'Downloads', path: '/settings/downloads', icon: 'M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3' },
                        { label: 'Settings', path: '/settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
                        { label: 'Extensions', path: '/settings/streaming', icon: 'M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L12 12.75 6.429 9.75m11.142 0l4.179 2.25-9.75 5.25-9.75-5.25 4.179-2.25' },
                      ].map(({ label, path, icon }) => (
                        <Link
                          key={`${path}-${label}`}
                          to={path}
                          className="flex items-center gap-3 px-4 py-2.5 text-[13px] text-gray-400 hover:bg-white/[0.06] hover:text-white transition-colors duration-150"
                        >
                          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                          </svg>
                          {label}
                          {label === 'Downloads' && activeDownloads > 0 && (
                            <span className="ml-auto bg-exyo-red text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                              {activeDownloads}
                            </span>
                          )}
                        </Link>
                      ))}
                    </div>

                    {/* Sign out */}
                    <div className="border-t border-white/[0.06] py-1.5">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-gray-500 hover:bg-white/[0.06] hover:text-exyo-red transition-colors duration-150"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {showMobileMenu && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="lg:hidden overflow-hidden border-t border-white/[0.06]"
            >
              <div className="px-6 py-4 bg-exyo-black/95 backdrop-blur-xl">
                {NAV_LINKS.map(({ label, path }) => (
                  <Link
                    key={path}
                    to={path}
                    className={`block px-4 py-3 text-[14px] font-medium rounded-xl transition-colors duration-150 ${
                      isActive(path)
                        ? 'text-white bg-white/[0.06]'
                        : 'text-gray-400 hover:text-white hover:bg-white/[0.06]'
                    }`}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search overlay */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden border-t border-white/[0.06]"
            >
              <div className="px-6 md:px-12 lg:px-16 py-4 bg-exyo-black/95 backdrop-blur-xl">
                <form onSubmit={handleSearch} className="max-w-2xl mx-auto relative">
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <circle cx="11" cy="11" r="8" />
                    <path d="M21 21l-4.35-4.35" />
                  </svg>
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Titles, genres, people"
                    className="w-full bg-white/[0.06] border border-white/[0.08] rounded-full pl-12 pr-14 py-3 text-[14px] text-white placeholder-gray-500 focus:outline-none focus:border-exyo-red/40 focus:bg-white/[0.08] transition-all duration-300"
                    aria-label="Search"
                  />
                  <kbd className="absolute right-14 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-medium text-gray-500 bg-white/[0.06] border border-white/[0.08] rounded-lg">
                    ⌘K
                  </kbd>
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-full transition-colors"
                    >
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </>
  );
}
