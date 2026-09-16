const https = require('https');

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    const DB = process.env.DATABASE_URL;

    try {
        if (req.method === 'POST') {
            await neonQuery(DB, 'UPDATE presentation_room SET slide = $1, updated_at = NOW() WHERE id = $2',
                [String(req.body.slide), 'main']);
        }
        const data = await neonQuery(DB,
            'SELECT slide FROM presentation_room WHERE id = $1', ['main']);
        return res.status(200).json({ slide: data.result?.[0]?.rows?.[0]?.slide ?? 0 });
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
};

function neonQuery(connStr, sql, params) {
    return new Promise((resolve, reject) => {
        const body = JSON.stringify({ query: sql, params });
        const host = 'ep-tiny-haze-ac27404h.sa-east-1.aws.neon.tech';
        const r = https.request({
            hostname: host, port: 443, path: '/sql', method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Neon-Connection-String': connStr,
                'Content-Length': Buffer.byteLength(body)
            }
        }, resp => {
            let d = '';
            resp.on('data', c => d += c);
            resp.on('end', () => { try { resolve(JSON.parse(d)); } catch (e) { reject(new Error(d)); } });
        });
        r.on('error', reject);
        r.write(body);
        r.end();
    });
}
