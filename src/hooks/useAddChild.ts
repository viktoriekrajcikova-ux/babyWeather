import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseApi } from '../supabaseApiClient';
import type { TablesInsert } from '../types/database';
import { useAuth } from './useAuth';
import { childrenQueryKey } from './childrenQueryKeys';

    export function useAddChild() {
        const queryClient = useQueryClient();
        const { session } = useAuth();
        const queryKey = childrenQueryKey(session?.user.id);

        const addMutation = useMutation({
            onMutate: () => ({ queryKey: queryKey, originalQuery: queryClient.getQueryCache().find({ queryKey: queryKey, exact: true }) }),
            mutationFn: (newChild: TablesInsert<'children'>) => supabaseApi.addChild(newChild),
            onSettled: (_data, _error, _newChild, context) => {
            if (!context || !context.originalQuery) return;
        const currentQuery = queryClient.getQueryCache().find({
            queryKey: context.queryKey,
            exact: true,
        });
            if (currentQuery !== context.originalQuery) return;
            queryClient.invalidateQueries({ queryKey: context.queryKey });
        },
    });

    return {addChild: addMutation.mutateAsync, isPending: addMutation.isPending}
    }