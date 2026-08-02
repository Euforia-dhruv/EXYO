import { useState } from 'react';
import { useMutation } from 'convex/react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { api } from '../../convex/_generated/api';
import { useToast } from '../components/Toast';

const SETTINGS_NAV = [
  { label: 'Profile', path: '/settings', icon: '👤' },
  { label: 'Addons', path: '/settings/addons', icon: '🔌' },
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
    `w-full bg-white/5 border rounded-2xl px-4 py-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-exyo-red/50 focus:bg-white/8 transition-all ${error ? 'border-red-500' : 'border-white/10'}`;

  return (
    <div className="min-h-screen bg-exyo-dark pt-[100px] px-4 md:px-8 lg:px-12 pb-16">
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          {/* Header */}
          <div className="mb-10">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2">Settings</h1>
            <p className="text-gray-400 text-[15px]">Manage your account and preferences</p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar */}
            <aside className="lg:w-56 flex-shrink-0">
              <nav className="flex lg:flex-row gap-1 lg:gap-2">
                {SETTINGS_NAV.map((section) => {
                  const isActive = location.pathname === section.path;
                  return (
                    <Link
                      key={section.path}
                      to={section.path}
                      className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl text-[14px] font-semibold transition-all duration-200 ${
                        isActive
                          ? 'bg-white/10 text-white shadow-lg shadow-black/20'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <span className="text-lg">{section.icon}</span>
                      {section.label}
                    </Link>
                  );
                })}
              </nav>
            </aside>

            {/* Main content */}
            <div className="flex-1 min-w-0 space-y-6">
              {/* Profile card */}
              <section className="bg-white/[0.03] border border-white/[0.06] rounded-3xl p-8">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-14 h-14 rounded-2xl bg-exyo-red/10 flex items-center justify-center text-2xl">
                    👤
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Profile</h2>
                    <p className="text-gray-400 text-sm">Update your display name and personal information</p>
                  </div>
                </div>
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2 font-medium">Email</label>
                    <input
                      type="email"
                      value={user?.primaryEmailAddress?.emailAddress || ''}
                      disabled
                      className={`${inputClass()} cursor-not-allowed opacity-50`}
                    />
                    <p className="mt-1.5 text-xs text-gray-600">Managed by Clerk</p>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2 font-medium">Display Name</label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className={inputClass(profileErrors.displayName)}
                    />
                    {profileErrors.displayName && <p className="mt-1.5 text-sm text-red-400">{profileErrors.displayName}</p>}
                  </div>
                  <button onClick={handleProfileSubmit} className="bg-exyo-red text-white px-8 py-3 rounded-2xl font-bold text-sm hover:bg-exyo-red-dark transition-colors shadow-lg shadow-exyo-red/20">
                    Save Changes
                  </button>
                </div>
              </section>

              {/* Account info card */}
              <section className="bg-white/[0.03] border border-white/[0.06] rounded-3xl p-8">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-2xl">
                    ⚙️
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Account</h2>
                    <p className="text-gray-400 text-sm">View your account details</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-white/5">
                    <span className="text-gray-400 text-sm">User ID</span>
                    <span className="text-gray-300 font-mono text-xs bg-white/5 px-3 py-1 rounded-xl">{user?.id}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-white/5">
                    <span className="text-gray-400 text-sm">Account created</span>
                    <span className="text-gray-300 text-sm">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <span className="text-gray-400 text-sm">Last sign in</span>
                    <span className="text-gray-300 text-sm">{user?.lastSignInAt ? new Date(user.lastSignInAt).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </div>
              </section>

              {/* Addons card */}
              <section className="bg-white/[0.03] border border-white/[0.06] rounded-3xl p-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-2xl">
                      🔌
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white mb-1">Addons</h2>
                      <p className="text-gray-400 text-sm">Manage your Stremio addons for content streaming</p>
                    </div>
                  </div>
                  <Link
                    to="/settings/addons"
                    className="bg-white/5 border border-white/10 text-white px-6 py-3 rounded-2xl text-sm font-semibold hover:bg-white/10 transition-colors flex items-center gap-2"
                  >
                    Manage
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </section>

              {/* Danger zone */}
              <section className="bg-red-950/20 border border-red-500/20 rounded-3xl p-8">
                <h2 className="text-xl font-bold mb-2 text-red-400">Danger Zone</h2>
                <p className="text-gray-400 text-sm mb-6">Once you delete your account, there is no going back. Please be certain.</p>
                <button className="bg-red-600 text-white px-8 py-3 rounded-2xl font-bold text-sm hover:bg-red-700 transition-colors opacity-50 cursor-not-allowed">
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
