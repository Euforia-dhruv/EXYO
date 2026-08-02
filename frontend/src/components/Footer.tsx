export default function Footer() {
  return (
    <footer className="mt-16 pb-8 px-4 md:px-8 lg:px-12">
      <div className="max-w-6xl mx-auto">
        <img
          src="/logo-Photoroom.png"
          alt="EXYO"
          className="h-8 opacity-40"
          draggable={false}
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6 mb-8">
          <div>
            <h3 className="text-xs font-bold text-exyo-gray mb-3 uppercase tracking-wider">Browse</h3>
            <ul className="space-y-2">
              <li><a href="/" className="text-sm text-exyo-muted hover:text-white transition-colors">Home</a></li>
              <li><a href="/?type=movie" className="text-sm text-exyo-muted hover:text-white transition-colors">Movies</a></li>
              <li><a href="/?type=tv" className="text-sm text-exyo-muted hover:text-white transition-colors">TV Shows</a></li>
              <li><a href="/my-list" className="text-sm text-exyo-muted hover:text-white transition-colors">My List</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-bold text-exyo-gray mb-3 uppercase tracking-wider">Account</h3>
            <ul className="space-y-2">
              <li><a href="/settings" className="text-sm text-exyo-muted hover:text-white transition-colors">Settings</a></li>
              <li><a href="/settings/addons" className="text-sm text-exyo-muted hover:text-white transition-colors">Addons</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-bold text-exyo-gray mb-3 uppercase tracking-wider">Help</h3>
            <ul className="space-y-2">
              <li><span className="text-sm text-exyo-muted">FAQ</span></li>
              <li><span className="text-sm text-exyo-muted">Contact</span></li>
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-bold text-exyo-gray mb-3 uppercase tracking-wider">Legal</h3>
            <ul className="space-y-2">
              <li><span className="text-sm text-exyo-muted">Privacy Policy</span></li>
              <li><span className="text-sm text-exyo-muted">Terms of Service</span></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-exyo-border pt-4">
          <p className="text-xs text-exyo-muted/50">
            &copy; {new Date().getFullYear()} EXYO. Stream Everything.
          </p>
        </div>
      </div>
    </footer>
  );
}
