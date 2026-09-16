// Sync via Vercel API → Neon PostgreSQL
const CLIENT_ID = 'client_' + Math.random().toString(36).substr(2, 9);

function setSlide(slide) {
    fetch('/api/slide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slide, clientId: CLIENT_ID })
    }).catch(() => {});
}

function onSlideChange(callback) {
    let last = -1;
    async function poll() {
        try {
            const r = await fetch('/api/slide');
            const d = await r.json();
            if (d.slide !== undefined && d.slide !== last) { last = d.slide; callback(d.slide); }
        } catch (e) {}
    }
    setInterval(poll, 500);
    poll();
}

function initRoom() {
    fetch('/api/slide').catch(() => {});
}
