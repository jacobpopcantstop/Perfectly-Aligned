import { getSupabasePublicClient, getSupabaseAdminClient } from './supabase.js';

function bearerTokenFromRequest(req) {
    const header = req.headers.authorization || '';
    if (!header.startsWith('Bearer ')) return null;
    return header.slice('Bearer '.length).trim() || null;
}

export async function getProfileFromAccessToken(accessToken) {
    if (!accessToken) return null;

    const admin = getSupabaseAdminClient();
    const client = getSupabasePublicClient();
    const source = admin || client;
    if (!source) return null;

    const { data, error } = await source.auth.getUser(accessToken);
    if (error || !data?.user) return null;

    return {
        id: data.user.id,
        email: data.user.email || null,
        user: data.user,
        accessToken
    };
}

export async function requireAuth(req, res, next) {
    const accessToken = bearerTokenFromRequest(req);
    const profile = await getProfileFromAccessToken(accessToken);
    if (!profile) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    req.auth = profile;
    return next();
}

export function getRequestAccessToken(req) {
    return bearerTokenFromRequest(req);
}
