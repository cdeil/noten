import { useEffect, useMemo, useRef, useState } from 'react';
import { NoteStaff, type OrientationRef } from './NoteStaff';
import { InputArea, type InputMode } from './InputArea';
import { Result } from './Result';
import {
  isCorrect,
  midiToSongPitch,
  randomPitch,
  type Clef,
  type Difficulty,
  type Pitch,
} from './notes';
import { ensureAudio, playCheer, playError, playMidi, type PianoPlaybackMode } from './audio';
import { SONGS, type NoteDuration, type Song } from './songs';
import { RhythmTrainer } from './RhythmTrainer';

export type DisplayMode = 'single' | 'sheet';
export type LearningMode = 'notes' | 'rhythms' | 'songs';
export type SongChoiceMode = 'selected' | 'random';

export interface GameSettings {
  mode: LearningMode;
  clef: Clef;
  difficulty: Difficulty;
  withAccidentals: boolean;
  inputMode: InputMode;
  showOrientation: boolean;
  displayMode: DisplayMode;
  total: number;
  songChoiceMode?: SongChoiceMode;
  songId?: string;
  showSongText?: boolean;
  songPlaybackMode?: PianoPlaybackMode;
  rhythmBpm?: number;
}

interface PracticeItem {
  pitch: Pitch;
  duration: NoteDuration;
}

const SHEET_WINDOW = 7;
const SHEET_LOOK_BACK = 2;
const PRACTICE_BUFFER = 16;

const REFERENCES: Record<Clef, OrientationRef[]> = {
  treble: [{ midi: 60 }, { midi: 67 }, { midi: 72 }, { midi: 79 }],
  bass: [{ midi: 41 }, { midi: 48 }, { midi: 53 }, { midi: 60 }],
};

function generatePractice(settings: GameSettings, prevMidi?: number, count = 1): PracticeItem[] {
  const out: PracticeItem[] = [];
  let prev = prevMidi;
  for (let i = 0; i < count; i++) {
    const pitch = randomPitch({
      clef: settings.clef,
      difficulty: settings.difficulty,
      withAccidentals: settings.withAccidentals,
      prevMidi: prev,
    });
    out.push({ pitch, duration: 'q' });
    prev = pitch.midi;
  }
  return out;
}

function buildSongItems(song: Song): PracticeItem[] {
  return song.notes.map((note) => ({
    pitch: midiToSongPitch(note.midi, song.clef),
    duration: note.duration,
  }));
}

function durationToPlaybackSeconds(duration: NoteDuration): number {
  switch (duration) {
    case 'w': return 1.4;
    case 'h': return 0.8;
    case 'q': return 0.42;
  }
}

