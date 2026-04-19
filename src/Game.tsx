import { useEffect, useRef, useState } from 'react';
import { NoteStaff } from './NoteStaff';
import { InputArea, type InputMode } from './InputArea';
import { OrientationIntro } from './OrientationIntro';
import { Result } from './Result';
import {
  isCorrect, midiToNaturalPitch, randomPitch,
  type Clef, type Difficulty, type Pitch,
} from './notes';
import { ensureAudio, playCheer, playError, playMidi } from './audio';
import { SONGS } from './songs';

export interface GameSettings {
  gameType: 'practice' | 'song';
  clef: Clef;            // for practice (and copied from song for song mode)
  difficulty: Difficulty;
  withAccidentals: boolean;
  inputMode: InputMode;
  showOrientation: boolean;
  total: number;         // 0 = endlos (practice only)
  songId?: string;
}

function pickFirst(settings: GameSettings): { pitch: Pitch; songIndex: number } {
  if (settings.gameType === 'song') {
    const song = SONGS.find((s) => s.id === settings.songId)!;
    return { pitch: midiToNaturalPitch(song.notes[0], song.clef), songIndex: 0 };
  }
  return {
    pitch: randomPitch({
      clef: settings.clef,
      difficulty: settings.difficulty,
      withAccidentals: settings.withAccidentals,
    }),
    songIndex: 0,
  };
}

export function Game({ settings, onExit }: { settings: GameSettings; onExit: () => void }) {
  const [showIntro, setShowIntro] = useState(settings.showOrientation && settings.gameType === 'practice');
  const initial = useRef(pickFirst(settings));
  const [pitch, setPitch] = useState<Pitch>(initial.current.pitch);
  const [songIndex, setSongIndex] = useState(initial.current.songIndex);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [errors, setErrors] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [done, setDone] = useState(false);
  const lockRef = useRef(false);
  const prevMidiRef = useRef<number | undefined>(initial.current.pitch.midi);

  useEffect(() => { void ensureAudio(); }, []);

  const song = settings.gameType === 'song' ? SONGS.find((s) => s.id === settings.songId)! : null;
  const total = song ? song.notes.length : settings.total;

  const advance = () => {
    if (song) {
      const next = songIndex + 1;
      if (next >= song.notes.length) { setDone(true); playCheer(); return; }
      const np = midiToNaturalPitch(song.notes[next], song.clef);
      prevMidiRef.current = np.midi;
      setSongIndex(next);
      setPitch(np);
    } else {
      const np = randomPitch({
        clef: settings.clef,
        difficulty: settings.difficulty,
        withAccidentals: settings.withAccidentals,
        prevMidi: prevMidiRef.current,
      });
      prevMidiRef.current = np.midi;
      setPitch(np);
    }
    setFeedback(null);
    lockRef.current = false;
  };

  const handlePick = async (pitchClass: number) => {
    if (lockRef.current || done || showIntro) return;
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

  if (showIntro) {
    return (
      <OrientationIntro
        clef={settings.clef}
        onContinue={() => setShowIntro(false)}
      />
    );
  }

  if (done) {
    return (
      <Result
        score={score}
        attempts={attempts}
        errors={errors}
        title={song ? `${song.title} – geschafft!` : undefined}
        onAgain={() => {
          const restart = pickFirst(settings);
          setScore(0); setAttempts(0); setErrors(0); setDone(false);
          setSongIndex(restart.songIndex);
          setPitch(restart.pitch);
          prevMidiRef.current = restart.pitch.midi;
          setFeedback(null);
          lockRef.current = false;
        }}
        onExit={onExit}
      />
    );
  }

  const progressPct = total > 0 ? Math.min(100, (score / total) * 100) : 0;

  return (
    <div className="game" data-testid="game">
      <header className="game-header">
        <button className="link-btn" onClick={onExit} data-testid="exit-btn">← Zurück</button>
        <div className="game-title">
          {song ? `🎵 ${song.title}` : settings.clef === 'treble' ? 'Violinschlüssel' : 'Bassschlüssel'}
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
      <main className="staff-area">
        <NoteStaff
          clef={pitch.clef}
          vexKey={pitch.vexKey}
          accidental={pitch.accidental}
          feedback={feedback}
        />
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
