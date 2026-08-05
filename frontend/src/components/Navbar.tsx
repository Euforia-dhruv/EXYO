import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useUser, useClerk, SignOutButton } from '@clerk/clerk-react';
import { useTheme } from '../providers/AppearanceProvider';
import {
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
  MagnifyingGlassIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowUpTrayIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  PlayIcon,
  ListBulletIcon,
  HomeModernIcon,
  FilmIcon,
  TvIcon,
} from '@heroicons/react/24/outline';
import { useQueryClient } from '@tanstack/react-query';
import Logo from './Logo';

const NAV_LINKS = [
  { path: '/home', label: 'Home', icon: HomeModernIcon },
  { path: '/movies', label: 'Movies', icon: FilmIcon },
  { path: '/tv', label: 'TV Shows', icon: TvIcon },
  { path: '/my-list', label: 'My List', icon: ListBulletIcon },
  { path: '/continue-watching', label: 'Continue Watching', icon: PlayIcon },
];

const API_URL = import.meta.env.VITE_CONVEX_SITE_URL;

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileHoverTimeout, setProfileHoverTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [clearHistoryModalOpen, setClearHistoryModalOpen] = useState(false);
  const [isClearingHistory, setIsClearingHistory] = useState(false);
  const [clearHistoryConfirmText, setClearHistoryConfirmText] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const { user, isSignedIn } = useUser();
  const { signOut } = useClerk();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 16);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (location.pathname === '/search') setSearchOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) searchInputRef.current.focus();
  }, [searchOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  useEffect(() => {
    setMobileOpen(false);
    setProfileOpen(false);
    setSearchOpen(false);
    setClearHistoryModalOpen(false);
    setClearHistoryConfirmText('');
  }, [location.pathname]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setMobileOpen(false);
        setProfileOpen(false);
        setClearHistoryModalOpen(false);
        setClearHistoryConfirmText('');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) {
      navigate(`/search?q=${encodeURIComponent(q)}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  }, [searchQuery, navigate]);

  const handleProfileEnter = useCallback(() => {
    if (profileHoverTimeout) {
      clearTimeout(profileHoverTimeout);
      setProfileHoverTimeout(null);
    }
    setProfileOpen(true);
  }, [profileHoverTimeout]);

  const handleProfileLeave = useCallback(() => {
    const timeout = setTimeout(() => setProfileOpen(false), 200);
    setProfileHoverTimeout(timeout);
  }, []);

  const isActive = (path: string) => {
    if (path === '/home') return location.pathname === '/home' || location.pathname === '/';
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const handleDeleteAccount = useCallback(async () => {
    if (!user || deleteConfirmText !== user.username) return;
    setIsDeleting(true);
    try {
      const token = await user.getToken({ template: 'convex' });
      if (!token) throw new Error('Failed to get authentication token');
      const response = await fetch(`${API_URL}/delete-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ clerkId: user.id }),
      });
      if (!response.ok) throw new Error('Failed to delete user data');
      await user.delete();
      window.location.href = '/login';
    } catch (err) {
      console.error('Delete account error:', err);
    } finally {
      setIsDeleting(false);
    }
  }, [user, deleteConfirmText]);

  const handleClearHistory = useCallback(async () => {
    if (!user || clearHistoryConfirmText !== 'CLEAR ALL') return;
    setIsClearingHistory(true);
    try {
      const token = await user.getToken({ template: 'convex' });
      if (!token) throw new Error('Failed to get authentication token');
      const response = await fetch(`${API_URL}/clear-history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ clerkId: user.id }),
      });
      if (!response.ok) throw new Error('Failed to clear history');
      setClearHistoryModalOpen(false);
      setClearHistoryConfirmText('');
      await queryClient.invalidateQueries({ queryKey: ['watchHistory'] });
    } catch (err) {
      console.error('Clear history error:', err);
    } finally {
      setIsClearingHistory(false);
    }
  }, [user, clearHistoryConfirmText, queryClient]);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-out ${
          isScrolled
            ? 'glass shadow-elevated py-2.5'
            : 'bg-gradient-to-b from-black/60 to-transparent py-3.5'
        }`}
      >
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 flex items-center justify-between h-12">
          {/* Left */}
          <div className="flex items-center gap-8">
            <Logo size="sm" />
            {/* Desktop nav */}
            <div className="hidden lg:flex items-center gap-1">
              {NAV_LINKS.map(({ path, label }) => (
                <Link
                  key={path}
                  to={path}
                  className={`px-3 py-1.5 text-[13px] font-medium rounded-lg transition-all duration-200 ${
                    isActive(path)
                      ? 'text-white'
                      : 'text-white/60 hover:text-white hover:bg-white/[0.06]'
                  }`}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-1.5">
            {/* Search */}
            <Link
              to="/search"
              className="hidden sm:flex items-center gap-2 pl-3 pr-4 py-2 rounded-full bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.06] text-white/60 hover:text-white transition-all duration-200 text-[13px] min-w-[160px]"
            >
              <MagnifyingGlassIcon className="w-4 h-4 shrink-0" />
              <span>Search...</span>
            </Link>
            <button
              onClick={() => navigate('/search')}
              className="sm:hidden p-2.5 rounded-full hover:bg-white/[0.08] text-white/60 hover:text-white transition-all duration-200"
              aria-label="Search"
            >
              <MagnifyingGlassIcon className="w-5 h-5" />
            </button>

            {isSignedIn ? (
              <>
                {/* Profile */}
                <div
                  ref={profileRef}
                  className="relative hidden sm:block"
                  onMouseEnter={handleProfileEnter}
                  onMouseLeave={handleProfileLeave}
                >
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 pl-2 pr-2.5 py-1 rounded-full hover:bg-white/[0.08] transition-all duration-200"
                    aria-expanded={profileOpen}
                    aria-haspopup="true"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-exyo-red to-exyo-red-dark flex items-center justify-center text-white text-sm font-bold overflow-hidden">
                      {user?.imageUrl ? (
                        <img src={user.imageUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        (user?.username?.[0] || user?.emailAddresses?.[0]?.emailAddress?.[0] || 'U').toUpperCase()
                      )}
                    </div>
                  </button>

                  {profileOpen && (
                    <div
                      className="absolute right-0 top-full mt-2 w-64 glass rounded-2xl shadow-elevated overflow-hidden animate-fade-in-down py-2"
                      onMouseEnter={handleProfileEnter}
                      onMouseLeave={handleProfileLeave}
                    >
                      <div className="px-5 py-3.5 border-b border-white/[0.06]">
                        <p className="text-white text-[13px] font-medium truncate">{user?.username || 'User'}</p>
                        <p className="text-white/40 text-[12px] truncate mt-0.5">
                          {user?.emailAddresses?.[0]?.emailAddress}
                        </p>
                      </div>
                      <div className="py-1.5">
                        <Link
                          to="/settings"
                          className="flex items-center gap-3 px-5 py-2.5 text-white/70 hover:text-white hover:bg-white/[0.06] transition-all duration-150 text-[13px]"
                        >
                          <Cog6ToothIcon className="w-[18px] h-[18px]" />
                          Settings
                        </Link>
                        <button
                          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                          className="w-full flex items-center gap-3 px-5 py-2.5 text-white/70 hover:text-white hover:bg-white/[0.06] transition-all duration-150 text-[13px]"
                        >
                          {theme === 'dark' ? (
                            <SunIcon className="w-[18px] h-[18px]" />
                          ) : (
                            <MoonIcon className="w-[18px] h-[18px]" />
                          )}
                          {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                        </button>
                        <button
                          onClick={() => setTheme('system')}
                          className="w-full flex items-center gap-3 px-5 py-2.5 text-white/70 hover:text-white hover:bg-white/[0.06] transition-all duration-150 text-[13px]"
                        >
                          <ComputerDesktopIcon className="w-[18px] h-[18px]" />
                          System Theme
                        </button>
                        <div className="my-1.5 border-t border-white/[0.06]" />
                        <button
                          onClick={() => setClearHistoryModalOpen(true)}
                          className="w-full flex items-center gap-3 px-5 py-2.5 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 transition-all duration-150 text-[13px]"
                        >
                          <TrashIcon className="w-[18px] h-[18px]" />
                          Clear History
                        </button>
                        <div className="my-1.5 border-t border-white/[0.06]" />
                        <button
                          onClick={() => setDeleteModalOpen(true)}
                          className="w-full flex items-center gap-3 px-5 py-2.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-150 text-[13px]"
                        >
                          <ExclamationTriangleIcon className="w-[18px] h-[18px]" />
                          Delete Account
                        </button>
                      </div>
                      <div className="border-t border-white/[0.06] pt-1.5 px-3">
                        <SignOutButton>
                          <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-white/70 hover:text-white transition-all duration-200 text-[13px] font-medium">
                            <ArrowRightOnRectangleIcon className="w-[18px] h-[18px]" />
                            Sign Out
                          </button>
                        </SignOutButton>
                      </div>
                    </div>
                  )}
                </div>

                {/* Mobile menu toggle */}
                <button
                  onClick={() => setMobileOpen(!mobileOpen)}
                  className="lg:hidden p-2.5 rounded-full hover:bg-white/[0.08] text-white/60 hover:text-white transition-all duration-200"
                  aria-label="Menu"
                  aria-expanded={mobileOpen}
                >
                  {mobileOpen ? <XMarkIcon className="w-5 h-5" /> : <Bars3Icon className="w-5 h-5" />}
                </button>
              </>
            ) : (
              <div className="hidden sm:flex items-center gap-2.5">
                <Link
                  to="/login"
                  className="px-5 py-2 text-[13px] font-medium text-white/70 hover:text-white rounded-full hover:bg-white/[0.06] transition-all duration-200"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2 text-[13px] font-semibold text-white bg-exyo-red hover:bg-exyo-red-hover rounded-full transition-all duration-200 shadow-lg shadow-exyo-red/20 hover:shadow-exyo-red/30"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="absolute top-0 right-0 w-[min(320px,85vw)] h-full glass-heavy shadow-2xl animate-slide-in-left overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 pt-20 flex flex-col gap-1">
              {NAV_LINKS.map(({ path, label, icon: Icon }) => (
                <Link
                  key={path}
                  to={path}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-[15px] font-medium transition-all duration-200 ${
                    isActive(path)
                      ? 'text-white bg-white/[0.08]'
                      : 'text-white/60 hover:text-white hover:bg-white/[0.05]'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {label}
                </Link>
              ))}
              <div className="mt-4 mb-2 border-t border-white/[0.06]" />
              <Link
                to="/settings"
                className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-[15px] font-medium text-white/60 hover:text-white hover:bg-white/[0.05] transition-all duration-200"
              >
                <Cog6ToothIcon className="w-5 h-5" />
                Settings
              </Link>
              <div className="mt-auto pt-4 border-t border-white/[0.06]">
                <SignOutButton>
                  <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-white/70 hover:text-white transition-all duration-200 text-[14px] font-medium">
                    <ArrowRightOnRectangleIcon className="w-5 h-5" />
                    Sign Out
                  </button>
                </SignOutButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={() => setDeleteModalOpen(false)}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-md bg-[#1A1A1A] rounded-3xl shadow-2xl p-8 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center mb-6">
              <ExclamationTriangleIcon className="w-7 h-7 text-red-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Delete Account</h3>
            <p className="text-white/50 text-sm mb-6 leading-relaxed">
              This action is irreversible. All your data including watch history, watchlist, settings, and downloads will be permanently deleted.
            </p>
            <p className="text-white/70 text-sm mb-2">
              Type <span className="font-mono font-bold text-white bg-white/10 px-2 py-0.5 rounded">{user?.username}</span> to confirm:
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              className="w-full bg-white/[0.06] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 mb-6 transition-all placeholder-white/30"
              placeholder="Enter username"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setDeleteModalOpen(false); setDeleteConfirmText(''); }}
                className="flex-1 py-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-white/70 hover:text-white transition-all text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== user?.username || isDeleting}
                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white transition-all text-sm font-semibold disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-red-600"
              >
                {isDeleting ? 'Deleting...' : 'Delete Forever'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear History Modal */}
      {clearHistoryModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={() => setClearHistoryModalOpen(false)}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-md bg-[#1A1A1A] rounded-3xl shadow-2xl p-8 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-6">
              <TrashIcon className="w-7 h-7 text-amber-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Clear Watch History</h3>
            <p className="text-white/50 text-sm mb-6 leading-relaxed">
              This will remove all your watch progress. You will need to restart from the beginning for all titles.
            </p>
            <p className="text-white/70 text-sm mb-2">
              Type <span className="font-mono font-bold text-white bg-white/10 px-2 py-0.5 rounded">CLEAR ALL</span> to confirm:
            </p>
            <input
              type="text"
              value={clearHistoryConfirmText}
              onChange={(e) => setClearHistoryConfirmText(e.target.value)}
              className="w-full bg-white/[0.06] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 mb-6 transition-all placeholder-white/30"
              placeholder="Type CLEAR ALL"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setClearHistoryModalOpen(false); setClearHistoryConfirmText(''); }}
                className="flex-1 py-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-white/70 hover:text-white transition-all text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleClearHistory}
                disabled={clearHistoryConfirmText !== 'CLEAR ALL' || isClearingHistory}
                className="flex-1 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white transition-all text-sm font-semibold disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-amber-600"
              >
                {isClearingHistory ? 'Clearing...' : 'Clear History'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Spacer */}
      <div className="h-16" />
    </>
  );
}
