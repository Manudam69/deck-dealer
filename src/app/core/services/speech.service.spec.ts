import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { vi } from 'vitest';
import { SpeechService } from './speech.service';

interface FakeUtterance {
  text: string;
  lang: string;
  rate: number;
  pitch: number;
  voice: SpeechSynthesisVoice | null;
  onend: ((event: Event) => void) | null;
  onerror: ((event: Event) => void) | null;
}

function createFakeSpeechSynthesis(): {
  synth: SpeechSynthesis;
  spokenTexts: string[];
  spokenUtterances: FakeUtterance[];
  finishSpeaking: () => void;
} {
  const spokenTexts: string[] = [];
  const spokenUtterances: FakeUtterance[] = [];
  let currentUtterance: FakeUtterance | null = null;

  vi.stubGlobal(
    'SpeechSynthesisUtterance',
    class {
      text = '';
      lang = '';
      rate = 1;
      pitch = 1;
      voice = null;
      onend: ((event: Event) => void) | null = null;
      onerror: ((event: Event) => void) | null = null;
      constructor(input: string) {
        this.text = input;
      }
    }
  );

  const synth: SpeechSynthesis = {
    speaking: false,
    pending: false,
    getVoices: () => [
      { lang: 'es-MX', name: 'Test Spanish', default: false, localService: false, voiceURI: '' } as SpeechSynthesisVoice,
    ],
    cancel: () => {
      if (currentUtterance) {
        const u = currentUtterance;
        currentUtterance = null;
        u.onerror?.(new Event('error') as SpeechSynthesisErrorEvent);
      }
      (synth as any).speaking = false;
      (synth as any).pending = false;
    },
    speak: (utterance: FakeUtterance) => {
      spokenTexts.push(utterance.text);
      spokenUtterances.push(utterance);
      currentUtterance = utterance;
      (synth as any).speaking = true;
      (synth as any).pending = false;
    },
    onvoiceschanged: null,
  } as unknown as SpeechSynthesis;

  const finishSpeaking = () => {
    if (currentUtterance) {
      const u = currentUtterance;
      currentUtterance = null;
      u.onend?.(new Event('end') as SpeechSynthesisEvent);
      if (!currentUtterance) {
        (synth as any).speaking = false;
      }
    }
  };

  return { synth, spokenTexts, spokenUtterances, finishSpeaking };
}

function createFakeDocument(synth: SpeechSynthesis): Document {
  return {
    defaultView: {
      speechSynthesis: synth,
    },
  } as unknown as Document;
}

describe('SpeechService', () => {
  let fakeSynth: SpeechSynthesis;
  let spokenTexts: string[];
  let spokenUtterances: FakeUtterance[];
  let finishSpeaking: () => void;

  beforeEach(() => {
    const fake = createFakeSpeechSynthesis();
    fakeSynth = fake.synth;
    spokenTexts = fake.spokenTexts;
    spokenUtterances = fake.spokenUtterances;
    finishSpeaking = fake.finishSpeaking;

    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function configureService() {
    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: DOCUMENT, useValue: createFakeDocument(fakeSynth) },
      ],
    });
    return TestBed.inject(SpeechService);
  }

  it('announces text immediately when idle', () => {
    const service = configureService();
    service.announce('El Gallo');
    expect(spokenTexts).toEqual(['El Gallo']);
  });

  it('prefers a natural Mexican Spanish voice at a clearer pace', () => {
    const genericSpanishVoice = {
      lang: 'es-ES',
      name: 'Spanish Standard',
      default: false,
      localService: false,
      voiceURI: '',
    } as SpeechSynthesisVoice;
    const mexicanNaturalVoice = {
      lang: 'es-MX',
      name: 'Microsoft Dalia Online (Natural)',
      default: false,
      localService: false,
      voiceURI: '',
    } as SpeechSynthesisVoice;
    vi.spyOn(fakeSynth, 'getVoices').mockReturnValue([
      genericSpanishVoice,
      mexicanNaturalVoice,
    ]);

    const service = configureService();
    service.announce('El Gallo');

    expect(spokenUtterances[0]?.voice).toBe(mexicanNaturalVoice);
    expect(spokenUtterances[0]?.rate).toBe(0.9);
  });

  it('delays the next announcement if already speaking', () => {
    const service = configureService();
    service.announce('El Gallo');
    expect(spokenTexts).toEqual(['El Gallo']);

    service.announce('El Diablito');
    expect(spokenTexts).toEqual(['El Gallo']);

    vi.advanceTimersByTime(100);
    expect(spokenTexts).toEqual(['El Gallo', 'El Diablito']);
  });

  it('only keeps the latest announcement when called rapidly', () => {
    const service = configureService();
    service.announce('El Gallo');
    service.announce('El Diablito');
    service.announce('La Dama');

    vi.advanceTimersByTime(100);
    expect(spokenTexts).toEqual(['El Gallo', 'La Dama']);
  });

  it('reports speaking state correctly', () => {
    const service = configureService();
    expect(service.isSpeaking()).toBe(false);

    service.announce('El Gallo');
    expect(service.isSpeaking()).toBe(true);

    finishSpeaking();
    expect(service.isSpeaking()).toBe(false);
  });

  it('announces queued texts sequentially without cancelling between them', () => {
    const service = configureService();
    service.announceQueue(['El Gallo', 'Se acabó la baraja']);

    expect(spokenTexts).toEqual(['El Gallo']);

    finishSpeaking();
    expect(spokenTexts).toEqual(['El Gallo', 'Se acabó la baraja']);
  });

  it('cancels a running queue when announce() is called', () => {
    const service = configureService();
    service.announceQueue(['El Gallo', 'Se acabó la baraja']);

    service.announce('La Dama');
    vi.advanceTimersByTime(100);

    expect(spokenTexts.at(-1)).toBe('La Dama');

    // The old queue should not continue after being cancelled.
    finishSpeaking();
    expect(spokenTexts.at(-1)).toBe('La Dama');
  });

  it('does nothing when text is empty', () => {
    const service = configureService();
    service.announce('');
    expect(spokenTexts).toEqual([]);
  });
});
