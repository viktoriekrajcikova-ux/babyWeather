import { useQuery } from '@tanstack/react-query';
import { childrenApi } from '../api/childrenApi';
import { ChildrenKeys } from '../childrenQueryKeys';

export function useChildrenQuery() {
  return useQuery({
    queryKey: ChildrenKeys.list(),
    queryFn: () => childrenApi.getChildren(),
  });
}
