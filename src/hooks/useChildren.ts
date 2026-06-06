import { useState, useEffect, useCallback } from 'react';
import { supabaseApi } from '../supabaseApiClient';
import type { Tables, TablesInsert } from '../types/database';

type Child = Tables<'children'>;

export function useChildren() {
    const [children, setChildren] = useState<Child[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadChildren = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await supabaseApi.getChildren();
            setChildren(data);
        } catch {
            setError('Nepodařilo se načíst děti');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadChildren();
    }, [loadChildren]);

    const addChild = useCallback(async (newChild: TablesInsert<'children'>) => {
        await supabaseApi.addChild(newChild);
        await loadChildren();
    }, [loadChildren]);

    const deleteChild = useCallback(async (id: number) => {
        setChildren(prev => prev.filter(c => c.id !== id));
        try {
            await supabaseApi.deleteChild(id);
        } catch {
            setError('Nepodařilo se smazat dítě');
            await loadChildren();
        }
    }, [loadChildren]);

    return { children, loading, error, addChild, deleteChild, reload: loadChildren };
}
