module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    const CONN = process.env.DATABASE_URL;
    const NEON_HOST = 'ep-tiny-haze-ac27404h.sa-east-1.aws.neon.tech';

    try {
        if (req.method === 'POST') {
            await neonFetch(NEON_HOST, CONN,
                'UPDATE presentation_room SET slide = $1, updated_at = NOW() WHERE id = $2',
                [String(req.body.slide), 'main']);
        }
        const data = await neonFetch(NEON_HOST, CONN,
            'SELECT slide FROM presentation_room WHERE id = $1', ['main']);
        return res.status(200).json({ slide: data.result?.[0]?.rows?.[0]?.slide ?? 0 });
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
};

async function neonFetch(host, connStr, sql, params) {
    const r = await fetch(`https://${host}/sql`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Neon-Connection-String': connStr
        },
        body: JSON.stringify({ query: sql, params })
    });
    if (!r.ok) throw new Error(`Neon ${r.status}: ${await r.text()}`);
    return await r.json();
}
