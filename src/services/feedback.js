// HB Works POS - Audio & Haptics Feedback Service
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// Web Audio API context for browser/web mode
let audioCtx = null;

function getAudioContext() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playFeedback(type = 'success', soundEnabled = true) {
  // 1. Trigger Native Haptics
  try {
    if (type === 'success') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else if (type === 'scan') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else if (type === 'checkout') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (type === 'error') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else if (type === 'warning') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  } catch (err) {
    // Haptics not available on current device/environment
  }

  // 2. Play Web Audio synthesized chimes (when sound is enabled)
  if (!soundEnabled) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    if (type === 'scan' || type === 'success') {
      // Pleasant high-frequency POS scan beep (1760Hz -> A6)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1760, now);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    } else if (type === 'checkout') {
      // Ascending two-tone cash register chime (880Hz -> 1760Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(880, now);
      osc1.frequency.exponentialRampToValueAtTime(1760, now + 0.2);
      gain1.gain.setValueAtTime(0.2, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);
    } else if (type === 'error') {
      // Low dual-buzzer (220Hz)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.setValueAtTime(180, now + 0.1);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    }
  } catch (err) {
    // Audio context prevented or blocked
  }
}
