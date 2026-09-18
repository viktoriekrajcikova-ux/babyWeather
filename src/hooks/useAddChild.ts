import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseApi } from '../supabaseApiClient';
import type { TablesInsert } from '../types/database';
import { useAuth } from './useAuth';
import { childrenQueryKey } from './childrenQueryKeys';

    export function useAddChild() {
        const queryClient = useQueryClient();
        const { session, getAuthGeneration } = useAuth();
        const queryKey = childrenQueryKey(session?.user.id);

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