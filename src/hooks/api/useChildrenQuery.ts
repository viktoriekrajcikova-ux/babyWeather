import { useQuery } from '@tanstack/react-query';
import { supabaseApi } from '../../supabaseApiClient';
import { useAuth } from './useAuth';
import { ChildrenKeys } from './childrenQueryKeys';

export function useChildrenQuery() {
    const { session } = useAuth();

    return useQuery({
        queryKey: ChildrenKeys.list(),
        queryFn: () => supabaseApi.getChildren(),
        enabled: Boolean(session),
    });
}