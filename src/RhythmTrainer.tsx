import { useEffect, useMemo, useRef, useState } from 'react';
import { NoteStaff, type NoteState } from './NoteStaff';
import { Result } from './Result';
import { midiToNaturalPitch } from './notes';
import { ensureAudio, playDrumHit, playMetronomeClick } from './audio';
import type { NoteDuration } from './songs';

type RhythmToken = { duration: NoteDuration; rest?: boolean };

const RHYTHM_PATTERNS: RhythmToken[][] = [
  [
    { duration: 'q' }, { duration: 'q' }, { duration: 'q' }, { duration: 'q' },
    { duration: 'q' }, { duration: 'q' }, { duration: 'q' }, { duration: 'q' },
  ],
  [
    { duration: 'h' }, { duration: 'h' },
    { duration: 'q' }, { duration: 'q' }, { duration: 'h' },
  ],
  [
    { duration: 'q' }, { duration: 'q', rest: true }, { duration: 'q' }, { duration: 'q' },
    { duration: 'h' }, { duration: 'q', rest: true }, { duration: 'q' },
  ],
  [
    { duration: 'h' }, { duration: 'q' }, { duration: 'q', rest: true },
    { duration: 'q' }, { duration: 'q' }, { duration: 'q' }, { duration: 'q' },
  ],
  [
    { duration: 'q', rest: true }, { duration: 'q' }, { duration: 'h' },
    { duration: 'q' }, { duration: 'q' }, { duration: 'q' }, { duration: 'q' },
  ],
];

const PERFECT_WINDOW_MS = 90;
const GOOD_WINDOW_MS = 180;
const TARGET_CYCLES = 3;
const LEAD_IN_BEATS = 4;
const RHYTHM_MIDI = 71;

function durationToBeats(duration: NoteDuration): number {
  switch (duration) {
    case 'w': return 4;
    case 'h': return 2;
    case 'q': return 1;
  }
}

function buildRhythmTimeline(pattern: RhythmToken[]) {
  const events: Array<{ timeMs: number; noteIndex: number }> = [];
  const tokens: Array<{ noteIndex: number; startBeat: number; endBeat: number; rest: boolean }> = [];
  let beatCursor = 0;
  let secondMeasureIndex = -1;

  pattern.forEach((token, index) => {
    if (beatCursor >= 4 && secondMeasureIndex === -1) secondMeasureIndex = index;
    const beats = durationToBeats(token.duration);
    tokens.push({
      noteIndex: index,
      startBeat: beatCursor,
      endBeat: beatCursor + beats,
      rest: !!token.rest,
    });
    if (!token.rest) events.push({ timeMs: beatCursor, noteIndex: index });
    beatCursor += beats;
  });

  return {
    events,
    tokens,
    secondMeasureIndex,
    totalBeats: beatCursor,
  };
}

function getActiveTokenIndex(
  tokens: Array<{ noteIndex: number; startBeat: number; endBeat: number }>,
  cycleBeat: number,
  totalBeats: number,
) {
  const clampedBeat = Math.max(0, Math.min(cycleBeat, totalBeats - 0.0001));
  const activeToken = tokens.find((token) => clampedBeat >= token.startBeat && clampedBeat < token.endBeat);
  return activeToken?.noteIndex ?? tokens[tokens.length - 1]?.noteIndex ?? 0;
}

function decorateStates(states: NoteState[], activeNoteIndex: number | null) {
  return states.map((state, index) => (
    activeNoteIndex !== null && index === activeNoteIndex && state === 'idle' ? 'current' : state
  ));
}

