import { createClient } from "@supabase/supabase-js";
import type { Database, Tables, TablesInsert } from "./types/database";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase env vars (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)");
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

class supabaseApiClient {

    async getChildren(): Promise<Tables<'children'>[]> {
        const { data, error } = await supabase
            .from("children")
            .select();

        if (error) throw error;
        return data ?? [];
    }

    async addChild(newChild: TablesInsert<'children'>) {
        const { error } = await supabase
            .from('children')
            .insert(newChild)

        if (error) throw error;
    }

    async deleteChild(id: number) {
        const { error } = await supabase
            .from('children')
            .delete()
            .eq('id', id)

        if (error) throw error;
    }
}

export const supabaseApi = new supabaseApiClient();
