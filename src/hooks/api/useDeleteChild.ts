import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseApi } from '../../supabaseApiClient';
import type { Child } from '../../model/child/child';
import { ChildrenKeys } from './childrenQueryKeys';

export function useDeleteChild() {
  const queryClient = useQueryClient();
  const queryKey = ChildrenKeys.list();

  const deleteMutation = useMutation({
    mutationFn: (id: number) => supabaseApi.deleteChild(id),
    onMutate: async (id: number) => {
      const originalQuery = queryClient.getQueryCache().find({
        queryKey: queryKey,
        exact: true,
      });
      await queryClient.cancelQueries({ queryKey: queryKey });
      const currentQuery = queryClient.getQueryCache().find({
        queryKey: queryKey,
        exact: true,
      });
      if (!currentQuery || currentQuery !== originalQuery) return;
      const previousChildren = queryClient.getQueryData<Child[]>(queryKey);
      queryClient.setQueryData<Child[]>(queryKey, (old = []) => old.filter((c) => c.id !== id));
      return { previousChildren, queryKey: queryKey, originalQuery };
    },
    onError: (_err, _id, context) => {
      if (!context) return;
      const currentQuery = queryClient.getQueryCache().find({
        queryKey: context.queryKey,
        exact: true,
      });
      if (!context.originalQuery) return;
      if (currentQuery !== context.originalQuery) return;
      queryClient.setQueryData(context.queryKey, context.previousChildren);
    },
    onSettled: (_data, _error, _id, context) => {
      if (!context) return;
      const currentQuery = queryClient.getQueryCache().find({
        queryKey: context.queryKey,
        exact: true,
      });
      if (!context.originalQuery) return;
      if (currentQuery !== context.originalQuery) return;
      queryClient.invalidateQueries({ queryKey: context.queryKey });
    },
  });

  return { deleteChild: deleteMutation.mutate, isPending: deleteMutation.isPending };
}
