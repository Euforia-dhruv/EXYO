import Logo from './Logo';

export default function Footer() {
  return (
    <footer className="mt-16 pb-12 px-6 md:px-12">
      <div className="max-w-6xl mx-auto">
        <Logo variant="mark" className="h-8 mb-6 opacity-50" />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div>
            <h3 className="text-sm font-semibold text-white mb-3">Browse</h3>
            <ul className="space-y-2">
              <li><a href="/" className="text-sm text-gray-500 hover:text-white transition-colors">Home</a></li>
              <li><a href="/?type=movie" className="text-sm text-gray-500 hover:text-white transition-colors">Movies</a></li>
              <li><a href="/?type=tv" className="text-sm text-gray-500 hover:text-white transition-colors">TV Shows</a></li>
              <li><a href="/my-list" className="text-sm text-gray-500 hover:text-white transition-colors">My List</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white mb-3">Account</h3>
            <ul className="space-y-2">
              <li><a href="/settings" className="text-sm text-gray-500 hover:text-white transition-colors">Settings</a></li>
              <li><a href="/settings/addons" className="text-sm text-gray-500 hover:text-white transition-colors">Addons</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white mb-3">Help</h3>
            <ul className="space-y-2">
              <li><span className="text-sm text-gray-500">FAQ</span></li>
              <li><span className="text-sm text-gray-500">Contact</span></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white mb-3">Legal</h3>
            <ul className="space-y-2">
              <li><span className="text-sm text-gray-500">Privacy Policy</span></li>
              <li><span className="text-sm text-gray-500">Terms of Service</span></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 pt-6">
          <p className="text-xs text-gray-600">
            &copy; {new Date().getFullYear()} EXYO. Stream Everything.
          </p>
        </div>
      </div>
    </footer>
  );
}
