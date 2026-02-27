import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const hasSupabasePublicConfig = Boolean(supabaseUrl && supabaseAnonKey);
export const hasSupabaseServiceRole = Boolean(supabaseUrl && supabaseServiceRoleKey);

let publicClient = null;
let adminClient = null;

export function getSupabasePublicClient() {
    if (!hasSupabasePublicConfig) return null;
    if (!publicClient) {
        publicClient = createClient(supabaseUrl, supabaseAnonKey, {
            auth: { persistSession: false, autoRefreshToken: false }
        });
    }
    return publicClient;
}

export function getSupabaseAdminClient() {
    if (!hasSupabaseServiceRole) return null;
    if (!adminClient) {
        adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
            auth: { persistSession: false, autoRefreshToken: false }
        });
    }
    return adminClient;
}

export function getPublicSupabaseConfig() {
    return {
        supabaseUrl,
        supabaseAnonKey
    };
}
