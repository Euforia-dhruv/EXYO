export default function Footer() {
  return (
    <footer className="mt-16 pb-10 px-5 md:px-10 lg:px-14">
      <div className="max-w-6xl mx-auto">
        <img
          src="/logo-Photoroom.png"
          alt="EXYO"
          className="h-8 opacity-30 mb-8"
          draggable={false}
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          <div>
            <h3 className="text-[11px] font-bold text-gray-500 mb-4 uppercase tracking-widest">Browse</h3>
            <ul className="space-y-2.5">
              <li><a href="/" className="text-sm text-gray-400 hover:text-white transition-colors">Home</a></li>
              <li><a href="/?type=movie" className="text-sm text-gray-400 hover:text-white transition-colors">Movies</a></li>
              <li><a href="/?type=tv" className="text-sm text-gray-400 hover:text-white transition-colors">TV Shows</a></li>
              <li><a href="/my-list" className="text-sm text-gray-400 hover:text-white transition-colors">My List</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-[11px] font-bold text-gray-500 mb-4 uppercase tracking-widest">Account</h3>
            <ul className="space-y-2.5">
              <li><a href="/settings" className="text-sm text-gray-400 hover:text-white transition-colors">Settings</a></li>
              <li><a href="/settings/addons" className="text-sm text-gray-400 hover:text-white transition-colors">Addons</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-[11px] font-bold text-gray-500 mb-4 uppercase tracking-widest">Help</h3>
            <ul className="space-y-2.5">
              <li><span className="text-sm text-gray-400">FAQ</span></li>
              <li><span className="text-sm text-gray-400">Contact</span></li>
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
          <p className="text-[12px] text-gray-600">
            &copy; {new Date().getFullYear()} EXYO. Stream Everything.
          </p>
        </div>
      </div>
    </footer>
  );
}
