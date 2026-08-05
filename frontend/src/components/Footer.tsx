import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="mt-16 pb-10 px-6 md:px-12 lg:px-16">
      <div className="max-w-6xl mx-auto">
        <img
          src="/logo-Photoroom.png"
          alt="EXYO"
          className="h-8 opacity-20 mb-8"
          draggable={false}
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          <div>
            <h3 className="text-[11px] font-bold text-gray-500 mb-4 uppercase tracking-widest">Browse</h3>
            <ul className="space-y-2.5">
              <li><Link to="/" className="text-sm text-gray-400 hover:text-white transition-colors">Home</Link></li>
              <li><Link to="/?type=movie" className="text-sm text-gray-400 hover:text-white transition-colors">Movies</Link></li>
              <li><Link to="/?type=tv" className="text-sm text-gray-400 hover:text-white transition-colors">TV Shows</Link></li>
              <li><Link to="/my-list" className="text-sm text-gray-400 hover:text-white transition-colors">My List</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-[11px] font-bold text-gray-500 mb-4 uppercase tracking-widest">Account</h3>
            <ul className="space-y-2.5">
              <li><Link to="/settings" className="text-sm text-gray-400 hover:text-white transition-colors">Settings</Link></li>
              <li><Link to="/settings/streaming" className="text-sm text-gray-400 hover:text-white transition-colors">Extensions</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-[11px] font-bold text-gray-500 mb-4 uppercase tracking-widest">Legal</h3>
            <ul className="space-y-2.5">
              <li><Link to="/continue-watching" className="text-sm text-gray-400 hover:text-white transition-colors">Continue Watching</Link></li>
              <li><Link to="/settings/downloads" className="text-sm text-gray-400 hover:text-white transition-colors">Downloads</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-[11px] font-bold text-gray-500 mb-4 uppercase tracking-widest">Legal</h3>
            <ul className="space-y-2.5">
              <li><span className="text-sm text-gray-400">Privacy Policy</span></li>
              <li><span className="text-sm text-gray-400">Terms of Service</span></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 pt-6">
          <p className="text-[12px] text-gray-500">
            &copy; {new Date().getFullYear()} EXYO. Stream Everything.
          </p>
        </div>
      </div>
    </footer>
  );
}
