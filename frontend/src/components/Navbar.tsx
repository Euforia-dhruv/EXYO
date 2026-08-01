import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setShowDropdown(false);
  }, [location]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowSearch(false);
      setSearchQuery('');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitial = () => {
    if (user?.displayName) return user.displayName[0].toUpperCase();
    if (user?.username) return user.username[0].toUpperCase();
    return 'U';
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled ? 'bg-black/95' : 'bg-gradient-to-b from-black/80 to-transparent'
    }`}>
      <div className="flex items-center justify-between px-4 md:px-12 h-16">
        <div className="flex items-center gap-8">
          <Link to="/" className="text-exyo-red text-2xl font-bold tracking-wider">
            EXYO
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-sm hover:text-exyo-gray transition-colors">
              Home
            </Link>
            <Link to="/?type=tv" className="text-sm hover:text-exyo-gray transition-colors">
              TV Shows
            </Link>
            <Link to="/?type=movie" className="text-sm hover:text-exyo-gray transition-colors">
              Movies
            </Link>
            <Link to="/my-list" className="text-sm hover:text-exyo-gray transition-colors">
              My List
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="p-2 hover:bg-white/10 rounded transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>

          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 p-1 hover:bg-white/10 rounded transition-colors"
            >
              <div className="w-8 h-8 bg-exyo-red rounded flex items-center justify-center text-sm font-semibold">
                {getInitial()}
              </div>
              <svg className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showDropdown && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-black/95 border border-white/10 rounded shadow-xl animate-fadeIn">
                <div className="py-2">
                  <div className="px-4 py-2 text-sm text-exyo-gray border-b border-white/10">
                    {user?.username}
                  </div>
                  <Link
                    to="/settings"
                    className="block px-4 py-2 text-sm hover:bg-white/10 transition-colors"
                  >
                    Settings
                  </Link>
                  <Link
                    to="/my-list"
                    className="block px-4 py-2 text-sm hover:bg-white/10 transition-colors"
                  >
                    My List
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-white/10 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showSearch && (
        <div className="absolute top-full left-0 right-0 bg-black/95 p-4 animate-slideUp">
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search titles, genres..."
                className="w-full bg-exyo-secondary border border-white/20 rounded px-4 py-3 pl-12 text-white placeholder-exyo-gray focus:outline-none focus:border-white/40"
                autoFocus
              />
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-exyo-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </form>
        </div>
      )}
    </nav>
  );
}
