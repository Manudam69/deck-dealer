import { DOCUMENT } from '@angular/common';
import { Service, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

const SPEAK_DELAY_MS = 100;
const NATURAL_VOICE_PATTERN = /natural|neural|online|enhanced|premium/i;

@Service()
export class SpeechService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);
  private synth: SpeechSynthesis | null = null;
  private spanishVoices: SpeechSynthesisVoice[] = [];

  // Keep a strong reference to the active utterance to prevent Chrome's
  // garbage collector from dropping it before it is spoken.
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private queuedUtterances: SpeechSynthesisUtterance[] = [];
  private speakDelayTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.synth = this.document.defaultView?.speechSynthesis ?? null;
      this.refreshVoices();
      if (this.synth) {
        this.synth.onvoiceschanged = () => this.refreshVoices();
      }
    }
  }

  /**
   * Speak a single phrase. If something is already being spoken, it is
   * cancelled and the new phrase starts after a short delay. This avoids
   * Chrome's race condition where `speak()` immediately after `cancel()`
   * is silently dropped.
   */
  announce(text: string): void {
    if (!this.synth || !text) return;

    this.clearQueue();
    this.clearSpeakDelay();

    if (this.isSpeaking()) {
      this.synth.cancel();
      this.speakDelayTimer = setTimeout(() => {
        this.speak(text);
      }, SPEAK_DELAY_MS);
    } else {
      this.speak(text);
    }
  }

  /**
   * Speak a sequence of phrases without cancelling between them.
   * Useful when a card name and an end-of-game message must both be heard.
   */
  announceQueue(texts: string[]): void {
    if (!this.synth || texts.length === 0) return;

    this.clearSpeakDelay();
    this.synth.cancel();
    this.queuedUtterances = [];

    for (const text of texts) {
      const utterance = this.createUtterance(text);
      this.queuedUtterances.push(utterance);
    }

    for (let i = 0; i < this.queuedUtterances.length - 1; i++) {
      const current = this.queuedUtterances[i]!;
      const next = this.queuedUtterances[i + 1]!;
      current.onend = () => {
        this.currentUtterance = next;
        this.synth?.speak(next);
      };
      current.onerror = () => {
        this.currentUtterance = next;
        this.synth?.speak(next);
      };
    }

    // If the queue is interrupted by announce(), the cancelled onend still
    // references utterances from the old queue. Guard speak() so it only runs
    // while the queue is still current.
    const queueId = this.queuedUtterances;
    for (const utterance of this.queuedUtterances) {
      const originalOnEnd = utterance.onend;
      const originalOnError = utterance.onerror;
      utterance.onend = (event) => {
        if (this.queuedUtterances === queueId) {
          originalOnEnd?.call(utterance, event);
        }
      };
      utterance.onerror = (event) => {
        if (this.queuedUtterances === queueId) {
          originalOnError?.call(utterance, event);
        }
      };
    }

    const first = this.queuedUtterances[0];
    if (first) {
      this.currentUtterance = first;
      this.synth.speak(first);
    }
  }

  isSpeaking(): boolean {
    return !!this.synth && (this.synth.speaking || this.synth.pending);
  }

  private speak(text: string): void {
    if (!this.synth) return;
    this.currentUtterance = this.createUtterance(text);
    this.synth.speak(this.currentUtterance);
  }

  private createUtterance(text: string): SpeechSynthesisUtterance {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-MX';
    utterance.rate = 0.9;
    utterance.pitch = 1;

    const preferredVoice = this.spanishVoices[0];
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    return utterance;
  }

  private clearQueue(): void {
    this.queuedUtterances = [];
  }

  private clearSpeakDelay(): void {
    if (this.speakDelayTimer) {
      clearTimeout(this.speakDelayTimer);
      this.speakDelayTimer = null;
    }
  }

  private refreshVoices(): void {
    if (!this.synth) return;
    this.spanishVoices = this.synth
      .getVoices()
      .filter((voice) => voice.lang.toLowerCase().startsWith('es'))
      .sort((first, second) => this.voiceScore(second) - this.voiceScore(first));
  }

  private voiceScore(voice: SpeechSynthesisVoice): number {
    const language = voice.lang.toLowerCase();
    const name = voice.name.toLowerCase();

    return (
      (language === 'es-mx' ? 8 : 0) +
      (language.startsWith('es-mx-') ? 4 : 0) +
      (NATURAL_VOICE_PATTERN.test(name) ? 2 : 0) +
      (voice.localService ? 1 : 0)
    );
  }
}
