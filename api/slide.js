module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const DB_URL = process.env.DATABASE_URL;

    try {
        if (req.method === 'GET') {
            const r = await neonQuery('SELECT slide FROM presentation_room WHERE id = $1', ['main'], DB_URL);
            return res.status(200).json({ slide: r.rows?.[0]?.slide ?? 0 });
        }
        if (req.method === 'POST') {
            const { slide } = req.body;
            await neonQuery('UPDATE presentation_room SET slide = $1, updated_at = NOW() WHERE id = $2', [slide, 'main'], DB_URL);
            return res.status(200).json({ ok: true, slide });
        }
        return res.status(405).json({ error: 'Method not allowed' });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: e.message });
    }
};

async function neonQuery(sql, params, connectionString) {
    const m = connectionString.match(/postgres(?:ql)?:\/\/([^:]+):([^@]+)@([^/]+)\/(.+)/);
    if (!m) throw new Error('Bad DATABASE_URL');
    const [, user, pass, host, db] = m;
    const endpoint = host.includes('-pooler') ? host.replace('-pooler', '') : host;

    const resp = await fetch(`https://${endpoint}/sql`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Neon-Connection-String': connectionString
        },
        body: JSON.stringify({ query: sql, params })
    });

    if (!resp.ok) throw new Error(`Neon HTTP ${resp.status}: ${await resp.text()}`);
    const data = await resp.json();
    return { rows: data.result?.[0]?.rows || [] };
}
