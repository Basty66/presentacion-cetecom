// Neon PostgreSQL sync via Vercel API routes
// Both presentation and remote connect to /api/slide

const CLIENT_ID = 'client_' + Math.random().toString(36).substr(2, 9);

// Write slide to Neon via API
function setSlide(slide) {
    fetch('/api/slide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slide, clientId: CLIENT_ID })
    }).catch(e => console.warn('API write error:', e));
}

// Listen for slide changes via polling
function onSlideChange(callback) {
    let lastSlide = -1;
    
    function poll() {
        fetch('/api/slide')
            .then(r => r.json())
            .then(data => {
                if (data && data.slide !== undefined && data.clientId !== CLIENT_ID && data.slide !== lastSlide) {
                    lastSlide = data.slide;
                    callback(data.slide);
                }
            })
            .catch(() => {});
    }
    
    // Poll every 500ms
    setInterval(poll, 500);
    poll();
}

// Initialize - no-op, schema already exists
function initRoom() {
    fetch('/api/slide').catch(() => {});
}
