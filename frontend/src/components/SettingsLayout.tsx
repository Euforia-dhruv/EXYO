import { memo } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  Cog6ToothIcon,
  PaintBrushIcon,
  BoltIcon,
  InformationCircleIcon,
  PlayIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import { cn } from '../utils/helpers';

const SETTING_LINKS = [
  { to: '/settings', label: 'General', icon: Cog6ToothIcon, end: true },
  { to: '/settings/appearance', label: 'Appearance', icon: PaintBrushIcon },
  { to: '/settings/streaming', label: 'Streaming', icon: PlayIcon },
  { to: '/settings/performance', label: 'Performance', icon: BoltIcon },
  { to: '/settings/downloads', label: 'Downloads', icon: ArrowDownTrayIcon },
  { to: '/settings/about', label: 'About', icon: InformationCircleIcon },
];

function SettingsLayout() {
  return (
    <div className="min-h-screen pt-8 pb-20">
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-white text-[28px] sm:text-[32px] font-bold tracking-tight">
            Settings
          </h1>
          <p className="text-white/40 text-[14px] mt-1.5">
            Manage your preferences and account settings
          </p>
        </div>

        {/* Layout */}
        <div className="flex flex-col sm:flex-row gap-6 sm:gap-10">
          {/* Sidebar nav */}
          <nav className="sm:w-56 shrink-0">
            <div className="flex sm:flex-col gap-1 overflow-x-auto sm:overflow-visible pb-2 sm:pb-0 hide-scrollbar">
              {SETTING_LINKS.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-[13px] font-medium whitespace-nowrap transition-all duration-200',
                      isActive
                        ? 'text-white bg-white/[0.08]'
                        : 'text-white/45 hover:text-white hover:bg-white/[0.04]'
                    )
                  }
                >
                  <Icon className="w-[18px] h-[18px] shrink-0" />
                  {label}
                </NavLink>
              ))}
            </div>
          </nav>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(SettingsLayout);
