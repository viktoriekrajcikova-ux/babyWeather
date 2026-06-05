import { createClient } from "@supabase/supabase-js";
import type { Database, Tables, TablesInsert } from "./types/database";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase env vars (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)");
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

class supabaseApiClient {

    async getChildren(): Promise<Tables<'children'>[] | null> {
        const response = await supabase
            .from("children")
            .select();

        return response.data
    }

    async addChild(newChild: TablesInsert<'children'>) {
        await supabase
            .from('children')
            .insert(newChild)
    }

    async deleteChild(id: number) {
        await supabase
            .from('children')
            .delete()
            .eq('id', id)
    }
}

export const supabaseApi = new supabaseApiClient();
