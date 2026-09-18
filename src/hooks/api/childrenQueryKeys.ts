
export const ChildrenKeys = {
    all: ['children'] as const,
    list: () => [...ChildrenKeys.all, 'list'] as const,
};