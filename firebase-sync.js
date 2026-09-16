// Sync via Vercel API routes → Neon PostgreSQL

const CLIENT_ID = 'client_' + Math.random().toString(36).substr(2, 9);

function setSlide(slide) {
    fetch('/api/slide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slide, clientId: CLIENT_ID })
    }).catch(e => console.warn('Write error:', e));
}

function onSlideChange(callback) {
    let lastSlide = -1;

    async function poll() {
        try {
            const res = await fetch('/api/slide');
            const data = await res.json();
            if (data.slide !== undefined && data.slide !== lastSlide) {
                lastSlide = data.slide;
                callback(data.slide);
            }
        } catch (e) {}
    }

    setInterval(poll, 500);
    poll();
}

function initRoom() {
    fetch('/api/slide').catch(() => {});
}
