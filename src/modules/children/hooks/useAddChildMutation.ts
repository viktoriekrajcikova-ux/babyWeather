import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { TablesInsert } from '../../../types/database';
import { useAuth } from '../../auth/hooks/useAuth';
import { childrenApi } from '../api/childrenApi';
import { ChildrenKeys } from '../childrenQueryKeys';

export function useAddChildMutation() {
  const queryClient = useQueryClient();
  const { getAuthGeneration } = useAuth();
  const queryKey = ChildrenKeys.list();

  return useMutation({
    onMutate: () => ({ queryKey, authGeneration: getAuthGeneration() }),
    mutationFn: (newChild: TablesInsert<'children'>) => childrenApi.addChild(newChild),
    onSettled: (_data, _error, _newChild, context) => {
      if (!context) return;
      if (context.authGeneration !== getAuthGeneration()) return;
      queryClient.invalidateQueries({ queryKey: context.queryKey });
    },
    meta: {
      errorToast: {
        message: 'children.addError',
        hint: 'children.addHint',
        id: 'children-add',
      },
    },
  });
}
