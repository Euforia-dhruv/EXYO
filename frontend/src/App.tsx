import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/authStore';
import { ToastProvider } from './components/Toast';
import { ErrorBoundary } from './components/ErrorBoundary';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Detail from './pages/Detail';
import Search from './pages/Search';
import Settings from './pages/Settings';
import MyList from './pages/MyList';
import Watch from './pages/Watch';
import NotFound from './pages/NotFound';
import Navbar from './components/Navbar';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false
    }
  }
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <Router>
            <div className="min-h-screen bg-exyo-dark">
              <Routes>
                <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
                <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
                <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
                <Route path="/reset-password" element={<PublicRoute><ResetPassword /></PublicRoute>} />

                <Route path="/" element={<ProtectedRoute><Navbar /><Home /></ProtectedRoute>} />
                <Route path="/detail/:id" element={<ProtectedRoute><Navbar /><Detail /></ProtectedRoute>} />
                <Route path="/search" element={<ProtectedRoute><Navbar /><Search /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Navbar /><Settings /></ProtectedRoute>} />
                <Route path="/my-list" element={<ProtectedRoute><Navbar /><MyList /></ProtectedRoute>} />
                <Route path="/watch/:id" element={<ProtectedRoute><Watch /></ProtectedRoute>} />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </Router>
        </ToastProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