export function RhythmTrainer({
  bpm,
  onExit,
}: {
  bpm: number;
  onExit: () => void;
}) {
  const [pattern, setPattern] = useState<RhythmToken[]>(() => RHYTHM_PATTERNS[Math.floor(Math.random() * RHYTHM_PATTERNS.length)]);
  const [noteStates, setNoteStates] = useState<NoteState[]>(() => pattern.map(() => 'idle'));
  const [errors, setErrors] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [done, setDone] = useState(false);
  const [consecutiveCycles, setConsecutiveCycles] = useState(0);
  const [leadInActive, setLeadInActive] = useState(true);
  const [markerIndex, setMarkerIndex] = useState<number | null>(0);
  const [beatInBar, setBeatInBar] = useState(1);

  const beatMs = 60000 / bpm;
  const startAtRef = useRef<number | null>(null);
  const cycleIndexRef = useRef(-1);
  const matchedEventsRef = useRef<boolean[]>([]);
  const cycleStatesRef = useRef<NoteState[]>(pattern.map(() => 'idle'));
  const extraMissesRef = useRef(0);
  const currentCycleRef = useRef(0);
  const doneRef = useRef(false);
  const activeNoteIndexRef = useRef<number | null>(0);
  const lastMetronomeBeatRef = useRef(0);

  const rhythmPitch = useMemo(() => midiToNaturalPitch(RHYTHM_MIDI, 'treble'), []);
  const durations = pattern.map((token) => token.duration);
  const rests = pattern.map((token) => !!token.rest);
  const { events, tokens, secondMeasureIndex, totalBeats } = useMemo(() => buildRhythmTimeline(pattern), [pattern]);
  const measureBreakIndices = secondMeasureIndex >= 0 ? [secondMeasureIndex] : [];

  useEffect(() => {
    ensureAudio();
    startAtRef.current = performance.now();
    cycleIndexRef.current = -1;
    matchedEventsRef.current = [];
    cycleStatesRef.current = pattern.map(() => 'idle');
    extraMissesRef.current = 0;
    doneRef.current = false;
    activeNoteIndexRef.current = events[0]?.noteIndex ?? 0;
    lastMetronomeBeatRef.current = 0;
    setBeatInBar(1);
    setMarkerIndex(activeNoteIndexRef.current);
    setNoteStates(decorateStates(pattern.map(() => 'idle'), activeNoteIndexRef.current));
    playMetronomeClick(true);
    return () => {
      doneRef.current = true;
    };
  }, [events, pattern]);

  useEffect(() => {
    const id = window.setInterval(() => {
      const startAt = startAtRef.current;
      if (startAt === null || doneRef.current) return;

      const elapsed = performance.now() - startAt;
      const elapsedBeats = elapsed / beatMs;

      if (elapsedBeats < LEAD_IN_BEATS) {
        setLeadInActive(true);
        const leadIndex = events[0]?.noteIndex ?? 0;
        activeNoteIndexRef.current = leadIndex;
        setMarkerIndex(leadIndex);
        setNoteStates(decorateStates(cycleStatesRef.current, leadIndex));
        return;
      }

      setLeadInActive(false);
      const activeBeat = elapsedBeats - LEAD_IN_BEATS;
      const cycle = Math.floor(activeBeat / totalBeats);
      const cycleBeat = activeBeat - cycle * totalBeats;
      if (cycle !== cycleIndexRef.current) {
        if (cycleIndexRef.current >= 0) finalizeCycle();
        cycleIndexRef.current = cycle;
        currentCycleRef.current = cycle;
        matchedEventsRef.current = events.map(() => false);
        cycleStatesRef.current = pattern.map(() => 'idle');
      }
      const nextActiveIndex = getActiveTokenIndex(tokens, cycleBeat, totalBeats);
      activeNoteIndexRef.current = nextActiveIndex;
      setMarkerIndex(nextActiveIndex);
      setNoteStates(decorateStates(cycleStatesRef.current, nextActiveIndex));
    }, 30);

    return () => window.clearInterval(id);
  }, [beatMs, events, pattern, tokens, totalBeats]);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (doneRef.current) return;
      const startAt = startAtRef.current;
      if (startAt === null) return;
      const beatNumber = Math.floor((performance.now() - startAt) / beatMs);
      if (beatNumber === lastMetronomeBeatRef.current) return;
      lastMetronomeBeatRef.current = beatNumber;
      setBeatInBar((beatNumber % 4) + 1);
      playMetronomeClick(beatNumber % 4 === 0);
    }, 30);

    return () => window.clearInterval(id);
  }, [beatMs]);

  const finalizeCycle = () => {
    const nextStates = [...cycleStatesRef.current];
    let cycleFailed = extraMissesRef.current > 0;

    events.forEach((event, index) => {
      if (!matchedEventsRef.current[index]) {
        nextStates[event.noteIndex] = 'miss';
        cycleFailed = true;
      }
    });

    cycleStatesRef.current = nextStates;
    setNoteStates(decorateStates(nextStates, activeNoteIndexRef.current));
    extraMissesRef.current = 0;

    setConsecutiveCycles((value) => {
      const next = cycleFailed ? 0 : value + 1;
      if (next >= TARGET_CYCLES) {
        doneRef.current = true;
        setDone(true);
      }
      return next;
    });

    if (cycleFailed) setErrors((value) => value + 1);
  };

  const handleDrumHit = () => {
    ensureAudio();
    playDrumHit();
    setAttempts((value) => value + 1);

    const startAt = startAtRef.current;
    if (startAt === null || doneRef.current) return;

    const elapsed = performance.now() - startAt;
    const elapsedBeats = elapsed / beatMs;
    if (elapsedBeats < LEAD_IN_BEATS) return;

    const activeBeats = elapsedBeats - LEAD_IN_BEATS;
    const cycle = Math.floor(activeBeats / totalBeats);
    const positionMs = (activeBeats - cycle * totalBeats) * beatMs;

    if (cycle !== cycleIndexRef.current) return;

    let bestEventIndex = -1;
    let bestDelta = Number.POSITIVE_INFINITY;
    events.forEach((event, index) => {
      if (matchedEventsRef.current[index]) return;
      const delta = Math.abs(positionMs - event.timeMs * beatMs);
      if (delta < bestDelta) {
        bestDelta = delta;
        bestEventIndex = index;
      }
    });

    if (bestEventIndex >= 0 && bestDelta <= GOOD_WINDOW_MS) {
      matchedEventsRef.current[bestEventIndex] = true;
      const noteIndex = events[bestEventIndex].noteIndex;
      cycleStatesRef.current[noteIndex] = bestDelta <= PERFECT_WINDOW_MS ? 'perfect' : 'good';
      setNoteStates(decorateStates(cycleStatesRef.current, activeNoteIndexRef.current));
      return;
    }

    const currentNoteIndex = activeNoteIndexRef.current ?? 0;
    cycleStatesRef.current[currentNoteIndex] = 'miss';
    setNoteStates(decorateStates(cycleStatesRef.current, activeNoteIndexRef.current));
    extraMissesRef.current += 1;
  };

  if (done) {
    return (
      <Result
        score={TARGET_CYCLES}
        attempts={attempts}
        errors={errors}
        title="🥁 Rhythmus geschafft!"
        onAgain={() => {
          const nextPattern = RHYTHM_PATTERNS[Math.floor(Math.random() * RHYTHM_PATTERNS.length)];
          setPattern(nextPattern);
          setNoteStates(nextPattern.map(() => 'idle'));
          setErrors(0);
          setAttempts(0);
          setDone(false);
          setConsecutiveCycles(0);
          setLeadInActive(true);
          setMarkerIndex(0);
          setBeatInBar(1);
        }}
        onExit={onExit}
      />
    );
  }

  return (
    <div
      className="game rhythm-game"
      data-testid="game"
      data-mode="rhythms"
      data-rhythm-beat={beatInBar}
    >
      <header className="game-header">
        <button className="link-btn" onClick={onExit} data-testid="exit-btn">← Zurück</button>
        <div className="game-title">
          🥁 Rhythmen lernen
          <span className="badge metronome-badge">{bpm} BPM</span>
        </div>
        <div className="score-row rhythm-score">
          <div data-testid="score">Durchgänge: <strong>{consecutiveCycles}</strong> / {TARGET_CYCLES}</div>
          <div className="muted" data-testid="errors">Fehler: {errors}</div>
        </div>
      </header>

      <div className="rhythm-status" data-testid="rhythm-status">
        {leadInActive ? 'Ein Takt Vorzähler …' : 'Spiele den Rhythmus drei Mal hintereinander sauber.'}
      </div>

      <main className="staff-area">
        <NoteStaff
          mode="sheet"
          clef="treble"
          pitches={pattern.map(() => rhythmPitch)}
          durations={durations}
          rests={rests}
          currentIndex={0}
          noteStates={noteStates}
          measureBreakIndices={measureBreakIndices}
          markerIndex={markerIndex}
          activeIndex={markerIndex}
          width={860}
          height={240}
        />
      </main>

      <footer className="input-footer">
        <button className="drum-pad" data-testid="drum-pad" onPointerDown={(event) => {
          event.preventDefault();
          handleDrumHit();
        }}>
          Drum
        </button>
      </footer>
    </div>
  );
}
