
// ==============================================================================
// 🔧 SERVER CONFIGURATION
// ==============================================================================

// 1. Run your backend locally: "node server.js"
// 2. Run ngrok to expose it: "ngrok http 8080"
// 3. Copy the HTTPS URL from ngrok (e.g., https://1234-56-78.ngrok-free.app)
// 4. Paste it below inside the quotes:

export const PUBLIC_SERVER_URL = "https://YOUR_NGROK_URL_HERE.ngrok-free.app";

// ==============================================================================

export const getApiUrl = () => {
    // If running locally, automatically use localhost
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
        return 'http://localhost:8080';
    }
    // Otherwise (on Vercel), use the public URL
    return PUBLIC_SERVER_URL;
};

export const getWsUrl = () => {
    const url = getApiUrl();
    return url.replace('http', 'ws');
};
