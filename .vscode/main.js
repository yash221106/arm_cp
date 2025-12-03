/**
 * Main Application Logic
 * Coordinates voice authentication, serial communication, and UI controls
 */

class RoboticArmController {
    constructor() {
        // Initialize modules
        this.voiceAuth = new VoiceAuthenticator();
        this.serialComm = new SerialCommunicator();

        this.initElements();
        this.attachEventListeners();
        this.setupCustomEvents();
    }

    initElements() {
        // Servo sliders
        this.baseSlider = document.getElementById('base');
        this.midSlider = document.getElementById('mid');
        this.nearSlider = document.getElementById('near');
        this.clawSlider = document.getElementById('claw');

        // Value displays
        this.baseValue = document.getElementById('baseValue');
        this.midValue = document.getElementById('midValue');
        this.nearValue = document.getElementById('nearValue');
        this.clawValue = document.getElementById('clawValue');

        // Buttons
        this.clawOpenBtn = document.getElementById('clawOpen');
        this.clawCloseBtn = document.getElementById('clawClose');
        this.emergencyStopBtn = document.getElementById('emergencyStop');
    }

    attachEventListeners() {
        // Base Servo
        this.baseSlider.addEventListener('input', (e) => {
            const value = e.target.value;
            this.baseValue.textContent = value;
            this.serialComm.sendDebounced('base', `B:${value}`);
        });

        // Mid Servo
        this.midSlider.addEventListener('input', (e) => {
            const value = e.target.value;
            this.midValue.textContent = value;
            this.serialComm.sendDebounced('mid', `M:${value}`);
        });

        // Near Servo
        this.nearSlider.addEventListener('input', (e) => {
            const value = e.target.value;
            this.nearValue.textContent = value;
            this.serialComm.sendDebounced('near', `N:${value}`);
        });

        // Claw Servo
        this.clawSlider.addEventListener('input', (e) => {
            const value = e.target.value;
            this.clawValue.textContent = value;
            this.serialComm.sendDebounced('claw', `C:${value}`);
        });

        // Claw Open Button
        this.clawOpenBtn.addEventListener('click', () => {
            this.clawSlider.value = 0;
            this.clawValue.textContent = 0;
            this.serialComm.sendImmediate('C:0');
        });

        // Claw Close Button
        this.clawCloseBtn.addEventListener('click', () => {
            this.clawSlider.value = 20;
            this.clawValue.textContent = 20;
            this.serialComm.sendImmediate('C:1');
        });

        // Emergency Stop
        this.emergencyStopBtn.addEventListener('click', () => {
            this.handleEmergencyStop();
        });
    }

    setupCustomEvents() {
        // Listen for voice unlock event
        window.addEventListener('voiceUnlocked', () => {
            this.onVoiceUnlocked();
        });

        // Listen for Arduino connection event
        window.addEventListener('arduinoConnected', () => {
            this.onArduinoConnected();
        });
    }

    /**
     * Handle voice unlock event
     */
    onVoiceUnlocked() {
        console.log('Voice authentication successful');
        this.updateControlsState();
    }

    /**
     * Handle Arduino connection event
     */
    onArduinoConnected() {
        console.log('Arduino connection established');
        this.updateControlsState();
    }

    /**
     * Update control states based on auth and connection status
     */
    updateControlsState() {
        const isUnlocked = !this.voiceAuth.getLockedState();
        const isConnected = this.serialComm.getConnectionState();

        const enableControls = isUnlocked && isConnected;

        // Enable/disable all controls
        this.baseSlider.disabled = !enableControls;
        this.midSlider.disabled = !enableControls;
        this.nearSlider.disabled = !enableControls;
        this.clawSlider.disabled = !enableControls;
        this.clawOpenBtn.disabled = !enableControls;
        this.clawCloseBtn.disabled = !enableControls;
        this.emergencyStopBtn.disabled = !enableControls;

        if (enableControls) {
            console.log('All controls enabled');
        } else {
            console.log('Controls disabled - Auth:', isUnlocked, 'Connected:', isConnected);
        }
    }

    /**
     * Handle emergency stop
     */
    async handleEmergencyStop() {
        const confirmed = confirm('Are you sure you want to activate EMERGENCY STOP?');
        if (confirmed) {
            const success = await this.serialComm.emergencyStop();
            if (success) {
                alert('⚠️ EMERGENCY STOP ACTIVATED\n\nAll servos have been stopped.');
                // Optionally disable controls after emergency stop
                this.disableAllControls();
            }
        }
    }

    /**
     * Disable all controls
     */
    disableAllControls() {
        this.baseSlider.disabled = true;
        this.midSlider.disabled = true;
        this.nearSlider.disabled = true;
        this.clawSlider.disabled = true;
        this.clawOpenBtn.disabled = true;
        this.clawCloseBtn.disabled = true;
        this.emergencyStopBtn.disabled = true;
    }

    /**
     * Reset all servos to default position
     */
    async resetToDefault() {
        await this.serialComm.sendImmediate('B:80');
        await this.serialComm.sendImmediate('M:95');
        await this.serialComm.sendImmediate('N:45');
        await this.serialComm.sendImmediate('C:0');

        this.baseSlider.value = 80;
        this.midSlider.value = 95;
        this.nearSlider.value = 45;
        this.clawSlider.value = 0;

        this.baseValue.textContent = 80;
        this.midValue.textContent = 95;
        this.nearValue.textContent = 45;
        this.clawValue.textContent = 0;
    }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.roboticArmController = new RoboticArmController();
    console.log('Robotic Arm Controller initialized');
});