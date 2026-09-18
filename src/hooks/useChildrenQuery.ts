import { useQuery } from '@tanstack/react-query';
import { supabaseApi } from '../supabaseApiClient';
import type { Tables } from '../types/database';
import type { Child, Sex } from '../model/child';
import { useAuth } from './useAuth';
import { childrenQueryKey } from './childrenQueryKeys';

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

export function useChildrenQuery() {
    const { session } = useAuth();
    const userId = session?.user.id;

    return useQuery({
        queryKey: childrenQueryKey(userId),
        queryFn: async () => {
            const rows = await supabaseApi.getChildren();
            return rows.map(toChild);
        },
        enabled: Boolean(userId),
    });
}