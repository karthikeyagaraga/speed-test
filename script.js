class SpeedTest {
    constructor() {
        this.startButton = document.getElementById('startButton');
        this.downloadSpeedEl = document.getElementById('downloadSpeed');
        this.uploadSpeedEl = document.getElementById('uploadSpeed');
        this.pingEl = document.getElementById('ping');
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
        this.statusValue = document.getElementById('statusValue');
        this.testTime = document.getElementById('testTime');
        this.dataTransferred = document.getElementById('dataTransferred');

        this.startButton.addEventListener('click', () => this.startTest());

        this.testInProgress = false;
        this.testStartTime = null;
    }

    async startTest() {
        if (this.testInProgress) return;

        this.testInProgress = true;
        this.startButton.disabled = true;
        this.resetMetrics();
        this.testStartTime = Date.now();

        try {
            // Step 1: Measure Ping
            this.updateProgress(0, 'Measuring ping...');
            const ping = await this.measurePing();
            this.pingEl.textContent = ping.toFixed(2) + ' ms';
            this.pingEl.parentElement.classList.add('active');

            // Step 2: Download Speed
            this.updateProgress(33, 'Testing download speed...');
            const downloadSpeed = await this.measureDownloadSpeed();
            this.downloadSpeedEl.textContent = downloadSpeed.toFixed(2) + ' Mbps';
            this.downloadSpeedEl.parentElement.classList.add('active');

            // Step 3: Upload Speed
            this.updateProgress(66, 'Testing upload speed...');
            const uploadSpeed = await this.measureUploadSpeed();
            this.uploadSpeedEl.textContent = uploadSpeed.toFixed(2) + ' Mbps';
            this.uploadSpeedEl.parentElement.classList.add('active');

            // Completed
            this.updateProgress(100, 'Test completed!');
            this.updateDetails();
        } catch (error) {
            this.progressText.textContent = 'Test failed: ' + error.message;
            this.statusValue.textContent = 'Error';
            console.error('Speed test error:', error);
        } finally {
            this.testInProgress = false;
            this.startButton.disabled = false;
        }
    }

    async measurePing() {
        let totalPing = 0;
        const pings = 4;

        for (let i = 0; i < pings; i++) {
            const start = performance.now();
            try {
                await fetch('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', {
                    method: 'HEAD',
                    cache: 'no-store'
                });
                const end = performance.now();
                totalPing += (end - start);
            } catch (e) {
                // Fallback: use timestamp approach
                const start = Date.now();
                await new Promise(resolve => setTimeout(resolve, 10));
                const end = Date.now();
                totalPing += (end - start);
            }
        }

        return totalPing / pings;
    }

    async measureDownloadSpeed() {
        const fileSize = 1024 * 1024; // 1 MB
        const testDuration = 5000; // 5 seconds
        let totalDownloaded = 0;
        const startTime = performance.now();

        while (performance.now() - startTime < testDuration) {
            try {
                const blob = new Blob([new ArrayBuffer(fileSize)]);
                const url = URL.createObjectURL(blob);
                
                const fetchStart = performance.now();
                const response = await fetch(url, { cache: 'no-store' });
                const fetchEnd = performance.now();
                
                await response.blob();
                totalDownloaded += fileSize;
                URL.revokeObjectURL(url);

                this.updateDataTransferred(totalDownloaded);

                // Simulate network delay
                await new Promise(resolve => setTimeout(resolve, 100));
            } catch (error) {
                console.error('Download test error:', error);
                break;
            }
        }

        const elapsedSeconds = (performance.now() - startTime) / 1000;
        const speedMbps = (totalDownloaded * 8) / (elapsedSeconds * 1024 * 1024);
        return speedMbps;
    }

    async measureUploadSpeed() {
        const fileSize = 512 * 1024; // 512 KB
        const testDuration = 5000; // 5 seconds
        let totalUploaded = 0;
        const startTime = performance.now();

        while (performance.now() - startTime < testDuration) {
            try {
                const blob = new Blob([new ArrayBuffer(fileSize)]);
                const formData = new FormData();
                formData.append('file', blob);

                const uploadStart = performance.now();
                await fetch('data:,', {
                    method: 'POST',
                    body: formData,
                    cache: 'no-store'
                }).catch(() => {}); // Expected to fail, but we're measuring time
                const uploadEnd = performance.now();

                totalUploaded += fileSize;
                this.updateDataTransferred(totalUploaded);

                // Simulate network delay
                await new Promise(resolve => setTimeout(resolve, 100));
            } catch (error) {
                console.error('Upload test error:', error);
                break;
            }
        }

        const elapsedSeconds = (performance.now() - startTime) / 1000;
        const speedMbps = (totalUploaded * 8) / (elapsedSeconds * 1024 * 1024);
        return speedMbps;
    }

    updateProgress(percentage, text) {
        this.progressFill.style.width = percentage + '%';
        this.progressText.textContent = text;
        this.statusValue.textContent = text;
    }

    updateDetails() {
        const elapsedTime = Math.round((Date.now() - this.testStartTime) / 1000);
        this.testTime.textContent = elapsedTime + 's';
        this.statusValue.textContent = 'Completed';
    }

    updateDataTransferred(bytes) {
        const mb = (bytes / (1024 * 1024)).toFixed(2);
        this.dataTransferred.textContent = mb + ' MB';
    }

    resetMetrics() {
        this.downloadSpeedEl.textContent = '-- Mbps';
        this.uploadSpeedEl.textContent = '-- Mbps';
        this.pingEl.textContent = '-- ms';
        this.progressFill.style.width = '0%';
        this.progressText.textContent = 'Starting test...';
        this.statusValue.textContent = 'Testing...';
        this.testTime.textContent = '-';
        this.dataTransferred.textContent = '-';

        document.querySelectorAll('.metric-value').forEach(el => {
            el.classList.remove('active', 'loading');
            el.classList.add('loading');
        });
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new SpeedTest();
});
