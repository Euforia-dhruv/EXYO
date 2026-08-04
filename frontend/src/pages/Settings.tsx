import { useState } from 'react';
import { useMutation } from 'convex/react';
import { useUser } from '@clerk/clerk-react';
import { api } from '../../convex/_generated/api';
import { useToast } from '../components/Toast';
import SettingsLayout from '../components/SettingsLayout';

export default function Settings() {
  const { user } = useUser();
  const { showToast } = useToast();
  const [displayName, setDisplayName] = useState(user?.fullName || '');
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const [language, setLanguage] = useState('en');
  const [subtitleLang, setSubtitleLang] = useState('en');
  const [region, setRegion] = useState('us');

  const updateProfile = useMutation(api.users.updateProfile);

  const handleProfileSubmit = async () => {
    setProfileErrors({});
    if (!displayName.trim()) {
      setProfileErrors({ displayName: 'Display name is required' });
      return;
    }
    try {
      const result = await updateProfile({ displayName });
      if (result.ok) {
        showToast('Profile updated successfully', 'success');
      } else {
        showToast(result.error || 'Failed to update profile', 'error');
      }
    } catch (err) {
      showToast('Something went wrong. Please try again.', 'error');
    }
  };

  const inputClass = (error?: string) =>
    `w-full bg-white/[0.04] border rounded-xl px-4 py-3 text-white text-[14px] placeholder-gray-500 focus:outline-none focus:border-exyo-red/40 focus:bg-white/[0.06] transition-all ${
      error ? 'border-red-500' : 'border-white/[0.08]'
    }`;

  return (
    <SettingsLayout title="Profile" subtitle="Manage your profile and preferences.">
      <div className="space-y-6">
        {/* Profile Card */}
        <section className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-7">
          {/* Avatar + Info */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 mb-7 pb-7 border-b border-white/[0.06]">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-exyo-red overflow-hidden flex-shrink-0 ring-4 ring-exyo-red/20">
                {user?.imageUrl ? (
                  <img src={user.imageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white font-black text-[28px]">
                    {(user?.fullName || 'U')[0]}
                  </div>
                )}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 bg-green-500 rounded-full border-[2.5px] border-[#0A0A0A] flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[18px] font-bold text-white truncate">{user?.fullName || 'User'}</h3>
              <p className="text-[14px] text-gray-400 truncate mt-0.5">{user?.primaryEmailAddress?.emailAddress}</p>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-[13px] text-gray-400 mb-2 font-medium">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className={inputClass(profileErrors.displayName)}
                  placeholder="Your display name"
                />
                {profileErrors.displayName && (
                  <p className="mt-1.5 text-[12px] text-red-400">{profileErrors.displayName}</p>
                )}
              </div>
              <div>
                <label className="block text-[13px] text-gray-400 mb-2 font-medium">Email</label>
                <input
                  type="email"
                  value={user?.primaryEmailAddress?.emailAddress || ''}
                  disabled
                  className={`${inputClass()} cursor-not-allowed opacity-50`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-[13px] text-gray-400 mb-2 font-medium">Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className={`${inputClass()} cursor-pointer`}
                >
                  <option value="en">English</option>
                  <option value="es">Espa&ntilde;ol</option>
                  <option value="fr">Fran&ccedil;ais</option>
                  <option value="de">Deutsch</option>
                  <option value="ja">Japanese</option>
                  <option value="ko">Korean</option>
                </select>
              </div>
              <div>
                <label className="block text-[13px] text-gray-400 mb-2 font-medium">Subtitle Language</label>
                <select
                  value={subtitleLang}
                  onChange={(e) => setSubtitleLang(e.target.value)}
                  className={`${inputClass()} cursor-pointer`}
                >
                  <option value="en">English</option>
                  <option value="es">Espa&ntilde;ol</option>
                  <option value="fr">Fran&ccedil;ais</option>
                  <option value="de">Deutsch</option>
                  <option value="ja">Japanese</option>
                  <option value="none">None</option>
                </select>
              </div>
              <div>
                <label className="block text-[13px] text-gray-400 mb-2 font-medium">Region</label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className={`${inputClass()} cursor-pointer`}
                >
                  <option value="us">United States</option>
                  <option value="gb">United Kingdom</option>
                  <option value="eu">Europe</option>
                  <option value="jp">Japan</option>
                  <option value="kr">South Korea</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleProfileSubmit}
              className="bg-exyo-red text-white px-6 py-2.5 rounded-xl font-bold text-[14px] hover:bg-exyo-red-dark transition-all duration-200 shadow-lg shadow-exyo-red/20"
            >
              Save Changes
            </button>
          </div>
        </section>
      </div>
    </SettingsLayout>
  );
}
