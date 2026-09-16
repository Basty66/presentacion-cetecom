const https = require('https');

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        if (req.method === 'GET') {
            const result = await neonHttp('SELECT slide FROM presentation_room WHERE id = $1', ['main']);
            return res.status(200).json({ slide: result.rows?.[0]?.slide ?? 0 });
        }
        if (req.method === 'POST') {
            const { slide } = req.body;
            await neonHttp('UPDATE presentation_room SET slide = $1, updated_at = NOW() WHERE id = $2', [String(slide), 'main']);
            return res.status(200).json({ ok: true, slide });
        }
        return res.status(405).json({ error: 'Method not allowed' });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: e.message });
    }
};

function neonHttp(query, params) {
    return new Promise((resolve, reject) => {
        const url = new URL(process.env.DATABASE_URL);
        const host = url.hostname;
        const auth = `${url.username}:${url.password}`;
        const database = url.pathname.slice(1);

        const body = JSON.stringify({
            query,
            params,
            connection_options: { schema: 'public' }
        });

        const options = {
            hostname: host,
            port: 443,
            path: `/sql`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Neon-Connection-String': process.env.DATABASE_URL,
                'Content-Length': Buffer.byteLength(body)
            }
        };

        const req = https.request(options, (resp) => {
            let data = '';
            resp.on('data', chunk => data += chunk);
            resp.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve({ rows: json.result?.[0]?.rows || [] });
                } catch (e) {
                    reject(new Error(`Parse error: ${data}`));
                }
            });
        });

        req.on('error', reject);
        req.write(body);
        req.end();
    });
}
