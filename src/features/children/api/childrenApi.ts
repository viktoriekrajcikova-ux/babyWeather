import { supabase } from '../../../lib/supabase';
import type { Tables, TablesInsert } from '../../../types/database';
import type { Child, Sex } from '../child';

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

class ChildrenApiClient {
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

export const childrenApi = new ChildrenApiClient();
