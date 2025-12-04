/**
 * Serial Communication Recorder
 * Web Serial API implementation for browser-based serial communication
 */

class SerialRecorder {
    constructor() {
        // DOM Elements
        this.connectBtn = document.getElementById('connectBtn');
        this.baudRateSelect = document.getElementById('baudRateSelect');
        this.recordBtn = document.getElementById('recordBtn');
        this.saveBtn = document.getElementById('saveBtn');
        this.sendBtn = document.getElementById('sendBtn');
        this.sendInput = document.getElementById('sendInput');
        this.serialOutput = document.getElementById('serialOutput');
        this.connectionStatus = document.getElementById('connectionStatus');
        this.statusText = document.getElementById('statusText');
        this.addCarriageReturn = document.getElementById('addCarriageReturn');
        this.addLineFeed = document.getElementById('addLineFeed');

        // Serial Port State
        this.port = null;
        this.reader = null;
        this.writer = null;
        this.isConnected = false;
        this.isRecording = false;

        // Data Buffers
        this.liveDataBuffer = [];
        this.recordedDataChunks = [];
        this.decoder = new TextDecoder('utf-8');
        this.encoder = new TextEncoder();

        // Send History
        this.sendHistory = [];
        this.historyIndex = -1;
        this.tempInput = null;

        // UI Update Throttling
        this.updateInterval = null;
        this.lastUpdateTime = 0;
        this.updateThrottleMs = 150; // Update every 150ms

        // Initialize
        this.initializeEventListeners();
        this.updateUI();
    }

