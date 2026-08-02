import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import { ToastProvider } from './components/Toast';
import { ErrorBoundary } from './components/ErrorBoundary';
import Navbar from './components/Navbar';

const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Detail = lazy(() => import('./pages/Detail'));
const Search = lazy(() => import('./pages/Search'));
const Settings = lazy(() => import('./pages/Settings'));
const MyList = lazy(() => import('./pages/MyList'));
const Watch = lazy(() => import('./pages/Watch'));
const Addons = lazy(() => import('./pages/Addons'));
const NotFound = lazy(() => import('./pages/NotFound'));

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
  if (!isLoaded) return <PageLoader />;
  if (!isSignedIn) return <Navigate to="/login" replace />;
  return (
    <>
      <Navbar />
      <Suspense>
        <Outlet />
      </Suspense>
    </>
  );
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth();
  if (!isLoaded) return <PageLoader />;
  if (isSignedIn) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function PageLoader() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#E50914]" />
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <Router>
            <div className="min-h-screen bg-[#0a0a0a] text-white">
              <a href="#main-content" className="skip-link">Skip to main content</a>
              <Routes>
                <Route path="/login" element={<PublicRoute><Suspense fallback={<PageLoader />}><Login /></Suspense></PublicRoute>} />
                <Route path="/register" element={<PublicRoute><Suspense fallback={<PageLoader />}><Register /></Suspense></PublicRoute>} />

                <Route element={<ProtectedRoute />}>
                  <Route path="/" element={<Suspense fallback={<PageLoader />}><main id="main-content"><Home /></main></Suspense>} />
                  <Route path="/detail/:id" element={<Suspense fallback={<PageLoader />}><main id="main-content"><Detail /></main></Suspense>} />
                  <Route path="/search" element={<Suspense fallback={<PageLoader />}><main id="main-content"><Search /></main></Suspense>} />
                  <Route path="/settings" element={<Suspense fallback={<PageLoader />}><main id="main-content"><Settings /></main></Suspense>} />
                  <Route path="/settings/addons" element={<Suspense fallback={<PageLoader />}><main id="main-content"><Addons /></main></Suspense>} />
                  <Route path="/my-list" element={<Suspense fallback={<PageLoader />}><main id="main-content"><MyList /></main></Suspense>} />
                  <Route path="/watch/:id" element={<Suspense fallback={<PageLoader />}><Watch /></Suspense>} />
                </Route>

                <Route path="*" element={<Suspense fallback={<PageLoader />}><NotFound /></Suspense>} />
              </Routes>
            </div>
          </Router>
        </ToastProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
