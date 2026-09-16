const https = require('https');

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    const DB = process.env.DATABASE_URL;
    const m = DB.match(/postgres(?:ql)?:\/\/([^:]+):([^@]+)@([^/]+)\/(.+)/);
    if (!m) return res.status(500).json({ error: 'Bad DB URL' });
    const [, user, pass, host] = m;

    try {
        if (req.method === 'POST') {
            await neonQuery(host, user, pass,
                'UPDATE presentation_room SET slide = $1, updated_at = NOW() WHERE id = $2',
                [String(req.body.slide), 'main']);
        }
        const data = await neonQuery(host, user, pass,
            'SELECT slide FROM presentation_room WHERE id = $1', ['main']);
        return res.status(200).json({ slide: data.result?.[0]?.rows?.[0]?.slide ?? 0 });
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
};

function neonQuery(host, user, pass, sql, params) {
    return new Promise((resolve, reject) => {
        const body = JSON.stringify({ query: sql, params });
        const auth = Buffer.from(`${user}:${pass}`).toString('base64');
        const r = https.request({
            hostname: host, port: 443, path: '/sql', method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Basic ${auth}`, 'Content-Length': Buffer.byteLength(body) }
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