export function Game({ settings, onExit }: { settings: GameSettings; onExit: () => void }) {
  if (settings.mode === 'rhythms') {
    return <RhythmTrainer bpm={settings.rhythmBpm ?? 84} onExit={onExit} />;
  }

  const song = useMemo<Song | null>(() => {
    if (settings.mode !== 'songs') return null;
    if (settings.songChoiceMode === 'selected' && settings.songId) {
      return SONGS.find((entry) => entry.id === settings.songId) ?? SONGS[0];
    }
    return SONGS[Math.floor(Math.random() * SONGS.length)];
  }, [settings.mode, settings.songChoiceMode, settings.songId]);

  const isSongMode = settings.mode === 'songs' && !!song;
  const effectiveClef: Clef = song ? song.clef : settings.clef;
  const songPlaybackMode: PianoPlaybackMode = settings.songPlaybackMode ?? 'overlap';

  const [items, setItems] = useState<PracticeItem[]>(() => {
    if (song) return buildSongItems(song);
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

  useEffect(() => {
    ensureAudio();
  }, []);

  const total = isSongMode ? items.length : settings.total;
  const currentItem = items[currentIndex];

  const resetRound = () => {
    if (song) setItems(buildSongItems(song));
    else {
      const fresh = settings.total > 0
        ? generatePractice(settings, undefined, settings.total)
        : generatePractice(settings, undefined, PRACTICE_BUFFER);
      setItems(fresh);
    }
    setScore(0);
    setAttempts(0);
    setErrors(0);
    setDone(false);
    setCurrentIndex(0);
    setFeedback(null);
    lockRef.current = false;
  };

  const advance = () => {
    setFeedback(null);
    lockRef.current = false;
    setCurrentIndex((index) => {
      const next = index + 1;
      if (song) {
        if (next >= items.length) {
          setDone(true);
          playCheer();
          return index;
        }
        return next;
      }
      if (total > 0) return next;
      if (next >= items.length - 4) {
        setItems((previous) => [
          ...previous,
          ...generatePractice(settings, previous[previous.length - 1].pitch.midi, PRACTICE_BUFFER),
        ]);
      }
      return next;
    });
  };

  const finishIfNeeded = (newScore: number) => {
    if (!song && total > 0 && newScore >= total) {
      window.setTimeout(() => {
        setDone(true);
        playCheer();
      }, 600);
      return true;
    }
    return false;
  };

  const handlePick = (pitchClass: number) => {
    if (!currentItem || lockRef.current || done) return;
    ensureAudio();
    setAttempts((value) => value + 1);
    if (isCorrect(currentItem.pitch, pitchClass)) {
      lockRef.current = true;
      playMidi(
        currentItem.pitch.midi,
        isSongMode ? durationToPlaybackSeconds(currentItem.duration) : 0.7,
        isSongMode ? songPlaybackMode : 'overlap',
      );

      if (isSongMode) {
        setScore((value) => value + 1);
        setFeedback(null);
        if (currentIndex >= items.length - 1) {
          window.setTimeout(() => {
            setDone(true);
            playCheer();
            lockRef.current = false;
          }, 0);
          return;
        }
        setCurrentIndex((index) => index + 1);
        window.requestAnimationFrame(() => {
          lockRef.current = false;
        });
        return;
      }

      setFeedback('correct');
      const newScore = score + 1;
      setScore(newScore);
      if (finishIfNeeded(newScore)) return;
      window.setTimeout(advance, 650);
    } else {
      playError();
      setErrors((value) => value + 1);
      setFeedback('wrong');
      window.setTimeout(() => setFeedback(null), 350);
    }
  };

  if (done) {
    const resultTitle = song
      ? settings.songChoiceMode === 'random'
        ? `🎵 Das war: „${song.title}”`
        : `🎵 Gespielt: „${song.title}”`
      : undefined;

    return (
      <Result
        score={score}
        attempts={attempts}
        errors={errors}
        title={resultTitle}
        onAgain={resetRound}
        onExit={onExit}
      />
    );
  }

  const progressPct = total > 0 ? Math.min(100, (score / total) * 100) : 0;
  const refs = showOrient ? REFERENCES[effectiveClef] : undefined;
  const windowStart = Math.max(0, currentIndex - SHEET_LOOK_BACK);
  const windowEnd = Math.min(items.length, windowStart + SHEET_WINDOW);
  const windowItems = items.slice(windowStart, windowEnd);
  const windowCurrent = currentIndex - windowStart;

  const title = isSongMode
    ? settings.songChoiceMode === 'random'
      ? '🎵 Random guess'
      : `🎵 ${song.title}`
    : effectiveClef === 'treble'
      ? 'Violinschlüssel'
      : 'Bassschlüssel';

  return (
    <div
      className="game"
      data-testid="game"
      data-display={settings.displayMode}
      data-mode={settings.mode}
      data-song-playback={isSongMode ? songPlaybackMode : undefined}
    >
      <header className="game-header">
        <button className="link-btn" onClick={onExit} data-testid="exit-btn">← Zurück</button>
        <div className="game-title">
          {title}
          {settings.difficulty === 'hard' && settings.mode === 'notes' && <span className="badge">Hard mode</span>}
        </div>
        <div className="header-right">
          <button
            className={`toggle-btn ${showOrient ? 'on' : ''}`}
            onClick={() => setShowOrient((value) => !value)}
            data-testid="orient-toggle"
            aria-pressed={showOrient}
            aria-label="Orientierungstöne ein/aus"
            title="Orientierungstöne ein/aus"
          >
            🎯
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

      <div className="hint" data-testid="hint" data-active={feedback === 'wrong' ? 'true' : 'false'}>
        {feedback === 'wrong' ? 'Versuch es noch einmal!' : ''}
      </div>

      <main className="staff-area">
        {settings.displayMode === 'sheet' ? (
          <NoteStaff
            mode="sheet"
            clef={effectiveClef}
            pitches={windowItems.map((item) => item.pitch)}
            durations={windowItems.map((item) => item.duration)}
            currentIndex={windowCurrent}
            feedback={feedback}
            references={refs}
            onRefClick={(midi) => playMidi(midi)}
            width={860}
            height={240}
          />
        ) : (
          <NoteStaff
            mode="single"
            clef={effectiveClef}
            pitch={currentItem.pitch}
            duration={currentItem.duration}
            feedback={feedback}
            references={refs}
            onRefClick={(midi) => playMidi(midi)}
            width={refs ? 420 : 300}
            height={240}
          />
        )}
      </main>

      {isSongMode && settings.songChoiceMode === 'selected' && settings.showSongText && song.text && (
        <div className="song-text" data-testid="song-text">
          {song.text}
        </div>
      )}

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
