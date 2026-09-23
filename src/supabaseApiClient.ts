import { createClient } from '@supabase/supabase-js';
import type { Database, Tables, TablesInsert } from './types/database';
import type { Child, Sex } from './model/child/child';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

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

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase env vars (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

class supabaseApiClient {
  async getChildren(): Promise<Child[]> {
    const { data, error } = await supabase.from('children').select();

    if (error) throw error;
    return (data ?? []).map(toChild);
  }

  async addChild(newChild: TablesInsert<'children'>) {
    const { error } = await supabase.from('children').insert(newChild);

    if (error) throw error;
  }

  async deleteChild(id: number) {
    const { error } = await supabase.from('children').delete().eq('id', id);

    if (error) throw error;
  }
}

export const supabaseApi = new supabaseApiClient();
