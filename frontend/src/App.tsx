import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useParams } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import { ToastContainer } from './components/Toast';
import ErrorBoundary from './components/ErrorBoundary';
import { AppearanceProvider } from './providers/AppearanceProvider';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import SettingsLayout from './components/SettingsLayout';
import { useUserSync } from './hooks/useUserSync';

// Pages
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Detail = lazy(() => import('./pages/Detail'));
const Search = lazy(() => import('./pages/Search'));
const Settings = lazy(() => import('./pages/Settings'));
const MyList = lazy(() => import('./pages/MyList'));
const Watch = lazy(() => import('./pages/Watch'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Streaming = lazy(() => import('./pages/Streaming'));
const Downloads = lazy(() => import('./pages/Downloads'));
const ContinueWatching = lazy(() => import('./pages/ContinueWatching'));
const Appearance = lazy(() => import('./pages/Appearance'));
const Performance = lazy(() => import('./pages/Performance'));
const About = lazy(() => import('./pages/About'));
const Movies = lazy(() => import('./pages/Movies'));
const TVShows = lazy(() => import('./pages/TVShows'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute() {
  const { isSignedIn, isLoaded } = useAuth();
  useUserSync();

  if (!isLoaded) return <PageLoader />;
  if (!isSignedIn) return <Navigate to="/login" replace />;
  return (
    <>
      <ScrollToTop />
      <Navbar />
      <Suspense fallback={<PageLoader />}>
        <Outlet />
      </Suspense>
      <Footer />
      <ToastContainer />
    </>
  );
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth();
  if (!isLoaded) return <PageLoader />;
  if (isSignedIn) return <Navigate to="/home" replace />;
  return <>{children}</>;
}

function PageLoader() {
  return (
    <div className="min-h-screen bg-exyo-bg flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-exyo-red/20 border-t-exyo-red rounded-full animate-spin" />
        <p className="text-white/30 text-[12px] font-medium">Loading...</p>
      </div>
    </div>
  );
}

function DetailRedirect() {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/movie/${id}`} replace />;
}

function SettingsPageLoader() {
  return (
    <div className="py-12 text-center">
      <div className="w-8 h-8 border-2 border-exyo-red/20 border-t-exyo-red rounded-full animate-spin mx-auto" />
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AppearanceProvider>
          <Router>
            <div className="min-h-screen bg-exyo-bg text-white">
              <a href="#main-content" className="skip-link">
                Skip to main content
              </a>

              <Routes>
                {/* Public routes */}
                <Route
                  path="/login/*"
                  element={
                    <PublicRoute>
                      <Suspense fallback={<PageLoader />}>
                        <Login />
                      </Suspense>
                    </PublicRoute>
                  }
                />
                <Route
                  path="/register/*"
                  element={
                    <PublicRoute>
                      <Suspense fallback={<PageLoader />}>
                        <Register />
                      </Suspense>
                    </PublicRoute>
                  }
                />

                {/* Protected routes with navbar */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/" element={<Navigate to="/home" replace />} />
                  <Route path="/home" element={<Suspense fallback={<PageLoader />}><main id="main-content"><Home /></main></Suspense>} />
                  <Route path="/movies" element={<Suspense fallback={<PageLoader />}><main id="main-content"><Movies /></main></Suspense>} />
                  <Route path="/tv" element={<Suspense fallback={<PageLoader />}><main id="main-content"><TVShows /></main></Suspense>} />
                  <Route path="/movie/:id" element={<Suspense fallback={<PageLoader />}><main id="main-content"><Detail /></main></Suspense>} />
                  <Route path="/series/:id" element={<Suspense fallback={<PageLoader />}><main id="main-content"><Detail /></main></Suspense>} />
                  <Route path="/detail/:id" element={<DetailRedirect />} />
                  <Route path="/search" element={<Suspense fallback={<PageLoader />}><main id="main-content"><Search /></main></Suspense>} />
                  <Route path="/my-list" element={<Suspense fallback={<PageLoader />}><main id="main-content"><MyList /></main></Suspense>} />
                  <Route path="/continue-watching" element={<Suspense fallback={<PageLoader />}><main id="main-content"><ContinueWatching /></main></Suspense>} />
                  <Route path="/watch/:id" element={<Suspense fallback={<PageLoader />}><Watch /></Suspense>} />

                  {/* Settings with sidebar layout */}
                  <Route path="/settings" element={<Suspense fallback={<SettingsPageLoader />}><SettingsLayout /></Suspense>}>
                    <Route index element={<Suspense fallback={<SettingsPageLoader />}><Settings /></Suspense>} />
                    <Route path="appearance" element={<Suspense fallback={<SettingsPageLoader />}><Appearance /></Suspense>} />
                    <Route path="streaming" element={<Suspense fallback={<SettingsPageLoader />}><Streaming /></Suspense>} />
                    <Route path="performance" element={<Suspense fallback={<SettingsPageLoader />}><Performance /></Suspense>} />
                    <Route path="downloads" element={<Suspense fallback={<SettingsPageLoader />}><Downloads /></Suspense>} />
                    <Route path="about" element={<Suspense fallback={<SettingsPageLoader />}><About /></Suspense>} />
                    <Route path="extensions" element={<Navigate to="/settings/streaming" replace />} />
                    <Route path="addons" element={<Navigate to="/settings/streaming" replace />} />
                  </Route>
                </Route>

                {/* 404 */}
                <Route path="*" element={<Suspense fallback={<PageLoader />}><NotFound /></Suspense>} />
              </Routes>
            </div>
          </Router>
        </AppearanceProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
