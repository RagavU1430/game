const http = require('http');
const port = 8080;

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Diagnostic Successful\n');
});

server.listen(port, '0.0.0.0', () => {
    console.log(`Diagnostic server listening on port ${port}`);

    const options = {
        hostname: '127.0.0.1',
        port: port,
        path: '/',
        method: 'GET'
    };

    const req = http.request(options, (res) => {
        console.log(`STATUS: ${res.statusCode}`);
        process.exit(0);
    });

    req.on('error', (e) => {
        console.error(`ERROR: ${e.message}`);
        process.exit(1);
    });

    req.end();

    // Timeout after 5 seconds
    setTimeout(() => {
        console.error('TIMEOUT: Request hung');
        process.exit(1);
    }, 5000);
});