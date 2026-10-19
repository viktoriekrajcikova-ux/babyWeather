import { useMutation } from '@tanstack/react-query';

import { useAuth } from './useAuth';

export function useSignOutMutation() {
  const { signOut } = useAuth();

  return useMutation({
    mutationFn: () => signOut(),
    meta: {
      errorToast: {
        message: 'auth.signOutError',
        hint: 'common.pleaseRetry',
        id: 'auth-signout',
      },
    },
  });
}
