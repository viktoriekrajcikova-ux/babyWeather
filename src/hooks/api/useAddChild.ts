import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseApi } from '../../supabaseApiClient';
import type { TablesInsert } from '../../types/database';
import { useAuth } from './useAuth';
import { ChildrenKeys } from './childrenQueryKeys';

    export function useAddChild() {
        const queryClient = useQueryClient();
        const { getAuthGeneration } = useAuth();
        const queryKey = ChildrenKeys.list();

        const addMutation = useMutation({
            onMutate: () => ({ queryKey: queryKey,  authGeneration: getAuthGeneration() }),
            mutationFn: (newChild: TablesInsert<'children'>) => supabaseApi.addChild(newChild),
            onSettled: (_data, _error, _newChild, context) => {
            if (!context) return;
            if (context.authGeneration !== getAuthGeneration()) return;
            queryClient.invalidateQueries({ queryKey: context.queryKey });
        },
    });

    return {addChild: addMutation.mutateAsync, isPending: addMutation.isPending}
    }