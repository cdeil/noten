import { useEffect, useMemo, useRef, useState } from 'react';
import { NoteStaff } from './NoteStaff';
import { SheetMusicStaff } from './SheetMusicStaff';
import { InputArea, type InputMode } from './InputArea';
import { OrientationPanel } from './OrientationPanel';
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
  showOrientation: boolean;
  displayMode: DisplayMode;
  total: number;         // 0 = endlos (practice only)
}

const SHEET_WINDOW = 8;     // notes shown in sheet view
const SHEET_LOOK_BACK = 3;  // current note position from left
const PRACTICE_BUFFER = 16; // how many notes to keep "ahead" in practice

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
  // Choose a random song once when entering song mode (hidden until end).
  const song = useMemo<Song | null>(() => {
    if (settings.gameType !== 'song') return null;
    return SONGS[Math.floor(Math.random() * SONGS.length)];
  }, [settings.gameType]);

  const effectiveClef: Clef = song ? song.clef : settings.clef;

  const [notes, setNotes] = useState<Pitch[]>(() => {
    if (song) return buildSongPitches(song);
    const initial = settings.total > 0
      ? generatePractice(settings, undefined, settings.total)
      : generatePractice(settings, undefined, PRACTICE_BUFFER);
    return initial;
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [errors, setErrors] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [done, setDone] = useState(false);
  const lockRef = useRef(false);

  useEffect(() => { void ensureAudio(); }, []);

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
      // Practice
      if (total > 0) return next;
      // Endless: extend buffer if needed
      if (next >= notes.length - 4) {
        setNotes((prev) => [...prev, ...generatePractice(settings, prev[prev.length - 1].midi, PRACTICE_BUFFER)]);
      }
      return next;
    });
  };

  const handlePick = async (pitchClass: number) => {
    if (lockRef.current || done) return;
    await ensureAudio();
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
          if (song) {
            // reset same song or pick a new one? Keep current but reset progress.
            setNotes(buildSongPitches(song));
          } else {
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

  // For sheet mode, compute window of notes around currentIndex.
  const windowStart = Math.max(0, currentIndex - SHEET_LOOK_BACK);
  const windowEnd = Math.min(notes.length, windowStart + SHEET_WINDOW);
  const windowPitches = notes.slice(windowStart, windowEnd);
  const windowCurrent = currentIndex - windowStart;

  return (
    <div className="game" data-testid="game" data-display={settings.displayMode}>
      <header className="game-header">
        <button className="link-btn" onClick={onExit} data-testid="exit-btn">← Zurück</button>
        <div className="game-title">
          {song ? '🎵 Erkenne das Lied!' : effectiveClef === 'treble' ? 'Violinschlüssel' : 'Bassschlüssel'}
          {settings.difficulty === 'hard' && !song && <span className="badge">Schwer</span>}
        </div>
        <div className="score-row">
          <div data-testid="score">Punkte: <strong>{score}</strong>{total > 0 ? ` / ${total}` : ''}</div>
          <div className="muted" data-testid="errors">Fehler: {errors}</div>
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

      <main className={`play-area ${settings.showOrientation ? 'with-orient' : ''}`}>
        {settings.showOrientation && <OrientationPanel clef={effectiveClef} />}
        <div className="staff-area">
          {settings.displayMode === 'sheet' ? (
            <SheetMusicStaff
              clef={effectiveClef}
              pitches={windowPitches}
              currentIndex={windowCurrent}
              feedback={feedback}
            />
          ) : (
            <NoteStaff
              clef={pitch.clef}
              vexKey={pitch.vexKey}
              accidental={pitch.accidental}
              feedback={feedback}
              width={420}
              height={240}
            />
          )}
        </div>
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
