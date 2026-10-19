import { useMutation } from '@tanstack/react-query';

import { useAuth } from './useAuth';

type Credentials = { email: string; password: string };

export function useSignUpMutation() {
  const { signUp } = useAuth();

  return useMutation({
    mutationFn: ({ email, password }: Credentials) => signUp(email, password),
    meta: {
      errorToast: {
        message: 'auth.signUpError',
        hint: 'auth.retryHint',
        id: 'auth-submit',
      },
    },
  });
}
