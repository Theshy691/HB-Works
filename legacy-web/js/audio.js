// Web Audio API Synthesizer & POS Sound Effects

let audioCtx = null;
let soundEnabled = localStorage.getItem('hb_pos_sound') !== 'false';

export function initAudio() {
    if (!audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
            audioCtx = new AudioContext();
        }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

export function playBeep(type = 'success') {
    if (!soundEnabled) return;
    try {
        initAudio();
        if (!audioCtx) return;

        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);

        const now = audioCtx.currentTime;

        if (type === 'success') {
            // High-pitched crisp POS confirmation chime
            osc.frequency.setValueAtTime(1400, now);
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.1);
            if (navigator.vibrate) navigator.vibrate(40);
        } else if (type === 'checkout') {
            // Two-tone cash register chime
            osc.frequency.setValueAtTime(800, now);
            osc.frequency.exponentialRampToValueAtTime(1600, now + 0.15);
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
            osc.start(now);
            osc.stop(now + 0.25);
            if (navigator.vibrate) navigator.vibrate([40, 30, 80]);
        } else if (type === 'error') {
            // Low error buzz
            osc.frequency.setValueAtTime(320, now);
            gain.gain.setValueAtTime(0.4, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
            osc.start(now);
            osc.stop(now + 0.18);
            if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
        }
    } catch (e) {
        console.warn('Audio feedback failed:', e);
    }
}

export function setupSoundToggle() {
    const btn = document.getElementById('sound-toggle-btn');
    const iconOn = document.getElementById('sound-icon-on');
    const iconOff = document.getElementById('sound-icon-off');

    const updateUI = () => {
        if (soundEnabled) {
            if (iconOn) iconOn.classList.remove('hidden');
            if (iconOff) iconOff.classList.add('hidden');
        } else {
            if (iconOn) iconOn.classList.add('hidden');
            if (iconOff) iconOff.classList.remove('hidden');
        }
    };

    updateUI();

    if (btn) {
        btn.addEventListener('click', () => {
            soundEnabled = !soundEnabled;
            localStorage.setItem('hb_pos_sound', soundEnabled);
            updateUI();
            if (soundEnabled) playBeep('success');
        });
    }
}

export function isSoundEnabled() {
    return soundEnabled;
}
