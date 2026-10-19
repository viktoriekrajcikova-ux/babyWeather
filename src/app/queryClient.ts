import { type DefaultOptions, MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import i18n from '../i18n/i18n';

export function createQueryClient(defaultOptions?: DefaultOptions) {
  return new QueryClient({
    defaultOptions,
    queryCache: new QueryCache({
      onError: (_error, query) => {
        const messages = query.meta?.errorToast;
        if (!messages) return;

        const isRefresh = query.state.data !== undefined;
        toast.error(
          `${i18n.t(isRefresh ? messages.refresh : messages.load)} ${i18n.t(messages.hint)}`,
          {
            id: messages.id ?? query.queryHash,
          },
        );
      },
      onSuccess: (_data, query) => {
        const messages = query.meta?.errorToast;
        if (messages) toast.dismiss(messages.id ?? query.queryHash);
      },
    }),
    mutationCache: new MutationCache({
      onMutate: (_variables, mutation) => {
        const messages = mutation.meta?.errorToast;
        if (messages) toast.dismiss(messages.id);
      },
      onError: (_error, _variables, _onMutateResult, mutation) => {
        const messages = mutation.meta?.errorToast;
        if (!messages) return;
        toast.error(`${i18n.t(messages.message)} ${i18n.t(messages.hint)}`, { id: messages.id });
      },
    }),
  });
}

export const queryClient = createQueryClient();
