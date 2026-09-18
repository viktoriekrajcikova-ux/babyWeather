import { useQuery } from '@tanstack/react-query';
import { supabaseApi } from '../../supabaseApiClient';
import { useAuth } from './useAuth';
import { childrenQueryKey } from './childrenQueryKeys';

export function useChildrenQuery() {
    const { session } = useAuth();
    const userId = session?.user.id;

    return useQuery({
        queryKey: childrenQueryKey(userId),
        queryFn: () => supabaseApi.getChildren(),
        enabled: Boolean(userId),
    });
}