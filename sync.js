// Neon PostgreSQL - direct HTTP from browser (no server needed)
const NEON_URL = 'https://ep-tiny-haze-ac27404h.sa-east-1.aws.neon.tech/sql';

const CLIENT_ID = 'client_' + Math.random().toString(36).substr(2, 9);
const CONN_STR = 'postgresql://neondb_owner:npg_fgndWHS0UmA8@ep-tiny-haze-ac27404h-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require';

async function neonQuery(sql, params = []) {
    const r = await fetch(NEON_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Neon-Connection-String': CONN_STR
        },
        body: JSON.stringify({ query: sql, params })
    });
    const d = await r.json();
    return d.result?.[0]?.rows || [];
}

function setSlide(slide) {
    neonQuery('UPDATE presentation_room SET slide = $1, updated_at = NOW() WHERE id = $2', [String(slide), 'main']).catch(() => {});
}

function onSlideChange(callback) {
    let last = -1;
    async function poll() {
        try {
            const rows = await neonQuery('SELECT slide FROM presentation_room WHERE id = $1', ['main']);
            const s = rows[0]?.slide ?? 0;
            if (s !== last) { last = s; callback(s); }
        } catch (e) {}
    }
    setInterval(poll, 500);
    poll();
}

function initRoom() {
    neonQuery("INSERT INTO presentation_room (id, slide) VALUES ('main', 0) ON CONFLICT (id) DO NOTHING").catch(() => {});
}
