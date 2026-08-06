import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AppearanceProvider } from './providers/AppearanceProvider';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import ErrorBoundary from './components/ErrorBoundary';
import ToastContainer from './components/ToastContainer';
import SettingsLayout from './components/SettingsLayout';
import { ELogo } from './components/Logo';
import { useAuthStore } from './stores/authStore';

const Home = lazy(() => import('./pages/Home'));
const Movies = lazy(() => import('./pages/Movies'));
const TVShows = lazy(() => import('./pages/TVShows'));
const Detail = lazy(() => import('./pages/Detail'));
const Watch = lazy(() => import('./pages/Watch'));
const Search = lazy(() => import('./pages/Search'));
const Settings = lazy(() => import('./pages/Settings'));
const Appearance = lazy(() => import('./pages/Appearance'));
const Performance = lazy(() => import('./pages/Performance'));
const Streaming = lazy(() => import('./pages/Streaming'));
const Downloads = lazy(() => import('./pages/Downloads'));
const MyList = lazy(() => import('./pages/MyList'));
const ContinueWatching = lazy(() => import('./pages/ContinueWatching'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const NotFound = lazy(() => import('./pages/NotFound'));
const About = lazy(() => import('./pages/About'));
const Anime = lazy(() => import('./pages/Anime'));

function Loading() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <motion.div
        className="flex flex-col items-center gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <ELogo size={48} />
        </motion.div>
        <div className="w-6 h-6 border-2 border-white/10 border-t-red rounded-full animate-spin" />
      </motion.div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useAuthStore();

  useEffect(() => {
    useAuthStore.getState().setLoaded();
  }, []);

  if (!isLoaded) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <AppearanceProvider>
      <ErrorBoundary>
        <ScrollToTop />
        <ToastContainer />
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/watch/:id" element={<Watch />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route element={<><Navbar /><SettingsLayout /></>}>
              <Route path="/settings" element={<Settings />} />
              <Route path="/settings/appearance" element={<Appearance />} />
              <Route path="/settings/performance" element={<Performance />} />
              <Route path="/settings/streaming" element={<Streaming />} />
              <Route path="/settings/downloads" element={<Downloads />} />
              <Route path="/my-list" element={<ProtectedRoute><MyList /></ProtectedRoute>} />
              <Route path="/continue-watching" element={<ProtectedRoute><ContinueWatching /></ProtectedRoute>} />
              <Route path="/about" element={<About />} />
            </Route>

            <Route element={<><Navbar /><main className="min-h-screen bg-bg"><Outlet /></main><Footer /></>}>
              <Route path="/home" element={<Home />} />
              <Route path="/" element={<Navigate to="/home" replace />} />
              <Route path="/movies" element={<Movies />} />
              <Route path="/tv" element={<TVShows />} />
              <Route path="/anime" element={<Anime />} />
              <Route path="/movie/:id" element={<Detail />} />
              <Route path="/series/:id" element={<Detail />} />
              <Route path="/search" element={<Search />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </AppearanceProvider>
  );
}
