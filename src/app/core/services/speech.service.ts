import { DOCUMENT } from '@angular/common';
import { Service, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Service()
export class SpeechService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);
  private synth: SpeechSynthesis | null = null;
  private spanishVoices: SpeechSynthesisVoice[] = [];

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.synth = this.document.defaultView?.speechSynthesis ?? null;
      this.refreshVoices();
      if (this.synth) {
        this.synth.onvoiceschanged = () => this.refreshVoices();
      }
    }
  }

  announce(text: string): void {
    if (!this.synth || !text) return;

    // Cancel any queued speech so only the latest card is read aloud.
    this.synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-MX';
    utterance.rate = 1;
    utterance.pitch = 1;

    if (this.spanishVoices.length > 0) {
      utterance.voice = this.spanishVoices[0];
    }

    this.synth.speak(utterance);
  }

  private refreshVoices(): void {
    if (!this.synth) return;
    this.spanishVoices = this.synth
      .getVoices()
      .filter((voice) => voice.lang.toLowerCase().startsWith('es'));
  }
}
