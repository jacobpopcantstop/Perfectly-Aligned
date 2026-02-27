import crypto from 'crypto';
import { getSupabaseAdminClient } from './supabase.js';

const sessions = new Map();

function nowIso() {
    return new Date().toISOString();
}

export function startSession({ roomCode, hostProfileId, mode, selectedDecks, modifiersEnabled, targetScore, timerDuration }) {
    const sessionId = crypto.randomUUID();
    sessions.set(roomCode, {
        id: sessionId,
        roomCode,
        hostProfileId,
        mode,
        selectedDecks,
        modifiersEnabled,
        targetScore,
        timerDuration,
        startedAt: nowIso(),
        rounds: [],
        final: null
    });
    return sessionId;
}

export function recordRoundResult(roomCode, payload) {
    const session = sessions.get(roomCode);
    if (!session) return;
    session.rounds.push({
        round: payload.round,
        prompt: payload.prompt,
        alignment: payload.alignment,
        winnerId: payload.winnerId,
        winnerName: payload.winnerName,
        timestamp: nowIso()
    });
}

export async function finalizeSession(roomCode, payload) {
    const session = sessions.get(roomCode);
    if (!session) return;

    session.final = {
        winnerId: payload.winnerId,
        winnerName: payload.winnerName,
        players: payload.players,
        endedAt: nowIso()
    };

    const admin = getSupabaseAdminClient();
    if (!admin || !session.hostProfileId) return;

    const summary = {
        rounds: session.rounds,
        final: session.final,
        targetScore: session.targetScore,
        timerDuration: session.timerDuration
    };

    const { data: inserted, error: sessionErr } = await admin
        .from('game_sessions')
        .insert({
            id: session.id,
            host_profile_id: session.hostProfileId,
            room_code: session.roomCode,
            mode: session.mode,
            selected_decks: session.selectedDecks,
            modifiers_enabled: session.modifiersEnabled,
            started_at: session.startedAt,
            ended_at: session.final.endedAt,
            winner_player_name: session.final.winnerName,
            summary
        })
        .select('id')
        .maybeSingle();

    if (sessionErr || !inserted?.id) return;

    if (Array.isArray(session.final.players) && session.final.players.length > 0) {
        await admin.from('game_session_players').insert(
            session.final.players.map((player) => ({
                game_session_id: inserted.id,
                player_name: player.name,
                avatar: player.avatar || null,
                final_score: player.score || 0,
                final_tokens: player.tokens || {}
            }))
        );
    }
}

export function removeSession(roomCode) {
    sessions.delete(roomCode);
}

export async function listHistoryForHost(hostProfileId) {
    const admin = getSupabaseAdminClient();
    if (!admin || !hostProfileId) return [];

    const { data, error } = await admin
        .from('game_sessions')
        .select('id, room_code, mode, selected_decks, modifiers_enabled, started_at, ended_at, winner_player_name, summary')
        .eq('host_profile_id', hostProfileId)
        .order('started_at', { ascending: false })
        .limit(100);

    if (error || !data) return [];
    return data;
}

export async function getHistoryItemForHost(hostProfileId, sessionId) {
    const admin = getSupabaseAdminClient();
    if (!admin || !hostProfileId || !sessionId) return null;

    const { data: session, error: sessionErr } = await admin
        .from('game_sessions')
        .select('id, room_code, mode, selected_decks, modifiers_enabled, started_at, ended_at, winner_player_name, summary')
        .eq('host_profile_id', hostProfileId)
        .eq('id', sessionId)
        .maybeSingle();

    if (sessionErr || !session) return null;

    const { data: players } = await admin
        .from('game_session_players')
        .select('player_name, avatar, final_score, final_tokens')
        .eq('game_session_id', sessionId)
        .order('final_score', { ascending: false });

    return { ...session, players: players || [] };
}
