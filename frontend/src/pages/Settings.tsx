import { useState } from 'react';
import { useMutation } from 'convex/react';
import { useUser } from '@clerk/clerk-react';
import { api } from '../../convex/_generated/api';
import { useToast } from '../components/Toast';
import SettingsLayout from '../components/SettingsLayout';

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`relative w-12 h-7 rounded-full transition-colors duration-200 flex-shrink-0 ${
        enabled ? 'bg-exyo-red' : 'bg-white/10'
      }`}
    >
      <span
        className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ${
          enabled ? 'translate-x-[22px]' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 flex items-center gap-4">
      <div className="w-11 h-11 rounded-xl bg-white/[0.04] flex items-center justify-center flex-shrink-0 text-gray-500">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[13px] text-gray-500 font-medium">{label}</p>
        <p className="text-[15px] text-white font-medium truncate mt-0.5">{value}</p>
      </div>
    </div>
  );
}

export default function Settings() {
  const { user } = useUser();
  const { showToast } = useToast();

  const [displayName, setDisplayName] = useState(user?.fullName || '');
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});

  // Toggle states
  const [autoplay, setAutoplay] = useState(true);
  const [autoplayPreviews, setAutoplayPreviews] = useState(true);
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(false);
  const [recommendations, setRecommendations] = useState(true);
  const [watchHistory, setWatchHistory] = useState(true);
  const [analytics, setAnalytics] = useState(false);

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
    `w-full bg-white/[0.04] border rounded-2xl px-5 py-4 text-white text-[15px] placeholder-gray-500 focus:outline-none focus:border-exyo-red/40 focus:bg-white/[0.06] transition-all ${
      error ? 'border-red-500' : 'border-white/[0.08]'
    }`;

  return (
    <SettingsLayout
      title="Settings"
      subtitle="Manage your account, streaming preferences, addons and playback."
    >
      <div className="space-y-8">
        {/* ===== PROFILE CARD ===== */}
        <section className="bg-white/[0.02] border border-white/[0.06] rounded-[24px] p-8 md:p-9">
          <h2 className="text-[22px] font-bold text-white mb-6">Profile</h2>

          {/* Avatar + Info row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-8 pb-8 border-b border-white/[0.06]">
            <div className="relative">
              <div className="w-24 h-24 rounded-[20px] bg-exyo-red overflow-hidden flex-shrink-0 ring-4 ring-exyo-red/20">
                {user?.imageUrl ? (
                  <img src={user.imageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white font-black text-[32px]">
                    {(user?.fullName || 'U')[0]}
                  </div>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-green-500 rounded-full border-[3px] border-[#0A0A0A] flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[20px] font-bold text-white truncate">{user?.fullName || 'User'}</h3>
              <p className="text-[15px] text-gray-400 truncate mt-0.5">{user?.primaryEmailAddress?.emailAddress}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-[13px] font-semibold text-exyo-red bg-exyo-red/10 px-3 py-1 rounded-lg">
                  Free Plan
                </span>
                <span className="text-[13px] text-gray-500">Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-6">
            <div>
              <label className="block text-[14px] text-gray-400 mb-2.5 font-medium">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className={inputClass(profileErrors.displayName)}
                placeholder="Your display name"
              />
              {profileErrors.displayName && (
                <p className="mt-2 text-[13px] text-red-400">{profileErrors.displayName}</p>
              )}
            </div>
            <div>
              <label className="block text-[14px] text-gray-400 mb-2.5 font-medium">Email</label>
              <input
                type="email"
                value={user?.primaryEmailAddress?.emailAddress || ''}
                disabled
                className={`${inputClass()} cursor-not-allowed opacity-50`}
              />
              <p className="mt-2 text-[12px] text-gray-600">Managed by Clerk authentication</p>
            </div>
            <button
              onClick={handleProfileSubmit}
              className="bg-exyo-red text-white px-8 py-3.5 rounded-2xl font-bold text-[15px] hover:bg-exyo-red-dark transition-all duration-200 shadow-lg shadow-exyo-red/20 hover:shadow-exyo-red/30"
            >
              Save Changes
            </button>
          </div>
        </section>

        {/* ===== ACCOUNT DETAILS ===== */}
        <section className="bg-white/[0.02] border border-white/[0.06] rounded-[24px] p-8 md:p-9">
          <h2 className="text-[22px] font-bold text-white mb-6">Account Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoCard
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" /></svg>}
              label="User ID"
              value={user?.id || 'N/A'}
            />
            <InfoCard
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>}
              label="Account Created"
              value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
            />
            <InfoCard
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              label="Last Sign In"
              value={user?.lastSignInAt ? new Date(user.lastSignInAt).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
            />
            <InfoCard
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>}
              label="Authentication"
              value="Clerk (OAuth)"
            />
          </div>
        </section>

        {/* ===== STREAMING ===== */}
        <section className="bg-white/[0.02] border border-white/[0.06] rounded-[24px] p-8 md:p-9">
          <h2 className="text-[22px] font-bold text-white mb-2">Streaming</h2>
          <p className="text-gray-500 text-[14px] mb-8">Configure your content sources and streaming providers</p>

          <div className="space-y-6">
            <div className="bg-white/[0.03] rounded-2xl p-6 flex items-center justify-between">
              <div>
                <p className="text-white text-[16px] font-semibold">Stremio Addons</p>
                <p className="text-gray-500 text-[14px] mt-1">Configure content sources and streaming providers</p>
              </div>
              <a
                href="/settings/addons"
                className="bg-white/[0.06] border border-white/[0.08] text-white px-6 py-3 rounded-2xl text-[14px] font-semibold hover:bg-white/[0.1] transition-colors flex items-center gap-2 flex-shrink-0"
              >
                Manage
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          </div>
        </section>

        {/* ===== PLAYBACK ===== */}
        <section className="bg-white/[0.02] border border-white/[0.06] rounded-[24px] p-8 md:p-9">
          <h2 className="text-[22px] font-bold text-white mb-2">Playback</h2>
          <p className="text-gray-500 text-[14px] mb-8">Customize your video and audio playback experience</p>

          <div className="space-y-5">
            <div className="flex items-center justify-between py-4 border-b border-white/[0.04]">
              <div>
                <p className="text-white text-[15px] font-medium">Autoplay next episode</p>
                <p className="text-gray-500 text-[13px] mt-0.5">Automatically play the next episode in a series</p>
              </div>
              <Toggle enabled={autoplay} onChange={() => setAutoplay(!autoplay)} />
            </div>
            <div className="flex items-center justify-between py-4 border-b border-white/[0.04]">
              <div>
                <p className="text-white text-[15px] font-medium">Autoplay previews</p>
                <p className="text-gray-500 text-[13px] mt-0.5">Play trailers and previews while browsing</p>
              </div>
              <Toggle enabled={autoplayPreviews} onChange={() => setAutoplayPreviews(!autoplayPreviews)} />
            </div>
            <div className="flex items-center justify-between py-4 border-b border-white/[0.04]">
              <div>
                <p className="text-white text-[15px] font-medium">Default quality</p>
                <p className="text-gray-500 text-[13px] mt-0.5">Choose your preferred streaming quality</p>
              </div>
              <select className="bg-white/[0.06] border border-white/[0.08] text-white text-[14px] font-medium px-4 py-2.5 rounded-xl focus:outline-none focus:border-exyo-red/40 cursor-pointer">
                <option>Auto</option>
                <option>1080p</option>
                <option>720p</option>
                <option>480p</option>
              </select>
            </div>
            <div className="flex items-center justify-between py-4">
              <div>
                <p className="text-white text-[15px] font-medium">Preferred subtitle language</p>
                <p className="text-gray-500 text-[13px] mt-0.5">Default language for subtitles when available</p>
              </div>
              <select className="bg-white/[0.06] border border-white/[0.08] text-white text-[14px] font-medium px-4 py-2.5 rounded-xl focus:outline-none focus:border-exyo-red/40 cursor-pointer">
                <option>English</option>
                <option>Spanish</option>
                <option>French</option>
                <option>German</option>
                <option>Japanese</option>
                <option>None</option>
              </select>
            </div>
          </div>
        </section>

        {/* ===== DOWNLOADS ===== */}
        <section className="bg-white/[0.02] border border-white/[0.06] rounded-[24px] p-8 md:p-9">
          <h2 className="text-[22px] font-bold text-white mb-2">Downloads</h2>
          <p className="text-gray-500 text-[14px] mb-8">Manage offline content and storage</p>

          {/* Storage bar */}
          <div className="bg-white/[0.03] rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[14px] text-gray-400 font-medium">Storage Used</span>
              <span className="text-[14px] text-white font-semibold">0 GB / 5 GB</span>
            </div>
            <div className="h-2.5 bg-white/[0.06] rounded-full overflow-hidden">
              <div className="h-full bg-exyo-red rounded-full" style={{ width: '0%' }} />
            </div>
            <p className="text-[12px] text-gray-600 mt-2">No downloaded content yet</p>
          </div>

          <div className="space-y-5">
            <div className="flex items-center justify-between py-4 border-b border-white/[0.04]">
              <div>
                <p className="text-white text-[15px] font-medium">Download quality</p>
                <p className="text-gray-500 text-[13px] mt-0.5">Quality setting for offline downloads</p>
              </div>
              <select className="bg-white/[0.06] border border-white/[0.08] text-white text-[14px] font-medium px-4 py-2.5 rounded-xl focus:outline-none focus:border-exyo-red/40 cursor-pointer">
                <option>Standard</option>
                <option>High</option>
                <option>Original</option>
              </select>
            </div>
            <div className="flex items-center justify-between py-4">
              <div>
                <p className="text-white text-[15px] font-medium">Wi-Fi only</p>
                <p className="text-gray-500 text-[13px] mt-0.5">Only download when connected to Wi-Fi</p>
              </div>
              <Toggle enabled={true} onChange={() => {}} />
            </div>
          </div>
        </section>

        {/* ===== NOTIFICATIONS ===== */}
        <section className="bg-white/[0.02] border border-white/[0.06] rounded-[24px] p-8 md:p-9">
          <h2 className="text-[22px] font-bold text-white mb-2">Notifications</h2>
          <p className="text-gray-500 text-[14px] mb-8">Control how and when we reach you</p>

          <div className="space-y-5">
            <div className="flex items-center justify-between py-4 border-b border-white/[0.04]">
              <div>
                <p className="text-white text-[15px] font-medium">Email notifications</p>
                <p className="text-gray-500 text-[13px] mt-0.5">Receive updates and recommendations via email</p>
              </div>
              <Toggle enabled={emailNotifs} onChange={() => setEmailNotifs(!emailNotifs)} />
            </div>
            <div className="flex items-center justify-between py-4 border-b border-white/[0.04]">
              <div>
                <p className="text-white text-[15px] font-medium">Push notifications</p>
                <p className="text-gray-500 text-[13px] mt-0.5">Get notified about new releases and updates</p>
              </div>
              <Toggle enabled={pushNotifs} onChange={() => setPushNotifs(!pushNotifs)} />
            </div>
            <div className="flex items-center justify-between py-4">
              <div>
                <p className="text-white text-[15px] font-medium">Recommendations</p>
                <p className="text-gray-500 text-[13px] mt-0.5">Personalized content suggestions based on viewing</p>
              </div>
              <Toggle enabled={recommendations} onChange={() => setRecommendations(!recommendations)} />
            </div>
          </div>
        </section>

        {/* ===== PRIVACY ===== */}
        <section className="bg-white/[0.02] border border-white/[0.06] rounded-[24px] p-8 md:p-9">
          <h2 className="text-[22px] font-bold text-white mb-2">Privacy</h2>
          <p className="text-gray-500 text-[14px] mb-8">Control your data and privacy preferences</p>

          <div className="space-y-5">
            <div className="flex items-center justify-between py-4 border-b border-white/[0.04]">
              <div>
                <p className="text-white text-[15px] font-medium">Watch history</p>
                <p className="text-gray-500 text-[13px] mt-0.5">Save your viewing progress and continue watching</p>
              </div>
              <Toggle enabled={watchHistory} onChange={() => setWatchHistory(!watchHistory)} />
            </div>
            <div className="flex items-center justify-between py-4 border-b border-white/[0.04]">
              <div>
                <p className="text-white text-[15px] font-medium">Usage analytics</p>
                <p className="text-gray-500 text-[13px] mt-0.5">Help improve EXYO by sharing anonymous usage data</p>
              </div>
              <Toggle enabled={analytics} onChange={() => setAnalytics(!analytics)} />
            </div>
            <div className="flex items-center justify-between py-4">
              <div>
                <p className="text-white text-[15px] font-medium">Sign out from all devices</p>
                <p className="text-gray-500 text-[13px] mt-0.5">Remove access from all other devices and sessions</p>
              </div>
              <button className="bg-white/[0.06] border border-white/[0.08] text-white px-5 py-2.5 rounded-xl text-[14px] font-semibold hover:bg-white/[0.1] transition-colors">
                Sign Out All
              </button>
            </div>
          </div>
        </section>

        {/* ===== DANGER ZONE ===== */}
        <section className="bg-red-950/30 border-2 border-red-500/20 rounded-[24px] p-8 md:p-9 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-red-500/15 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <div>
                <h2 className="text-[22px] font-bold text-red-400">Delete Account</h2>
                <p className="text-gray-500 text-[14px] mt-0.5">Permanently remove your account and all data</p>
              </div>
            </div>
            <p className="text-gray-400 text-[14px] mb-8 leading-relaxed max-w-xl">
              This action is irreversible. All your watch history, preferences, addons, and account data will be permanently deleted. You will be signed out immediately.
            </p>
            <button className="bg-red-600 text-white px-8 py-3.5 rounded-2xl font-bold text-[15px] hover:bg-red-700 transition-all duration-200 opacity-50 cursor-not-allowed shadow-lg shadow-red-600/20">
              Delete Account
            </button>
          </div>
        </section>
      </div>
    </SettingsLayout>
  );
}
