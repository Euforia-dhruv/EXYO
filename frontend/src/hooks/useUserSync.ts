import { useEffect } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuthStore } from '../stores/authStore';

export function useUserSync() {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const syncUser = useMutation(api.users.syncUser);

  useEffect(() => {
    if (!user || !token) return;

    syncUser().catch(() => {});
  }, [user, token, syncUser]);
}
