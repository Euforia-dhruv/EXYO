import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App';
import { useAuthStore } from './stores/authStore';
import './index.css';

const convexUrl = import.meta.env.VITE_CONVEX_URL;
const convex = new ConvexReactClient(convexUrl);
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: 1, staleTime: 30_000 },
  },
});

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  const setLoaded = useAuthStore((s) => s.setLoaded);

  useEffect(() => {
    if (token) {
      convex.setAuth(token).catch(() => {}).finally(() => setLoaded());
    } else {
      setLoaded();
    }
  }, [token, setLoaded]);

  return <>{children}</>;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={googleClientId}>
      <ConvexProvider client={convex}>
        <AuthInitializer>
          <QueryClientProvider client={queryClient}>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </QueryClientProvider>
        </AuthInitializer>
      </ConvexProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>
);
