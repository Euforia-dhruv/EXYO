import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { userApi } from '../api/user.api';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../components/Toast';
import { validatePasswordChange, validateDisplayName } from '../utils/validation';

export default function Settings() {
  const { user, logout } = useAuthStore();
  const { showToast } = useToast();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});

  const profileMutation = useMutation({
    mutationFn: () => userApi.updateProfile({ displayName, email }),
    onSuccess: () => {
      showToast('Profile updated successfully', 'success');
      setProfileErrors({});
    },
    onError: (err: any) => {
      const message = err.response?.data?.error || 'Failed to update profile';
      showToast(message, 'error');
    }
  });

  const passwordMutation = useMutation({
    mutationFn: () => userApi.changePassword(currentPassword, newPassword),
    onSuccess: () => {
      showToast('Password changed successfully', 'success');
      setPasswordErrors({});
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    },
    onError: (err: any) => {
      const message = err.response?.data?.error || 'Failed to change password';
      showToast(message, 'error');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: userApi.deleteAccount,
    onSuccess: () => {
      showToast('Account deleted', 'info');
      logout();
      window.location.href = '/login';
    },
    onError: () => {
      showToast('Failed to delete account', 'error');
    }
  });

  const handleProfileSubmit = () => {
    setProfileErrors({});

    const nameError = validateDisplayName(displayName);
    if (nameError) {
      setProfileErrors({ displayName: nameError });
      return;
    }

    profileMutation.mutate();
  };

  const handlePasswordSubmit = () => {
    setPasswordErrors({});

    const errors = validatePasswordChange(currentPassword, newPassword, confirmPassword);
    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }

    passwordMutation.mutate();
  };

  const handleDeleteAccount = () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      deleteMutation.mutate();
    }
  };

  return (
    <div className="min-h-screen pt-24 px-4 md:px-12 pb-12">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Settings</h1>

        <section className="mb-8 bg-exyo-secondary p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Profile</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-exyo-gray mb-2">Username</label>
              <input
                type="text"
                value={user?.username || ''}
                disabled
                className="w-full bg-exyo-dark border border-exyo-hover rounded px-4 py-3 text-exyo-gray cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-exyo-gray">Username cannot be changed</p>
            </div>
            <div>
              <label className="block text-sm text-exyo-gray mb-2">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className={`w-full bg-exyo-dark border rounded px-4 py-3 text-white focus:outline-none focus:border-white/40 ${
                  profileErrors.displayName ? 'border-red-500' : 'border-exyo-hover'
                }`}
              />
              {profileErrors.displayName && (
                <p className="mt-1 text-sm text-red-400">{profileErrors.displayName}</p>
              )}
            </div>
            <div>
              <label className="block text-sm text-exyo-gray mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-exyo-dark border border-exyo-hover rounded px-4 py-3 text-white focus:outline-none focus:border-white/40"
              />
            </div>
            <button
              onClick={handleProfileSubmit}
              disabled={profileMutation.isPending}
              className="bg-exyo-red text-white px-6 py-2 rounded font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {profileMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </section>

        <section className="mb-8 bg-exyo-secondary p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Change Password</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-exyo-gray mb-2">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={`w-full bg-exyo-dark border rounded px-4 py-3 text-white focus:outline-none focus:border-white/40 ${
                  passwordErrors.currentPassword ? 'border-red-500' : 'border-exyo-hover'
                }`}
              />
              {passwordErrors.currentPassword && (
                <p className="mt-1 text-sm text-red-400">{passwordErrors.currentPassword}</p>
              )}
            </div>
            <div>
              <label className="block text-sm text-exyo-gray mb-2">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={`w-full bg-exyo-dark border rounded px-4 py-3 text-white focus:outline-none focus:border-white/40 ${
                  passwordErrors.newPassword ? 'border-red-500' : 'border-exyo-hover'
                }`}
              />
              {passwordErrors.newPassword && (
                <p className="mt-1 text-sm text-red-400">{passwordErrors.newPassword}</p>
              )}
            </div>
            <div>
              <label className="block text-sm text-exyo-gray mb-2">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full bg-exyo-dark border rounded px-4 py-3 text-white focus:outline-none focus:border-white/40 ${
                  passwordErrors.confirmPassword ? 'border-red-500' : 'border-exyo-hover'
                }`}
              />
              {passwordErrors.confirmPassword && (
                <p className="mt-1 text-sm text-red-400">{passwordErrors.confirmPassword}</p>
              )}
            </div>
            <button
              onClick={handlePasswordSubmit}
              disabled={passwordMutation.isPending}
              className="bg-exyo-red text-white px-6 py-2 rounded font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {passwordMutation.isPending ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </section>

        <section className="bg-exyo-secondary p-6 rounded-lg border border-red-500/30">
          <h2 className="text-xl font-semibold mb-4 text-red-500">Danger Zone</h2>
          <p className="text-exyo-gray text-sm mb-4">
            Once you delete your account, there is no going back. Please be certain.
          </p>
          <button
            onClick={handleDeleteAccount}
            disabled={deleteMutation.isPending}
            className="bg-red-600 text-white px-6 py-2 rounded font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete Account'}
          </button>
        </section>
      </div>
    </div>
  );
}
