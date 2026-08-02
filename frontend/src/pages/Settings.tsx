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
    `w-full bg-white/5 border rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-white/20 focus:bg-white/10 transition-all ${error ? 'border-red-500' : 'border-white/10'}`;

  return (
    <div className="min-h-screen pt-24 px-6 md:px-12 pb-12">
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h1 className="text-3xl font-bold mb-8">Settings</h1>

          <div className="flex flex-col md:flex-row gap-8">
            <aside className="md:w-56 flex-shrink-0">
              <nav className="flex md:flex-col gap-1">
                {SETTINGS_SECTIONS.map((section) => (
                  <Link
                    key={section.path}
                    to={section.path}
                    className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                      location.pathname === section.path
                        ? 'bg-white/10 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {section.label}
                  </Link>
                ))}
              </nav>
            </aside>

            <div className="flex-1 min-w-0">
              <section className="mb-8 bg-white/5 backdrop-blur-sm border border-white/5 rounded-2xl p-6">
                <h2 className="text-lg font-semibold mb-5">Profile</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Email</label>
                    <input
                      type="email"
                      value={user?.primaryEmailAddress?.emailAddress || ''}
                      disabled
                      className={`${inputClass()} cursor-not-allowed opacity-50`}
                    />
                    <p className="mt-1 text-xs text-gray-600">Email is managed by Clerk</p>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Display Name</label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className={inputClass(profileErrors.displayName)}
                    />
                    {profileErrors.displayName && <p className="mt-1 text-sm text-red-400">{profileErrors.displayName}</p>}
                  </div>
                  <button onClick={handleProfileSubmit} className="bg-[#E50914] text-white px-6 py-2.5 rounded-lg font-semibold text-sm hover:bg-red-700 transition-colors">
                    Save Changes
                  </button>
                </div>
              </section>

              <section className="mb-8 bg-white/5 backdrop-blur-sm border border-white/5 rounded-2xl p-6">
                <h2 className="text-lg font-semibold mb-5">Account</h2>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">User ID</span>
                    <span className="text-gray-300 font-mono text-xs">{user?.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Account created</span>
                    <span className="text-gray-300">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Last sign in</span>
                    <span className="text-gray-300">{user?.lastSignInAt ? new Date(user.lastSignInAt).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </div>
              </section>

              <section className="mb-8 bg-white/5 backdrop-blur-sm border border-white/5 rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold mb-1">Addons</h2>
                    <p className="text-sm text-gray-500">Manage your Stremio addons for content streaming.</p>
                  </div>
                  <Link
                    to="/settings/addons"
                    className="bg-white/5 border border-white/10 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors flex items-center gap-2"
                  >
                    Manage
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </section>

              <section className="bg-red-500/5 backdrop-blur-sm border border-red-500/20 rounded-2xl p-6">
                <h2 className="text-lg font-semibold mb-2 text-red-400">Danger Zone</h2>
                <p className="text-gray-500 text-sm mb-4">Once you delete your account, there is no going back. Please be certain.</p>
                <button className="bg-red-600 text-white px-6 py-2.5 rounded-lg font-semibold text-sm hover:bg-red-700 transition-colors opacity-50 cursor-not-allowed">
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
