import { useEffect, useRef, useState } from 'react';
import { NoteStaff } from './NoteStaff';
import { Piano } from './Piano';
import { isCorrect, randomPitch, type Mode, type Pitch } from './notes';
import { ensureAudio, playCheer, playError, playMidi } from './audio';
import { Result } from './Result';

export interface GameSettings {
  mode: Mode;
  withAccidentals: boolean;
  total: number;
}

export function Game({ settings, onExit }: { settings: GameSettings; onExit: () => void }) {
  const [pitch, setPitch] = useState<Pitch>(() => randomPitch(settings.mode, settings.withAccidentals));
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [errors, setErrors] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [done, setDone] = useState(false);
  const lockRef = useRef(false);
  const prevMidiRef = useRef<number | undefined>(pitch.midi);

  useEffect(() => { void ensureAudio(); }, []);

  const advance = () => {
    const next = randomPitch(settings.mode, settings.withAccidentals, prevMidiRef.current);
    prevMidiRef.current = next.midi;
    setPitch(next);
    setFeedback(null);
    lockRef.current = false;
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
      if (settings.total > 0 && newScore >= settings.total) {
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
        onAgain={() => {
          setScore(0); setAttempts(0); setErrors(0); setDone(false);
          advance();
        }}
        onExit={onExit}
      />
    );
  }

  const total = settings.total;
  const progressPct = total > 0 ? Math.min(100, (score / total) * 100) : 0;

  return (
    <div className="game" data-testid="game">
      <header className="game-header">
        <button className="link-btn" onClick={onExit} data-testid="exit-btn">← Zurück</button>
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
      <main className="staff-area">
        <NoteStaff
          clef={pitch.clef}
          vexKey={pitch.vexKey}
          accidental={pitch.accidental}
          feedback={feedback}
        />
        <div className="hint" data-testid="hint">
          {feedback === 'wrong' ? 'Versuch es noch einmal!' : 'Welche Note ist das?'}
        </div>
      </main>
      <footer className="input-area">
        <Piano
          withAccidentals={settings.withAccidentals}
          onPick={handlePick}
        />
      </footer>
    </div>
  );
}
