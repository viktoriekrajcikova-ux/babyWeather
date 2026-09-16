import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseApi } from '../supabaseApiClient';
import type { TablesInsert, Tables } from '../types/database';
import type { Child, Sex } from '../model/child';
import { useAuth } from './useAuth';

function toSex(value: string | null): Sex | null {
    return value === 'male' || value === 'female' ? value : null;
}

function toChild(row: Tables<'children'>): Child {
    return {
        id: row.id,
        name: row.name ?? '',
        age: row.age,
        sex: toSex(row.sex),
    };
}

export function useChildren() {
    const queryClient = useQueryClient();
    const { session } = useAuth();
    const childrenQueryKey = ['children', session?.user.id];
    const { data, isPending, error } = useQuery({
        queryKey: childrenQueryKey,
        queryFn: async () => {
            const rows = await supabaseApi.getChildren();
            return rows.map(toChild);
        },
        enabled: Boolean(session?.user.id),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => supabaseApi.deleteChild(id),
        onMutate: async (id: number) => {
            await queryClient.cancelQueries({ queryKey: childrenQueryKey });
            const previousChildren = queryClient.getQueryData<Child[]>(childrenQueryKey);
            queryClient.setQueryData<Child[]>(childrenQueryKey, (old = []) =>
                old.filter(c => c.id !== id)
            );
            return { previousChildren, queryKey: childrenQueryKey };
        },
        onError: (_err, _id, context) => {
            if (!context) return;
            queryClient.setQueryData(context.queryKey, context.previousChildren);
        },
        onSettled: (_data, _error, _id, context) => {
            if (!context) return;
            queryClient.invalidateQueries({ queryKey: context.queryKey });
        },
    });

    const addMutation = useMutation({
        onMutate: () => ({ queryKey: childrenQueryKey }),
        mutationFn: (newChild: TablesInsert<'children'>) => supabaseApi.addChild(newChild),
        onSettled: (_data, _error, _newChild, context) => {
            if (!context) return;
            queryClient.invalidateQueries({ queryKey: context.queryKey });
        },
    });

    return {
        children: data ?? [],
        loading: isPending,
        error: error ? 'Could not load children' : null,
        addChild: addMutation.mutateAsync,
        deleteChild: deleteMutation.mutate,
    };}