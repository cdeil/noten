import { useEffect, useMemo, useRef, useState } from 'react';
import { NoteStaff, type OrientationRef } from './NoteStaff';
import { InputArea, type InputMode } from './InputArea';
import { Result } from './Result';
import {
  isCorrect, midiToSongPitch, randomPitch,
  type Clef, type Difficulty, type Pitch,
} from './notes';
import { ensureAudio, playCheer, playError, playMidi } from './audio';
import { SONGS, type Song } from './songs';

export type DisplayMode = 'single' | 'sheet';

export interface GameSettings {
  gameType: 'practice' | 'song';
  clef: Clef;
  difficulty: Difficulty;
  withAccidentals: boolean;
  inputMode: InputMode;
  showOrientation: boolean;       // initial state of toggle
  displayMode: DisplayMode;
  total: number;
}

const SHEET_WINDOW = 6;
const SHEET_LOOK_BACK = 2;
const PRACTICE_BUFFER = 16;

// Reference tones shown at the start of the staff when orientation is on.
const REFERENCES: Record<Clef, OrientationRef[]> = {
  treble: [{ midi: 60 }, { midi: 67 }],            // c', g'
  bass:   [{ midi: 53 }, { midi: 60 }],            // f, c'
};

function generatePractice(settings: GameSettings, prevMidi?: number, count = 1): Pitch[] {
  const out: Pitch[] = [];
  let prev = prevMidi;
  for (let i = 0; i < count; i++) {
    const p = randomPitch({
      clef: settings.clef,
      difficulty: settings.difficulty,
      withAccidentals: settings.withAccidentals,
      prevMidi: prev,
    });
    out.push(p);
    prev = p.midi;
  }
  return out;
}

function buildSongPitches(song: Song): Pitch[] {
  return song.notes.map((m) => midiToSongPitch(m, song.clef));
}

export function Game({ settings, onExit }: { settings: GameSettings; onExit: () => void }) {
  const song = useMemo<Song | null>(() => {
    if (settings.gameType !== 'song') return null;
    return SONGS[Math.floor(Math.random() * SONGS.length)];
  }, [settings.gameType]);

  const effectiveClef: Clef = song ? song.clef : settings.clef;

  const [notes, setNotes] = useState<Pitch[]>(() => {
    if (song) return buildSongPitches(song);
    return settings.total > 0
      ? generatePractice(settings, undefined, settings.total)
      : generatePractice(settings, undefined, PRACTICE_BUFFER);
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [errors, setErrors] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [done, setDone] = useState(false);
  const [showOrient, setShowOrient] = useState(settings.showOrientation);
  const lockRef = useRef(false);

  useEffect(() => { ensureAudio(); }, []);

  const total = song ? song.notes.length : settings.total;
  const pitch = notes[currentIndex];

  const advance = () => {
    setFeedback(null);
    lockRef.current = false;
    setCurrentIndex((idx) => {
      const next = idx + 1;
      if (song) {
        if (next >= notes.length) { setDone(true); playCheer(); return idx; }
        return next;
      }
      if (total > 0) return next;
      if (next >= notes.length - 4) {
        setNotes((prev) => [...prev, ...generatePractice(settings, prev[prev.length - 1].midi, PRACTICE_BUFFER)]);
      }
      return next;
    });
  };

  const handlePick = (pitchClass: number) => {
    if (lockRef.current || done) return;
    ensureAudio();
    setAttempts((a) => a + 1);
    if (isCorrect(pitch, pitchClass)) {
      lockRef.current = true;
      playMidi(pitch.midi);
      setFeedback('correct');
      const newScore = score + 1;
      setScore(newScore);
      if (!song && total > 0 && newScore >= total) {
        setTimeout(() => { setDone(true); playCheer(); }, 600);
        return;
      }
      setTimeout(advance, 650);
    } else {
      playError();
      setErrors((e) => e + 1);
      setFeedback('wrong');
      setTimeout(() => setFeedback(null), 350);
    }
  };

  if (done) {
    return (
      <Result
        score={score}
        attempts={attempts}
        errors={errors}
        title={song ? `🎵 Das war: „${song.title}"` : undefined}
        onAgain={() => {
          if (song) setNotes(buildSongPitches(song));
          else {
            const fresh = settings.total > 0
              ? generatePractice(settings, undefined, settings.total)
              : generatePractice(settings, undefined, PRACTICE_BUFFER);
            setNotes(fresh);
          }
          setScore(0); setAttempts(0); setErrors(0); setDone(false);
          setCurrentIndex(0);
          setFeedback(null);
          lockRef.current = false;
        }}
        onExit={onExit}
      />
    );
  }

  const progressPct = total > 0 ? Math.min(100, (score / total) * 100) : 0;
  const refs = showOrient ? REFERENCES[effectiveClef] : undefined;

  // For sheet mode, compute window of notes around currentIndex.
  const windowStart = Math.max(0, currentIndex - SHEET_LOOK_BACK);
  const windowEnd = Math.min(notes.length, windowStart + SHEET_WINDOW);
  const windowPitches = notes.slice(windowStart, windowEnd);
  const windowCurrent = currentIndex - windowStart;

  const playRef = (m: number) => playMidi(m);

  return (
    <div className="game" data-testid="game" data-display={settings.displayMode}>
      <header className="game-header">
        <button className="link-btn" onClick={onExit} data-testid="exit-btn">← Zurück</button>
        <div className="game-title">
          {song ? '🎵 Erkenne das Lied!' : effectiveClef === 'treble' ? 'Violinschlüssel' : 'Bassschlüssel'}
          {settings.difficulty === 'hard' && !song && <span className="badge">Schwer</span>}
        </div>
        <div className="header-right">
          <button
            className={`toggle-btn ${showOrient ? 'on' : ''}`}
            onClick={() => setShowOrient((v) => !v)}
            data-testid="orient-toggle"
            aria-pressed={showOrient}
            title="Orientierungstöne ein/aus"
          >
            🎯 Orientierung
          </button>
          <div className="score-row">
            <div data-testid="score">Punkte: <strong>{score}</strong>{total > 0 ? ` / ${total}` : ''}</div>
            <div className="muted" data-testid="errors">Fehler: {errors}</div>
          </div>
        </div>
      </header>

      {total > 0 && (
        <div className="progress" data-testid="progress">
          <div className="progress-fill" style={{ width: `${progressPct}%` }} />
        </div>
      )}

      <div className="hint" data-testid="hint">
        {feedback === 'wrong' ? 'Versuch es noch einmal!' : 'Welche Note ist das?'}
      </div>

      <main className="staff-area">
        {settings.displayMode === 'sheet' ? (
          <NoteStaff
            mode="sheet"
            clef={effectiveClef}
            pitches={windowPitches}
            currentIndex={windowCurrent}
            feedback={feedback}
            references={refs}
            onRefClick={playRef}
            width={820}
            height={220}
          />
        ) : (
          <NoteStaff
            mode="single"
            clef={effectiveClef}
            pitch={pitch}
            feedback={feedback}
            references={refs}
            onRefClick={playRef}
            width={refs ? 520 : 380}
            height={220}
          />
        )}
      </main>

      <footer className="input-footer">
        <InputArea
          inputMode={settings.inputMode}
          withAccidentals={settings.withAccidentals}
          onPick={handlePick}
        />
      </footer>
    </div>
  );
}
