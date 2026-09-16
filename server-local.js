const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
let currentSlide = 0;
let clients = [];

const server = http.createServer((req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // Serve remote control page (phone)
    if (req.url === '/' || req.url === '/remote') {
        const remotePath = path.join(__dirname, 'remote.html');
        fs.readFile(remotePath, (err, data) => {
            if (err) {
                res.writeHead(500);
                res.end('Error loading remote control');
                return;
            }
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(data);
        });
        return;
    }

    // Serve presentation page (PC)
    if (req.url === '/presentacion' || req.url === '/presentacion.html') {
        const presPath = path.join(__dirname, 'Presentacion_CETECOM.html');
        fs.readFile(presPath, (err, data) => {
            if (err) {
                res.writeHead(500);
                res.end('Error loading presentation');
                return;
            }
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(data);
        });
        return;
    }

    // API: Get current slide
    if (req.url === '/api/slide' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ slide: currentSlide }));
        return;
    }

    // API: Set slide
    if (req.url === '/api/slide' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                currentSlide = data.slide;
                // Notify all connected clients
                clients.forEach(client => {
                    client.write(`data: ${JSON.stringify({ slide: currentSlide })}\n\n`);
                });
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ ok: true, slide: currentSlide }));
            } catch (e) {
                res.writeHead(400);
                res.end('Invalid JSON');
            }
        });
        return;
    }

    // SSE endpoint for real-time updates
    if (req.url === '/events') {
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
        });
        res.write(`data: ${JSON.stringify({ slide: currentSlide })}\n\n`);
        clients.push(res);
        req.on('close', () => {
            clients = clients.filter(c => c !== res);
        });
        return;
    }

    res.writeHead(404);
    res.end('Not found');
});

server.listen(PORT, '0.0.0.0', () => {
    const os = require('os');
    const interfaces = os.networkInterfaces();
    let ip = 'localhost';
    
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                ip = iface.address;
                break;
            }
        }
    }
    
    console.log('');
    console.log('========================================');
    console.log('  PRESENTACION CETECOM - SERVIDOR');
    console.log('========================================');
    console.log('');
    console.log('  PC (presentacion):');
    console.log('  Abre en tu navegador:');
    console.log(`  http://localhost:${PORT}/presentacion`);
    console.log('');
    console.log('  CELULAR (control remoto):');
    console.log('  Abre en tu telefono:');
    console.log(`  http://${ip}:${PORT}/`);
    console.log('');
    console.log('  Asegurate que ambos esten en la misma');
    console.log('  red WiFi.');
    console.log('========================================');
    console.log('');
});

// Handle slide changes from presentation
process.stdin.on('data', (data) => {
    const input = data.toString().trim();
    if (input === 'next') {
        currentSlide++;
        clients.forEach(client => {
            client.write(`data: ${JSON.stringify({ slide: currentSlide })}\n\n`);
        });
    } else if (input === 'prev') {
        currentSlide = Math.max(0, currentSlide - 1);
        clients.forEach(client => {
            client.write(`data: ${JSON.stringify({ slide: currentSlide })}\n\n`);
        });
    }
});
