const { neon } = require('@neondatabase/serverless');

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    const sql = neon(process.env.DATABASE_URL);

    try {
        if (req.method === 'POST') {
            const s = String(req.body.slide);
            await sql`UPDATE presentation_room SET slide = ${s}::int, updated_at = NOW() WHERE id = 'main'`;
        }
        const result = await sql`SELECT slide FROM presentation_room WHERE id = 'main'`;
        return res.status(200).json({ slide: result[0]?.slide ?? 0 });
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
};
