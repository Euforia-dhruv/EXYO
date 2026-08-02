import { useState } from 'react';
import { useMutation } from 'convex/react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { api } from '../../convex/_generated/api';
import { useToast } from '../components/Toast';

const SETTINGS_SECTIONS = [
  { label: 'Profile', path: '/settings' },
  { label: 'Addons', path: '/settings/addons' },
];

export default function Settings() {
  const { user } = useUser();
  const { showToast } = useToast();
  const location = useLocation();

  const [displayName, setDisplayName] = useState(user?.fullName || '');
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});

  const updateProfile = useMutation(api.users.updateProfile);

  const handleProfileSubmit = async () => {
    setProfileErrors({});
    if (!displayName.trim()) {
      setProfileErrors({ displayName: 'Display name is required' });
      return;
    }
    try {
      await updateProfile({ displayName });
      showToast('Profile updated successfully', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update profile', 'error');
    }
  };

  const inputClass = (error?: string) =>
    `w-full bg-exyo-secondary border rounded-netflix px-4 py-3 text-white text-sm placeholder-exyo-muted focus:outline-none focus:border-white/30 focus:bg-white/5 transition-all ${error ? 'border-red-500' : 'border-exyo-border'}`;

  return (
    <div className="min-h-screen bg-exyo-dark pt-[80px] px-4 md:px-8 lg:px-12 pb-12">
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <h1 className="text-3xl font-bold mb-8">Account Settings</h1>

          <div className="flex flex-col md:flex-row gap-8">
            {/* Sidebar */}
            <aside className="md:w-48 flex-shrink-0">
              <nav className="flex md:flex-col gap-0.5">
                {SETTINGS_SECTIONS.map((section) => (
                  <Link
                    key={section.path}
                    to={section.path}
                    className={`px-4 py-2.5 text-sm font-medium rounded-netflix transition-colors ${
                      location.pathname === section.path
                        ? 'bg-white/10 text-white'
                        : 'text-exyo-muted hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {section.label}
                  </Link>
                ))}
              </nav>
            </aside>

            {/* Main content */}
            <div className="flex-1 min-w-0 space-y-6">
              {/* Profile card */}
              <section className="bg-exyo-secondary border border-exyo-border rounded-netflix p-6">
                <h2 className="text-lg font-semibold mb-5">Profile</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-exyo-muted mb-2">Email</label>
                    <input
                      type="email"
                      value={user?.primaryEmailAddress?.emailAddress || ''}
                      disabled
                      className={`${inputClass()} cursor-not-allowed opacity-50`}
                    />
                    <p className="mt-1.5 text-xs text-exyo-muted/60">Managed by Clerk</p>
                  </div>
                  <div>
                    <label className="block text-sm text-exyo-muted mb-2">Display Name</label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className={inputClass(profileErrors.displayName)}
                    />
                    {profileErrors.displayName && <p className="mt-1.5 text-sm text-red-400">{profileErrors.displayName}</p>}
                  </div>
                  <button onClick={handleProfileSubmit} className="bg-exyo-red text-white px-6 py-2.5 rounded-netflix font-bold text-sm hover:bg-exyo-red-dark transition-colors">
                    Save Changes
                  </button>
                </div>
              </section>

              {/* Account info card */}
              <section className="bg-exyo-secondary border border-exyo-border rounded-netflix p-6">
                <h2 className="text-lg font-semibold mb-5">Account</h2>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center py-2 border-b border-exyo-border/50">
                    <span className="text-exyo-muted">User ID</span>
                    <span className="text-exyo-gray font-mono text-xs">{user?.id}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-exyo-border/50">
                    <span className="text-exyo-muted">Account created</span>
                    <span className="text-exyo-gray">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-exyo-muted">Last sign in</span>
                    <span className="text-exyo-gray">{user?.lastSignInAt ? new Date(user.lastSignInAt).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </div>
              </section>

              {/* Addons card */}
              <section className="bg-exyo-secondary border border-exyo-border rounded-netflix p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold mb-1">Addons</h2>
                    <p className="text-sm text-exyo-muted">Manage your Stremio addons for content streaming.</p>
                  </div>
                  <Link
                    to="/settings/addons"
                    className="bg-white/5 border border-exyo-border text-white px-5 py-2.5 rounded-netflix text-sm font-medium hover:bg-white/10 transition-colors flex items-center gap-2"
                  >
                    Manage
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </section>

              {/* Danger zone */}
              <section className="bg-red-950/20 border border-red-500/20 rounded-netflix p-6">
                <h2 className="text-lg font-semibold mb-2 text-red-400">Danger Zone</h2>
                <p className="text-exyo-muted text-sm mb-4">Once you delete your account, there is no going back. Please be certain.</p>
                <button className="bg-red-600 text-white px-6 py-2.5 rounded-netflix font-bold text-sm hover:bg-red-700 transition-colors opacity-50 cursor-not-allowed">
                  Delete Account
                </button>
              </section>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