    /**
     * Initialize all event listeners
     */
    initializeEventListeners() {
        // Connect button
        this.connectBtn.addEventListener('click', () => this.toggleConnection());

        // Record button
        this.recordBtn.addEventListener('click', () => this.toggleRecording());

        // Save button
        this.saveBtn.addEventListener('click', () => this.saveRecording());

        // Send button and input
        this.sendBtn.addEventListener('click', () => this.sendData());
        this.sendInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendData();
            }
        });
        this.sendInput.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.navigateHistory(-1);
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.navigateHistory(1);
            }
        });

        // Baud rate change
        this.baudRateSelect.addEventListener('change', () => {
            if (this.isConnected) {
                this.reconnectWithNewBaudRate();
            }
        });
    }

    /**
     * Toggle serial port connection
     */
    async toggleConnection() {
        if (this.isConnected) {
            await this.disconnect();
        } else {
            await this.connect();
        }
    }

    /**
     * Connect to serial port
     */
    async connect() {
        try {
            // Check if Web Serial API is supported
            if (!('serial' in navigator)) {
                throw new Error('Web Serial API is not supported in this browser. Please use Chrome, Edge, or another Chromium-based browser.');
            }

            // Request port access
            this.port = await navigator.serial.requestPort();
            
            // Get baud rate from select
            const baudRate = parseInt(this.baudRateSelect.value);
            
            // Open port with selected baud rate
            await this.port.open({ baudRate });
            
            this.isConnected = true;
            this.updateUI();
            
            // Start reading data
            this.startReading();
            
            console.log(`Connected to serial port at ${baudRate} baud`);
            
        } catch (error) {
            console.error('Connection error:', error);
            
            if (error.name === 'NotFoundError') {
                alert('No serial port selected.');
            } else if (error.name === 'NotAllowedError') {
                alert('Permission to access serial port was denied.');
            } else {
                alert(`Connection failed: ${error.message}`);
            }
        }
    }

    /**
     * Disconnect from serial port
     */
    async disconnect() {
        try {
            if (this.reader) {
                await this.reader.cancel();
                this.reader = null;
            }
            
            if (this.writer) {
                await this.writer.close();
                this.writer = null;
            }
            
            if (this.port) {
                await this.port.close();
                this.port = null;
            }
            
            this.isConnected = false;
            this.isRecording = false;
            this.updateUI();
            
            // Clear update interval
            if (this.updateInterval) {
                clearInterval(this.updateInterval);
                this.updateInterval = null;
            }
            
            console.log('Disconnected from serial port');
            
        } catch (error) {
            console.error('Disconnect error:', error);
        }
    }

    /**
     * Reconnect with new baud rate
     */
    async reconnectWithNewBaudRate() {
        if (this.isConnected) {
            await this.disconnect();
            await this.connect();
        }
    }

    /**
     * Start reading data from serial port
     */
    async startReading() {
        if (!this.port) return;

        try {
            this.reader = this.port.readable.getReader();
            this.writer = this.port.writable.getWriter();
            
            // Start UI update interval
            this.startUIUpdateInterval();
            
            // Read data continuously
            while (this.port.readable) {
                try {
                    const { value, done } = await this.reader.read();
                    
                    if (done) {
                        console.log('Reader closed');
                        break;
                    }
                    
                    if (value) {
                        // Store raw binary data
                        this.liveDataBuffer.push(value);
                        
                        // If recording, store in recorded buffer
                        if (this.isRecording) {
                            this.recordedDataChunks.push(value);
                        }
                    }
                    
                } catch (error) {
                    console.error('Read error:', error);
                    break;
                }
            }
            
        } catch (error) {
            console.error('Start reading error:', error);
        }
    }

    /**
     * Start UI update interval for throttled updates
     */
    startUIUpdateInterval() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        this.updateInterval = setInterval(() => {
            this.updateSerialOutput();
        }, this.updateThrottleMs);
    }

    /**
     * Update serial output display with throttled updates
     */
    updateSerialOutput() {
        if (this.liveDataBuffer.length === 0) return;
        
        try {
            // Combine all buffered data
            const combinedData = new Uint8Array(this.liveDataBuffer.reduce((acc, chunk) => acc + chunk.length, 0));
            let offset = 0;
            
            for (const chunk of this.liveDataBuffer) {
                combinedData.set(chunk, offset);
                offset += chunk.length;
            }
            
            // Decode as UTF-8
            const decodedText = this.decoder.decode(combinedData, { stream: true });
            
            if (decodedText) {
                // Add to existing text
                const currentText = this.serialOutput.value;
                const newText = currentText + decodedText;
                
                // Keep only last 10 lines
                const lines = newText.split('\n');
                const lastLines = lines.slice(-10);
                const finalText = lastLines.join('\n');
                
                this.serialOutput.value = finalText;
                this.serialOutput.scrollTop = this.serialOutput.scrollHeight;
            }
            
            // Clear buffer after processing
            this.liveDataBuffer = [];
            
        } catch (error) {
            console.error('Update serial output error:', error);
        }
    }

    /**
     * Toggle recording state
     */
    toggleRecording() {
        if (!this.isConnected) return;
        
        this.isRecording = !this.isRecording;
        
        if (this.isRecording) {
            // Start recording
            this.recordedDataChunks = [];
            console.log('Started recording');
        } else {
            // Stop recording
            console.log('Stopped recording');
        }
        
        this.updateUI();
    }

    /**
     * Send data to serial port
     */
    async sendData() {
        if (!this.isConnected || !this.writer) return;
        
        const text = this.sendInput.value.trim();
        if (!text) return;
        
        try {
            // Build the message with optional \r and \n based on checkbox states
            let message = text;
            
            if (this.addCarriageReturn.checked) {
                message += '\r';
            }
            
            if (this.addLineFeed.checked) {
                message += '\n';
            }
            
            // Encode text as UTF-8
            const data = this.encoder.encode(message);
            await this.writer.write(data);
            
            // Add to history (avoid duplicates if same as last entry)
            if (this.sendHistory.length === 0 || this.sendHistory[this.sendHistory.length - 1] !== text) {
                this.sendHistory.push(text);
                // Keep only last 50 entries
                if (this.sendHistory.length > 50) {
                    this.sendHistory.shift();
                }
            }
            this.historyIndex = -1; // Reset to end of history
            
            // Clear input
            this.sendInput.value = '';
            
            console.log(`Sent: ${text}${this.addCarriageReturn.checked ? '\\r' : ''}${this.addLineFeed.checked ? '\\n' : ''}`);
            
        } catch (error) {
            console.error('Send error:', error);
            alert('Failed to send data. Please check connection.');
        }
    }

    /**
     * Navigate through send history
     * @param {number} direction - -1 for up (previous), 1 for down (next)
     */
    navigateHistory(direction) {
        if (this.sendHistory.length === 0) return;
        
        if (this.historyIndex === -1) {
            // Store current input if navigating from the end
            const currentText = this.sendInput.value.trim();
            if (currentText && (this.sendHistory.length === 0 || this.sendHistory[this.sendHistory.length - 1] !== currentText)) {
                // Current text is not in history, we'll restore it when going back down
                this.tempInput = currentText;
            }
        }
        
        if (direction === -1) {
            // Arrow Up - go to previous entry
            if (this.historyIndex === -1) {
                this.historyIndex = this.sendHistory.length - 1;
            } else if (this.historyIndex > 0) {
                this.historyIndex--;
            }
        } else {
            // Arrow Down - go to next entry
            if (this.historyIndex === -1) {
                return; // Already at the end
            } else if (this.historyIndex < this.sendHistory.length - 1) {
                this.historyIndex++;
            } else {
                // Reached the end, restore temp input or clear
                this.historyIndex = -1;
                this.sendInput.value = this.tempInput || '';
                this.tempInput = null;
                return;
            }
        }
        
        // Set the input value to the history entry
        this.sendInput.value = this.sendHistory[this.historyIndex];
    }

    /**
     * Save recorded data as .bin file
     */
    saveRecording() {
        if (this.recordedDataChunks.length === 0) {
            alert('No recorded data to save.');
            return;
        }
        
        try {
            // Combine all recorded chunks
            const totalLength = this.recordedDataChunks.reduce((acc, chunk) => acc + chunk.length, 0);
            const combinedData = new Uint8Array(totalLength);
            let offset = 0;
            
            for (const chunk of this.recordedDataChunks) {
                combinedData.set(chunk, offset);
                offset += chunk.length;
            }
            
            // Create blob and download
            const blob = new Blob([combinedData], { type: 'application/octet-stream' });
            const url = URL.createObjectURL(blob);
            
            // Create download link
            const a = document.createElement('a');
            a.href = url;
            a.download = `serial_recording_${new Date().toISOString().replace(/[:.]/g, '-')}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            // Clean up
            URL.revokeObjectURL(url);
            
            console.log(`Saved recording: ${combinedData.length} bytes`);
            
        } catch (error) {
            console.error('Save error:', error);
            alert('Failed to save recording.');
        }
    }

    /**
     * Update UI based on current state
     */
    updateUI() {
        // Connection status
        if (this.isConnected) {
            this.connectionStatus.className = 'status-dot connected';
            this.statusText.textContent = 'Connected';
            this.connectBtn.textContent = 'Disconnect';
            this.connectBtn.classList.add('btn-primary');
        } else {
            this.connectionStatus.className = 'status-dot disconnected';
            this.statusText.textContent = 'Disconnected';
            this.connectBtn.textContent = 'Connect';
            this.connectBtn.classList.remove('btn-primary');
        }
        
        // Record button
        if (this.isConnected) {
            this.recordBtn.disabled = false;
            
            if (this.isRecording) {
                this.recordBtn.classList.add('recording');
                this.recordBtn.querySelector('.btn-text').textContent = 'Stop Recording';
                this.recordBtn.querySelector('.btn-icon').textContent = '⏹';
            } else {
                this.recordBtn.classList.remove('recording');
                this.recordBtn.querySelector('.btn-text').textContent = 'Start Recording';
                this.recordBtn.querySelector('.btn-icon').textContent = '⏺';
            }
        } else {
            this.recordBtn.disabled = true;
            this.recordBtn.classList.remove('recording');
            this.recordBtn.querySelector('.btn-text').textContent = 'Start Recording';
            this.recordBtn.querySelector('.btn-icon').textContent = '⏺';
        }
        
        // Save button
        this.saveBtn.disabled = this.recordedDataChunks.length === 0;
        
        // Send controls
        this.sendBtn.disabled = !this.isConnected;
        this.sendInput.disabled = !this.isConnected;
        
        // Baud rate select
        this.baudRateSelect.disabled = this.isConnected;
        
        // Connect button
        this.connectBtn.disabled = this.isRecording;
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SerialRecorder();
}); 