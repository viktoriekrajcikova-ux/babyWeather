import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase env vars (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

class supabaseApiClient {

    async getChildren() {
        const response = await supabase
            .from("children")
            .select();

        return response.data
    }

    async addChild(newChild) {
        const { error } = await supabase
            .from('children')
            .insert(newChild)
    }

    async deleteChild(id) {
        const { error } = await supabase
            .from('children')
            .delete()
            .eq('id', id)
    }
}

export const supabaseApi = new supabaseApiClient();
