import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { DestroyRef, inject, OnDestroy, PLATFORM_ID, Service, signal } from '@angular/core';

@Service()
export class WakeLockService implements OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);

  private sentinel: WakeLockSentinel | null = null;
  private requested = false;
  private generation = 0;
  private pendingRequest: Promise<void> | null = null;

  readonly active = signal(false);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.document.addEventListener('visibilitychange', () => this.onVisibilityChange());
      this.destroyRef.onDestroy(() => this.release());
    }
  }

  async request(): Promise<void> {
    const nav = this.document.defaultView?.navigator;
    if (!nav?.wakeLock) return;

    this.requested = true;

    if (this.sentinel && !this.sentinel.released) {
      this.active.set(true);
      return;
    }

    const gen = ++this.generation;

    const doRequest = async (): Promise<void> => {
      try {
        const sentinel = await nav.wakeLock.request('screen');
        if (gen !== this.generation) {
          await sentinel.release().catch(() => undefined);
          return;
        }
        this.sentinel = sentinel;
        this.active.set(true);
        sentinel.addEventListener('release', () => this.onReleased());
      } catch {
        this.active.set(false);
      }
    };

    this.pendingRequest = doRequest();
    try {
      await this.pendingRequest;
    } finally {
      this.pendingRequest = null;
    }
  }

  async release(): Promise<void> {
    this.requested = false;
    this.generation++;

    if (this.pendingRequest) {
      await this.pendingRequest.catch(() => undefined);
    }

    const sentinel = this.sentinel;
    this.sentinel = null;
    this.active.set(false);

    if (!sentinel || sentinel.released) return;
    await sentinel.release().catch(() => undefined);
  }

  private onVisibilityChange(): void {
    if (this.document.visibilityState !== 'visible') return;
    if (!this.requested) return;
    void this.request();
  }

  private onReleased(): void {
    if (this.sentinel?.released !== false) {
      this.sentinel = null;
      this.active.set(false);
    }
  }

  ngOnDestroy(): void {
    void this.release();
  }
}
