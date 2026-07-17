import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseApi } from '../supabaseApiClient';
import type { TablesInsert, Tables } from '../types/database';
import type { Child, Sex } from '../model/child';

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

    const { data, isPending, error } = useQuery({
        queryKey: ['children'],
        queryFn: async () => {
            const rows = await supabaseApi.getChildren();
            return rows.map(toChild);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => supabaseApi.deleteChild(id),
        onMutate: async (id: number) => {
            await queryClient.cancelQueries({ queryKey: ['children'] });
            const previousChildren = queryClient.getQueryData<Child[]>(['children']);
            queryClient.setQueryData<Child[]>(['children'], (old = []) =>
                old.filter(c => c.id !== id)
            );
            return { previousChildren };
        },
        onError: (_err, _id, context) => {
            queryClient.setQueryData(['children'], context?.previousChildren);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['children'] });
        },
    });

    const addMutation = useMutation({
        mutationFn: (newChild: TablesInsert<'children'>) => supabaseApi.addChild(newChild),
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['children'] });
        },
    });

    return {
        children: data ?? [],
        loading: isPending,
        error: error ? 'Could not load children' : null,
        addChild: addMutation.mutateAsync,
        deleteChild: deleteMutation.mutate,
    };}