import { useState } from 'react';
import { useMutation } from 'convex/react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { api } from '../../convex/_generated/api';
import { useToast } from '../components/Toast';

const SETTINGS_NAV = [
  { label: 'Profile', path: '/settings', icon: (
    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  )},
  { label: 'Addons', path: '/settings/addons', icon: (
    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 16.875h3.375m0 0h3.375m-3.375 0V13.5m0 3.375v3.375M6 10.5h2.25a2.25 2.25 0 002.25-2.25V6a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 6v2.25A2.25 2.25 0 006 10.5zm0 9.75h2.25A2.25 2.25 0 0010.5 18v-2.25a2.25 2.25 0 00-2.25-2.25H6a2.25 2.25 0 00-2.25 2.25V18A2.25 2.25 0 006 20.25zm9.75-9.75H18a2.25 2.25 0 002.25-2.25V6A2.25 2.25 0 0018 3.75h-2.25A2.25 2.25 0 0013.5 6v2.25a2.25 2.25 0 002.25 2.25z" />
    </svg>
  )},
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
    `w-full bg-white/[0.04] border rounded-2xl px-5 py-3.5 text-white text-[15px] placeholder-gray-500 focus:outline-none focus:border-exyo-red/40 focus:bg-white/[0.06] transition-all ${error ? 'border-red-500' : 'border-white/[0.08]'}`;

  return (
    <div className="min-h-screen bg-[#0B0B0B] pt-[100px] px-5 md:px-10 lg:px-14 pb-20">
      <div className="max-w-[1100px] mx-auto">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-[40px] md:text-[48px] font-black tracking-tight mb-2 text-white">Settings</h1>
            <p className="text-gray-400 text-[17px]">Manage your account and preferences</p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar */}
            <aside className="lg:w-60 flex-shrink-0">
              <nav className="flex lg:flex-col gap-1.5">
                {SETTINGS_NAV.map((section) => {
                  const isActive = location.pathname === section.path;
                  return (
                    <Link
                      key={section.path}
                      to={section.path}
                      className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl text-[15px] font-semibold transition-all duration-200 ${
                        isActive
                          ? 'bg-white/[0.08] text-white shadow-lg shadow-black/20'
                          : 'text-gray-500 hover:text-white hover:bg-white/[0.04]'
                      }`}
                    >
                      <span className={isActive ? 'text-white' : 'text-gray-600'}>{section.icon}</span>
                      {section.label}
                    </Link>
                  );
                })}
              </nav>
            </aside>

            {/* Main content */}
            <div className="flex-1 min-w-0 space-y-6">
              {/* Profile card */}
              <section className="bg-white/[0.02] border border-white/[0.06] rounded-[20px] p-8 md:p-9">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-exyo-red/10 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-exyo-red" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-[20px] font-bold text-white">Profile</h2>
                    <p className="text-gray-500 text-[14px] mt-0.5">Update your display name and personal information</p>
                  </div>
                </div>
                <div className="space-y-6">
                  <div>
                    <label className="block text-[14px] text-gray-400 mb-2.5 font-medium">Email</label>
                    <input
                      type="email"
                      value={user?.primaryEmailAddress?.emailAddress || ''}
                      disabled
                      className={`${inputClass()} cursor-not-allowed opacity-50`}
                    />
                    <p className="mt-2 text-[12px] text-gray-600">Managed by Clerk</p>
                  </div>
                  <div>
                    <label className="block text-[14px] text-gray-400 mb-2.5 font-medium">Display Name</label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className={inputClass(profileErrors.displayName)}
                    />
                    {profileErrors.displayName && <p className="mt-2 text-[13px] text-red-400">{profileErrors.displayName}</p>}
                  </div>
                  <button onClick={handleProfileSubmit} className="bg-exyo-red text-white px-8 py-3.5 rounded-2xl font-bold text-[15px] hover:bg-exyo-red-dark transition-all duration-200 shadow-lg shadow-exyo-red/20 hover:shadow-exyo-red/30">
                    Save Changes
                  </button>
                </div>
              </section>

              {/* Account info card */}
              <section className="bg-white/[0.02] border border-white/[0.06] rounded-[20px] p-8 md:p-9">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-white/[0.04] flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-[20px] font-bold text-white">Account</h2>
                    <p className="text-gray-500 text-[14px] mt-0.5">View your account details</p>
                  </div>
                </div>
                <div className="space-y-0">
                  <div className="flex justify-between items-center py-4 border-b border-white/[0.04]">
                    <span className="text-gray-400 text-[14px]">User ID</span>
                    <span className="text-gray-300 font-mono text-[13px] bg-white/[0.04] px-3 py-1.5 rounded-xl">{user?.id}</span>
                  </div>
                  <div className="flex justify-between items-center py-4 border-b border-white/[0.04]">
                    <span className="text-gray-400 text-[14px]">Account created</span>
                    <span className="text-gray-300 text-[14px]">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center py-4">
                    <span className="text-gray-400 text-[14px]">Last sign in</span>
                    <span className="text-gray-300 text-[14px]">{user?.lastSignInAt ? new Date(user.lastSignInAt).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </div>
              </section>

              {/* Streaming card */}
              <section className="bg-white/[0.02] border border-white/[0.06] rounded-[20px] p-8 md:p-9">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-white/[0.04] flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5A1.125 1.125 0 0118 18.375M20.625 4.5H3.375m17.25 0c.621 0 1.125.504 1.125 1.125M20.625 4.5h-1.5C18.504 4.5 18 5.004 18 5.625m3.75 0v1.5c0 .621-.504 1.125-1.125 1.125M3.375 4.5c-.621 0-1.125.504-1.125 1.125M3.375 4.5h1.5C5.496 4.5 6 5.004 6 5.625m-3.75 0v1.5c0 .621.504 1.125 1.125 1.125m0 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m1.5-3.75C5.496 8.25 6 7.746 6 7.125v-1.5M4.875 8.25C5.496 8.25 6 8.754 6 9.375v1.5m0-5.25v5.25m0-5.25C6 5.004 6.504 4.5 7.125 4.5h9.75c.621 0 1.125.504 1.125 1.125m1.125 2.625h1.5m-1.5 0A1.125 1.125 0 0118 7.125v-1.5m1.125 2.625c-.621 0-1.125.504-1.125 1.125v1.5m2.625-2.625c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125M18 5.625v5.25M7.125 12h9.75m-9.75 0A1.125 1.125 0 016 10.875M7.125 12C6.504 12 6 12.504 6 13.125m0-2.25C6 11.496 5.496 12 4.875 12M18 10.875c0 .621-.504 1.125-1.125 1.125M18 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m-12 5.25v-5.25m0 5.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125m-12 0v-1.5c0-.621-.504-1.125-1.125-1.125M18 18.375v-5.25m0 5.25v-1.5c0-.621.504-1.125 1.125-1.125M18 13.125v1.5c0 .621.504 1.125 1.125 1.125M18 13.125c0-.621.504-1.125 1.125-1.125M6 13.125v1.5c0 .621-.504 1.125-1.125 1.125M6 13.125C6 12.504 5.496 12 4.875 12m-1.5 0h1.5m-1.5 0c-.621 0-1.125-.504-1.125-1.125v-1.5c0-.621.504-1.125 1.125-1.125m1.5 3.75c-.621 0-1.125-.504-1.125-1.125" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-[20px] font-bold text-white">Streaming</h2>
                    <p className="text-gray-500 text-[14px] mt-0.5">Configure your streaming preferences</p>
                  </div>
                </div>
                <div className="bg-white/[0.03] rounded-2xl p-6 flex items-center justify-between">
                  <div>
                    <p className="text-white text-[15px] font-medium">Stremio Addons</p>
                    <p className="text-gray-500 text-[13px] mt-1">Configure content sources and streaming providers</p>
                  </div>
                  <Link
                    to="/settings/addons"
                    className="bg-white/[0.06] border border-white/[0.08] text-white px-6 py-2.5 rounded-2xl text-[14px] font-semibold hover:bg-white/[0.1] transition-colors flex items-center gap-2 flex-shrink-0"
                  >
                    Manage
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </section>

              {/* Danger zone */}
              <section className="bg-red-950/20 border border-red-500/20 rounded-[20px] p-8 md:p-9">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-[20px] font-bold text-red-400">Danger Zone</h2>
                    <p className="text-gray-500 text-[14px] mt-0.5">Permanently delete your account and all data</p>
                  </div>
                </div>
                <p className="text-gray-400 text-[14px] mb-6">Once you delete your account, there is no going back. Please be certain.</p>
                <button className="bg-red-600 text-white px-8 py-3.5 rounded-2xl font-bold text-[15px] hover:bg-red-700 transition-all duration-200 opacity-50 cursor-not-allowed shadow-lg shadow-red-600/20">
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
