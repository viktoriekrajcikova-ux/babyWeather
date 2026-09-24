import { supabase } from '../lib/supabase';

export async function authenticatedGet<T>(path: string, errorMessage: string): Promise<T> {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session?.access_token) throw new Error(errorMessage);
    const response = await fetch(path, {
      headers: { Authorization: `Bearer ${data.session.access_token}` },
    });
    if (!response.ok) throw new Error(errorMessage);
    return (await response.json()) as T;
  } catch {
    throw new Error(errorMessage);
  }
}
