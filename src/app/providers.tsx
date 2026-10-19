import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import type { ReactNode } from 'react';
import { Toaster } from 'react-hot-toast';

import { AuthProvider } from '../modules/auth/authProvider';
import { queryClient } from './queryClient';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ReactQueryDevtools initialIsOpen={false} />
      <Toaster position="top-right" />
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
}
