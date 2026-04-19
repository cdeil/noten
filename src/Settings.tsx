import { useState } from 'react';
import type { GameSettings, DisplayMode } from './Game';
import type { Clef, Difficulty } from './notes';
import type { InputMode } from './InputArea';

export function Settings({ onStart }: { onStart: (s: GameSettings) => void }) {
  const [gameType, setGameType] = useState<'practice' | 'song'>('practice');
  const [clef, setClef] = useState<Clef>('treble');
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [withAccidentals, setWithAccidentals] = useState(false);
  const [inputMode, setInputMode] = useState<InputMode>('both');
  const [displayMode, setDisplayMode] = useState<DisplayMode>('single');
  const [total, setTotal] = useState(30);

  // showOrientation default true; the user can toggle it at any time on the game screen.
  const showOrientation = true;

  const start = () => {
    if (gameType === 'song') {
      onStart({
        gameType, clef, difficulty, withAccidentals: true,
        inputMode, showOrientation, displayMode, total: 0,
      });
    } else {
      onStart({ gameType, clef, difficulty, withAccidentals, inputMode, showOrientation, displayMode, total });
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
            🎵 Lied erkennen
          </ChoiceButton>
        </div>
        {gameType === 'song' && (
          <p className="muted small" data-testid="song-info">
            Ein Lied wird zufällig ausgewählt — der Titel bleibt geheim, bis du fertig bist!
            Versuche, die Melodie beim Spielen zu erkennen.
          </p>
        )}
      </section>

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

      {gameType === 'practice' && (
        <>
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
        </>
      )}

      <section>
        <h2>Anzeige</h2>
        <div className="choice-row">
          <ChoiceButton testid="display-single" active={displayMode === 'single'} onClick={() => setDisplayMode('single')}>
            Einzelne Note
          </ChoiceButton>
          <ChoiceButton testid="display-sheet" active={displayMode === 'sheet'} onClick={() => setDisplayMode('sheet')}>
            Notenblatt (mehrere Noten)
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
