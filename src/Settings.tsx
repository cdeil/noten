import { useState } from 'react';
import { ensureAudio } from './audio';
import { SONGS } from './songs';
import type { GameSettings, DisplayMode, LearningMode, SongChoiceMode } from './Game';
import type { PianoPlaybackMode } from './audio';
import type { Clef, Difficulty } from './notes';
import type { InputMode } from './InputArea';

export function Settings({ onStart }: { onStart: (s: GameSettings) => void }) {
  const [mode, setMode] = useState<LearningMode>('notes');
  const [clef, setClef] = useState<Clef>('treble');
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [withAccidentals, setWithAccidentals] = useState(false);
  const [inputMode, setInputMode] = useState<InputMode>('both');
  const [displayMode, setDisplayMode] = useState<DisplayMode>('single');
  const [total, setTotal] = useState(30);
  const [rhythmBpm, setRhythmBpm] = useState(84);
  const [songChoiceMode, setSongChoiceMode] = useState<SongChoiceMode>('random');
  const [songId, setSongId] = useState(SONGS[0].id);
  const [showSongText, setShowSongText] = useState(true);
  const [songPlaybackMode, setSongPlaybackMode] = useState<PianoPlaybackMode>('overlap');

  const start = () => {
    ensureAudio();

    if (mode === 'songs') {
      onStart({
        mode,
        clef: 'treble',
        difficulty: 'normal',
        withAccidentals: true,
        inputMode,
        showOrientation: true,
        displayMode: 'sheet',
        total: 0,
        songChoiceMode,
        songId,
        showSongText,
        songPlaybackMode,
      });
      return;
    }

    if (mode === 'rhythms') {
      onStart({
        mode,
        clef: 'treble',
        difficulty: 'normal',
        withAccidentals: false,
        inputMode: 'buttons',
        showOrientation: false,
        displayMode: 'sheet',
        total: 0,
        rhythmBpm,
      });
      return;
    }

    onStart({
      mode,
      clef,
      difficulty,
      withAccidentals,
      inputMode,
      showOrientation: true,
      displayMode,
      total,
    });
  };

  return (
    <div className="settings" data-testid="settings">
      <h1>🎼 Musik lernen</h1>

      <section>
        <h2>Bereich</h2>
        <div className="choice-row">
          <ChoiceButton testid="mode-notes" active={mode === 'notes'} onClick={() => setMode('notes')}>
            Noten lernen
          </ChoiceButton>
          <ChoiceButton testid="mode-rhythms" active={mode === 'rhythms'} onClick={() => setMode('rhythms')}>
            Rhythmen lernen
          </ChoiceButton>
          <ChoiceButton testid="mode-songs" active={mode === 'songs'} onClick={() => setMode('songs')}>
            Lieder spielen
          </ChoiceButton>
        </div>
      </section>

      {mode === 'notes' && (
        <>
          <section>
            <h2>Schlüssel</h2>
            <div className="choice-row">
              <ChoiceButton testid="clef-treble" active={clef === 'treble'} onClick={() => setClef('treble')}>
                Violinschlüssel
              </ChoiceButton>
              <ChoiceButton testid="clef-bass" active={clef === 'bass'} onClick={() => setClef('bass')}>
                Bassschlüssel
              </ChoiceButton>
            </div>
          </section>

          <section>
            <h2>Schwierigkeit</h2>
            <div className="choice-row">
              <ChoiceButton testid="diff-normal" active={difficulty === 'normal'} onClick={() => setDifficulty('normal')}>
                Normal
              </ChoiceButton>
              <ChoiceButton testid="diff-hard" active={difficulty === 'hard'} onClick={() => setDifficulty('hard')}>
                Hard mode
              </ChoiceButton>
            </div>
          </section>

          <section>
            <h2>Vorzeichen</h2>
            <div className="choice-row">
              <ChoiceButton testid="acc-off" active={!withAccidentals} onClick={() => setWithAccidentals(false)}>
                Nur Stammtöne
              </ChoiceButton>
              <ChoiceButton testid="acc-on" active={withAccidentals} onClick={() => setWithAccidentals(true)}>
                Mit ♯ und ♭
              </ChoiceButton>
            </div>
          </section>

          <section>
            <h2>Runde</h2>
            <div className="choice-row">
              {[10, 20, 30, 0].map((value) => (
                <ChoiceButton key={value} testid={`total-${value}`} active={total === value} onClick={() => setTotal(value)}>
                  {value === 0 ? '∞ Endlos' : `${value} Noten`}
                </ChoiceButton>
              ))}
            </div>
          </section>

          <section>
            <h2>Anzeige</h2>
            <div className="choice-row">
              <ChoiceButton testid="display-single" active={displayMode === 'single'} onClick={() => setDisplayMode('single')}>
                Einzelne Note
              </ChoiceButton>
              <ChoiceButton testid="display-sheet" active={displayMode === 'sheet'} onClick={() => setDisplayMode('sheet')}>
                Notenblatt
              </ChoiceButton>
            </div>
          </section>

          <section>
            <h2>Eingabe</h2>
            <div className="choice-row">
              <ChoiceButton testid="input-buttons" active={inputMode === 'buttons'} onClick={() => setInputMode('buttons')}>
                Nur Buttons
              </ChoiceButton>
              <ChoiceButton testid="input-piano" active={inputMode === 'piano'} onClick={() => setInputMode('piano')}>
                Nur Klavier
              </ChoiceButton>
              <ChoiceButton testid="input-both" active={inputMode === 'both'} onClick={() => setInputMode('both')}>
                Beides
              </ChoiceButton>
            </div>
          </section>
        </>
      )}

      {mode === 'rhythms' && (
        <>
          <section>
            <h2>Rhythmustraining</h2>
            <p className="muted small" data-testid="rhythm-info">
              Ein Takt zählt vor, danach spielst du einen zweitäktigen Drum-Groove mit einem großen Drum-Button mit.
            </p>
          </section>

          <section>
            <h2>Tempo</h2>
            <label className="slider-field" htmlFor="rhythm-bpm">
              <span data-testid="rhythm-bpm-value">{rhythmBpm} BPM</span>
              <input
                id="rhythm-bpm"
                data-testid="rhythm-bpm"
                type="range"
                min="50"
                max="140"
                step="2"
                value={rhythmBpm}
                onChange={(e) => setRhythmBpm(Number(e.target.value))}
              />
            </label>
          </section>
        </>
      )}

      {mode === 'songs' && (
        <>
          <section>
            <h2>Spielweise</h2>
            <div className="choice-row">
              <ChoiceButton testid="song-random" active={songChoiceMode === 'random'} onClick={() => setSongChoiceMode('random')}>
                Random guess
              </ChoiceButton>
              <ChoiceButton testid="song-selected" active={songChoiceMode === 'selected'} onClick={() => setSongChoiceMode('selected')}>
                Select song
              </ChoiceButton>
            </div>
            {songChoiceMode === 'random' ? (
              <p className="muted small" data-testid="song-info">
                Ein Lied wird zufällig gewählt. Der Titel bleibt verborgen, bis du fertig bist.
              </p>
            ) : (
              <label className="select-field" htmlFor="song-select">
                <span>Lied auswählen</span>
                <select id="song-select" data-testid="song-select" value={songId} onChange={(e) => setSongId(e.target.value)}>
                  {SONGS.map((song) => (
                    <option key={song.id} value={song.id}>
                      {song.title}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </section>

          <section>
            <h2>Hilfen</h2>
            <div className="choice-row">
              <ChoiceButton testid="song-text-on" active={showSongText} onClick={() => setShowSongText(true)}>
                Text unten anzeigen
              </ChoiceButton>
              <ChoiceButton testid="song-text-off" active={!showSongText} onClick={() => setShowSongText(false)}>
                Ohne Text
              </ChoiceButton>
            </div>
          </section>

          <section>
            <h2>Tonübergang</h2>
            <div className="choice-row">
              <ChoiceButton testid="song-playback-overlap" active={songPlaybackMode === 'overlap'} onClick={() => setSongPlaybackMode('overlap')}>
                Töne überlappen
              </ChoiceButton>
              <ChoiceButton testid="song-playback-replace" active={songPlaybackMode === 'replace'} onClick={() => setSongPlaybackMode('replace')}>
                Neuer Ton stoppt den alten
              </ChoiceButton>
            </div>
          </section>

          <section>
            <h2>Eingabe</h2>
            <div className="choice-row">
              <ChoiceButton testid="input-buttons" active={inputMode === 'buttons'} onClick={() => setInputMode('buttons')}>
                Nur Buttons
              </ChoiceButton>
              <ChoiceButton testid="input-piano" active={inputMode === 'piano'} onClick={() => setInputMode('piano')}>
                Nur Klavier
              </ChoiceButton>
              <ChoiceButton testid="input-both" active={inputMode === 'both'} onClick={() => setInputMode('both')}>
                Beides
              </ChoiceButton>
            </div>
          </section>
        </>
      )}

      <button className="start-btn" data-testid="start-btn" onClick={start}>
        Let&apos;s go
      </button>
    </div>
  );
}

function ChoiceButton({
  active,
  onClick,
  children,
  testid,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  testid: string;
}) {
  return (
    <button
      className={`choice ${active ? 'active' : ''}`}
      onClick={onClick}
      data-testid={testid}
      aria-pressed={active}
    >
      {children}
    </button>
  );
}
