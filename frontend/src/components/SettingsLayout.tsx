import { NavLink, Outlet } from 'react-router-dom';
import { Settings, Palette, Monitor, Radio, Download, ListOrdered, Clock, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../utils/helpers';

const NAV = [
  { to: '/settings', icon: Settings, label: 'General', end: true },
  { to: '/settings/appearance', icon: Palette, label: 'Appearance' },
  { to: '/settings/performance', icon: Monitor, label: 'Performance' },
  { to: '/settings/streaming', icon: Radio, label: 'Streaming' },
  { to: '/settings/downloads', icon: Download, label: 'Downloads' },
  { to: '/my-list', icon: ListOrdered, label: 'My List' },
  { to: '/continue-watching', icon: Clock, label: 'Continue Watching' },
  { to: '/about', icon: Info, label: 'About' },
];

export default function SettingsLayout() {
  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="w-full lg:w-[240px] shrink-0">
            <nav className="flex lg:flex-col gap-1 overflow-x-auto hide-scrollbar pb-2 lg:pb-0">
              {NAV.map(({ to, icon: Icon, label, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap',
                      isActive
                        ? 'text-white bg-white/[0.08]'
                        : 'text-white/40 hover:text-white/70 hover:bg-white/[0.04]'
                    )
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {label}
                </NavLink>
              ))}
            </nav>
          </aside>

          {/* Content */}
          <motion.div
            className="flex-1 min-w-0"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Outlet />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
