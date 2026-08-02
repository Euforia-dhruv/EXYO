import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useUser } from '@clerk/clerk-react';
import { userApi } from '../api/user.api';
import { useToast } from '../components/Toast';
import { useState } from 'react';

export default function Settings() {
  const { user } = useUser();
  const { showToast } = useToast();

  const [displayName, setDisplayName] = useState(user?.fullName || '');
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});

  const profileMutation = useMutation({
    mutationFn: () => userApi.updateProfile({ displayName }),
    onSuccess: () => {
      showToast('Profile updated successfully', 'success');
      setProfileErrors({});
    },
    onError: (err: any) => {
      showToast(err.response?.data?.error || 'Failed to update profile', 'error');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: userApi.deleteAccount,
    onSuccess: () => {
      showToast('Account deleted', 'info');
      window.location.href = '/login';
    },
    onError: () => showToast('Failed to delete account', 'error'),
  });

  const handleProfileSubmit = () => {
    setProfileErrors({});
    if (!displayName.trim()) {
      setProfileErrors({ displayName: 'Display name is required' });
      return;
    }
    profileMutation.mutate();
  };

  const inputClass = (error?: string) =>
    `w-full bg-white/5 border rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-white/20 focus:bg-white/10 transition-all ${error ? 'border-red-500' : 'border-white/10'}`;

  return (
    <div className="min-h-screen pt-24 px-6 md:px-12 pb-12">
      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h1 className="text-3xl font-bold mb-8">Settings</h1>

          {/* Profile */}
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
              <button onClick={handleProfileSubmit} disabled={profileMutation.isPending} className="bg-[#E50914] text-white px-6 py-2.5 rounded-lg font-semibold text-sm hover:bg-red-700 transition-colors disabled:opacity-50">
                {profileMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </section>

          {/* Account Info */}
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

          {/* Danger Zone */}
          <section className="bg-red-500/5 backdrop-blur-sm border border-red-500/20 rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-2 text-red-400">Danger Zone</h2>
            <p className="text-gray-500 text-sm mb-4">Once you delete your account, there is no going back. Please be certain.</p>
            <button onClick={() => { if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) deleteMutation.mutate(); }} disabled={deleteMutation.isPending} className="bg-red-600 text-white px-6 py-2.5 rounded-lg font-semibold text-sm hover:bg-red-700 transition-colors disabled:opacity-50">
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Account'}
            </button>
          </section>
        </motion.div>
      </div>
    </div>
  );
}
