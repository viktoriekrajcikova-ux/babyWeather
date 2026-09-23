import { useQuery } from '@tanstack/react-query';
import { supabaseApi } from '../../supabaseApiClient';
import { ChildrenKeys } from './childrenQueryKeys';

export function useChildrenQuery() {
  return useQuery({
    queryKey: ChildrenKeys.list(),
    queryFn: () => supabaseApi.getChildren(),
  });
}
