import { useState } from 'react';
import type { GameSettings } from './Game';
import type { Clef, Difficulty } from './notes';
import type { InputMode } from './InputArea';
import { SONGS } from './songs';

export function Settings({ onStart }: { onStart: (s: GameSettings) => void }) {
  const [gameType, setGameType] = useState<'practice' | 'song'>('practice');
  const [clef, setClef] = useState<Clef>('treble');
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [withAccidentals, setWithAccidentals] = useState(false);
  const [inputMode, setInputMode] = useState<InputMode>('both');
  const [showOrientation, setShowOrientation] = useState(false);
  const [total, setTotal] = useState(30);
  const [songId, setSongId] = useState<string>(SONGS[0].id);

  const start = () => {
    if (gameType === 'song') {
      const song = SONGS.find((s) => s.id === songId)!;
      onStart({
        gameType, clef: song.clef, difficulty, withAccidentals: false,
        inputMode, showOrientation: false, total: song.notes.length, songId,
      });
    } else {
      onStart({ gameType, clef, difficulty, withAccidentals, inputMode, showOrientation, total });
    }
  };

  return (
    <div className="settings" data-testid="settings">
      <h1>🎼 Notenlesen lernen</h1>

      <section>
        <h2>Spielmodus</h2>
        <div className="choice-row">
          <ChoiceButton testid="game-practice" active={gameType === 'practice'} onClick={() => setGameType('practice')}>
            🎯 Üben
          </ChoiceButton>
          <ChoiceButton testid="game-song" active={gameType === 'song'} onClick={() => setGameType('song')}>
            🎵 Lied spielen
          </ChoiceButton>
        </div>
      </section>

      {gameType === 'practice' && (
        <>
          <section>
            <h2>Schlüssel</h2>
            <div className="choice-row">
              <ChoiceButton testid="mode-treble" active={clef === 'treble'} onClick={() => setClef('treble')}>
                Violinschlüssel
              </ChoiceButton>
              <ChoiceButton testid="mode-bass" active={clef === 'bass'} onClick={() => setClef('bass')}>
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
                Schwer (Hilfslinien & Sprünge)
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
              {[10, 20, 30, 0].map((n) => (
                <ChoiceButton key={n} testid={`total-${n}`} active={total === n} onClick={() => setTotal(n)}>
                  {n === 0 ? '∞ Endlos' : `${n} Noten`}
                </ChoiceButton>
              ))}
            </div>
          </section>

          <section>
            <h2>Orientierungstöne</h2>
            <div className="choice-row">
              <ChoiceButton testid="orient-off" active={!showOrientation} onClick={() => setShowOrientation(false)}>
                Aus
              </ChoiceButton>
              <ChoiceButton testid="orient-on" active={showOrientation} onClick={() => setShowOrientation(true)}>
                Vor dem Spiel zeigen
              </ChoiceButton>
            </div>
          </section>
        </>
      )}

      {gameType === 'song' && (
        <section>
          <h2>Lied auswählen</h2>
          <div className="song-grid" data-testid="song-grid">
            {SONGS.map((s) => (
              <button
                key={s.id}
                className={`song-card ${songId === s.id ? 'active' : ''}`}
                onClick={() => setSongId(s.id)}
                data-testid={`song-${s.id}`}
              >
                <div className="song-emoji">🎵</div>
                <div className="song-title">{s.title}</div>
                <div className="song-meta">{s.notes.length} Noten</div>
              </button>
            ))}
          </div>
        </section>
      )}

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

      <button className="start-btn" data-testid="start-btn" onClick={start}>
        ▶ Los geht&apos;s!
      </button>
    </div>
  );
}

function ChoiceButton({
  active, onClick, children, testid,
}: { active: boolean; onClick: () => void; children: React.ReactNode; testid: string }) {
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
