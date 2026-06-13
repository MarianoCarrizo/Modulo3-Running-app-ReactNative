import { useEffect } from 'react';
import { subscribeToAuthState } from '../services/auth.service';
import { getUser, createUser } from '../services/user.service';
import { useAuthStore } from '../store/auth.store';

export function useAuthListener() {
  const { setUser, setLoading, clearUser } = useAuthStore();

  useEffect(() => {
    const unsubscribe = subscribeToAuthState(async (firebaseUser) => {
      if (firebaseUser == null) {
        clearUser();
        setLoading(false);
        return;
      }

      let user = await getUser(firebaseUser.uid);

      if (user == null) {
        await createUser(firebaseUser.uid, {
          email: firebaseUser.email ?? '',
          name: firebaseUser.displayName ?? '',
          photoUrl: firebaseUser.photoURL ?? '',
          weightKg: 70,
          totalDistance: 0,
          totalCalories: 0,
          totalSteps: 0,
          onboardingCompleted: false,
        });
        user = await getUser(firebaseUser.uid);
      }

      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);
}
