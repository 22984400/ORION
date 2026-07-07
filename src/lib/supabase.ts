// src/lib/supabase.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// =====================================================
// 1. RÉCUPÉRATION DES VARIABLES D'ENVIRONNEMENT
// =====================================================
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.error(
    'Supabase credentials missing. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.'
  );
}

// =====================================================
// 2. CRÉATION DU CLIENT SUPABASE
// =====================================================
export const supabase: SupabaseClient = createClient(
  supabaseUrl ?? '',
  supabaseAnonKey ?? '',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

// =====================================================
// 3. FONCTION DE VÉRIFICATION DE LA CONNEXION
// =====================================================
export async function checkDatabaseConnection(): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    return { ok: false, error: 'Variables Supabase manquantes dans .env' };
  }

  const { error } = await supabase.from('clients').select('id', { count: 'exact', head: true });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// =====================================================
// 4. TYPES DE LA BASE DE DONNÉES (extrait de Database)
// =====================================================
// Vous pouvez ajouter ici vos types Database si vous voulez les centraliser.
// Exemple :
// export type Database = { ... }; 
// mais ils sont déjà définis dans le fichier d'origine, nous les laissons en commentaire.