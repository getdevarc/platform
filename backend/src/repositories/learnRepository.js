const db = require("../config/db");

// Retrieve all tracks with enrollment status for a user
exports.getAllTracks = async (userId) => {
    const result = await db.query(
        `SELECT lt.*, 
            uet.status AS enrollment_status,
            uet.enrolled_at
     FROM learning_tracks lt
     LEFT JOIN user_enrolled_tracks uet 
       ON lt.id = uet.track_id AND uet.user_id = $1
     WHERE lt.status != 'ARCHIVED'
     ORDER BY lt.created_at ASC`,
        [userId]
    );
    return result.rows;
};

// Retrieve a single track details, modules, and user enrollment status
exports.getTrackById = async (userId, trackId) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isUuid = uuidRegex.test(trackId);
    const whereClause = isUuid ? "lt.id = $2" : "lt.slug = $2";

    const trackRes = await db.query(
        `SELECT lt.*, 
            uet.status AS enrollment_status,
            uet.enrolled_at,
            uet.last_visited_page_id
     FROM learning_tracks lt
     LEFT JOIN user_enrolled_tracks uet 
       ON lt.id = uet.track_id AND uet.user_id = $1
     WHERE ${whereClause} AND lt.status != 'ARCHIVED'`,
        [userId, trackId]
    );
    if (trackRes.rows.length === 0) return null;

    const track = trackRes.rows[0];

    const modulesRes = await db.query(
        `SELECT * FROM learning_modules 
     WHERE track_id = $1 
     ORDER BY sort_order ASC`,
        [track.id]
    );

    track.modules = modulesRes.rows;
    return track;
};

// Enroll user in a track
exports.enrollInTrack = async (userId, trackId) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isUuid = uuidRegex.test(trackId);
    const whereClause = isUuid ? "id = $1" : "slug = $1";

    // First verify track exists and is active
    const trackRes = await db.query(`SELECT id FROM learning_tracks WHERE ${whereClause} AND status != 'ARCHIVED'`, [trackId]);
    if (trackRes.rows.length === 0) {
        throw new Error("Track not found");
    }
    const resolvedTrackId = trackRes.rows[0].id;

    const result = await db.query(
        `INSERT INTO user_enrolled_tracks (user_id, track_id, status)
     VALUES ($1, $2, 'ACTIVE')
     ON CONFLICT (user_id, track_id) DO UPDATE SET status = 'ACTIVE'
     RETURNING *`,
        [userId, resolvedTrackId]
    );
    return result.rows[0];
};

// Update last visited page session
exports.updateLastVisitedPage = async (userId, trackId, pageId) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isUuid = uuidRegex.test(trackId);
    const whereClause = isUuid ? "id = $1" : "slug = $1";

    const trackRes = await db.query(`SELECT id FROM learning_tracks WHERE ${whereClause}`, [trackId]);
    if (trackRes.rows.length === 0) return null;
    const resolvedTrackId = trackRes.rows[0].id;

    const result = await db.query(
        `INSERT INTO user_enrolled_tracks (user_id, track_id, last_visited_page_id)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, track_id) 
     DO UPDATE SET last_visited_page_id = EXCLUDED.last_visited_page_id
     RETURNING *`,
        [userId, resolvedTrackId, pageId]
    );
    return result.rows[0];
};
