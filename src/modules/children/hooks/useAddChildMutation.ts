import { useMutation, useQueryClient } from '@tanstack/react-query';
import { childrenApi } from '../api/childrenApi';
import type { TablesInsert } from '../../../types/database';
import { useAuth } from '../../auth/hooks/useAuth';
import { ChildrenKeys } from '../childrenQueryKeys';

export function useAddChildMutation() {
  const queryClient = useQueryClient();
  const { getAuthGeneration } = useAuth();
  const queryKey = ChildrenKeys.list();

  return useMutation({
    onMutate: () => ({ queryKey: queryKey, authGeneration: getAuthGeneration() }),
    mutationFn: (newChild: TablesInsert<'children'>) => childrenApi.addChild(newChild),
    onSettled: (_data, _error, _newChild, context) => {
      if (!context) return;
      if (context.authGeneration !== getAuthGeneration()) return;
      queryClient.invalidateQueries({ queryKey: context.queryKey });
    },
  });
}
