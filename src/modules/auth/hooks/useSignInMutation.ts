import { useMutation } from '@tanstack/react-query';
import { useAuth } from './useAuth';

type Credentials = { email: string; password: string };

export function useSignInMutation() {
  const { signIn } = useAuth();

  return useMutation({
    mutationFn: ({ email, password }: Credentials) => signIn(email, password),
    meta: {
      errorToast: {
        message: 'auth.signInError',
        hint: 'auth.retryHint',
        id: 'auth-submit',
      },
    },
  });
}
