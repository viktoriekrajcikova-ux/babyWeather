
export function childrenQueryKey(userId: string | undefined) {
    // read only
    return ['children', userId] as const;
}