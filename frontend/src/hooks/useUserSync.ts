import { useEffect } from 'react';
import { useMutation } from 'convex/react';
import { useAuth } from '@clerk/clerk-react';
import { api } from '../../convex/_generated/api';

/**
 * Auto-syncs the current Clerk user into the Convex database on sign-in.
 * This creates the user record + default addons if they don't exist yet.
 * Safe to call multiple times — syncUser is idempotent.
 */
export function useUserSync() {
  const { isSignedIn, isLoaded } = useAuth();
  const syncUser = useMutation(api.users.syncUser);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    // Fire-and-forget: sync runs in the background
    syncUser().catch(() => {
      // Silent fail — the user can still use the app,
      // and sync will retry on next page load
    });
  }, [isLoaded, isSignedIn, syncUser]);
}
