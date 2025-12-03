/**
 * Serial Communication Module
 * Handles Arduino connection and command transmission
 */

class SerialCommunicator {
    constructor() {
        this.port = null;
        this.writer = null;
        this.isConnected = false;
        this.commandTimers = {};
        this.debounceDelay = 100; // milliseconds

        this.initElements();
        this.attachEventListeners();
    }

    initElements() {
        this.connectBtn = document.getElementById('connectBtn');
        this.connectionStatus = document.getElementById('connectionStatus');
        this.connectionIndicator = document.getElementById('connectionIndicator');
    }

    attachEventListeners() {
        this.connectBtn.addEventListener('click', () => this.connect());
    }

    /**
     * Connect to Arduino via Web Serial API
     */
    async connect() {
        try {
            // Request serial port access
            this.port = await navigator.serial.requestPort();
            await this.port.open({ baudRate: 9600 });

            // Get writer for sending data
            this.writer = this.port.writable.getWriter();

            this.isConnected = true;
            this.updateConnectionUI(true);

            // Trigger custom event
            window.dispatchEvent(new CustomEvent('arduinoConnected'));

            console.log('Arduino connected successfully');
        } catch (error) {
            console.error('Connection error:', error);
            alert('Failed to connect to Arduino. Please try again.');
            this.updateConnectionUI(false);
        }
    }

    /**
     * Update connection status UI
     */
    updateConnectionUI(connected) {
        if (connected) {
            this.connectionStatus.textContent = 'Connected ✓';
            this.connectionIndicator.classList.add('connected');
            this.connectBtn.textContent = 'Connected';
            this.connectBtn.disabled = true;
        } else {
            this.connectionStatus.textContent = 'Disconnected';
            this.connectionIndicator.classList.remove('connected');
            this.connectBtn.textContent = 'Connect to Arduino';
            this.connectBtn.disabled = false;
        }
    }

    /**
     * Send command to Arduino
     */
    async sendCommand(command) {
        if (!this.writer || !this.isConnected) {
            console.warn('Cannot send command: Not connected');
            return false;
        }

        try {
            await this.writer.write(new TextEncoder().encode(command + "\n"));
            console.log('Sent:', command);
            return true;
        } catch (error) {
            console.error('Send error:', error);
            return false;
        }
    }

    /**
     * Send debounced command (waits until user stops moving slider)
     */
    sendDebounced(id, command) {
        // Clear existing timer for this control
        if (this.commandTimers[id]) {
            clearTimeout(this.commandTimers[id]);
        }

        // Set new timer
        this.commandTimers[id] = setTimeout(() => {
            this.sendCommand(command);
        }, this.debounceDelay);
    }

    /**
     * Send immediate command (for buttons)
     */
    sendImmediate(command) {
        return this.sendCommand(command);
    }

    /**
     * Send emergency stop
     */
    async emergencyStop() {
        console.warn('EMERGENCY STOP ACTIVATED');
        return await this.sendCommand('STOP');
    }

    /**
     * Disconnect from Arduino
     */
    async disconnect() {
        try {
            if (this.writer) {
                this.writer.releaseLock();
                this.writer = null;
            }
            if (this.port) {
                await this.port.close();
                this.port = null;
            }
            this.isConnected = false;
            this.updateConnectionUI(false);
            console.log('Arduino disconnected');
        } catch (error) {
            console.error('Disconnect error:', error);
        }
    }

    /**
     * Check connection status
     */
    getConnectionState() {
        return this.isConnected;
    }

    /**
     * Set debounce delay
     */
    setDebounceDelay(delay) {
        this.debounceDelay = delay;
    }
}

// Export for use in main.js
window.SerialCommunicator = SerialCommunicator;