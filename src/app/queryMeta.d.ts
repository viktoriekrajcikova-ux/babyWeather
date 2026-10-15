import '@tanstack/react-query';

interface QueryMeta extends Record<string, unknown> {
  errorToast?: {
    load: string;
    refresh: string;
    hint: string;
    id?: string;
  };
}

interface MutationMeta extends Record<string, unknown> {
  errorToast?: {
    message: string;
    hint: string;
    id: string;
  };
}

declare module '@tanstack/react-query' {
  interface Register {
    queryMeta: QueryMeta;
    mutationMeta: MutationMeta;
  }
}
