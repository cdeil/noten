import { useEffect, useMemo } from 'react';

interface Props {
  score: number;
  attempts: number;
  errors: number;
  onAgain: () => void;
  onExit: () => void;
}

export function Result({ score, attempts, errors, onAgain, onExit }: Props) {
  const accuracy = attempts > 0 ? Math.round(((attempts - errors) / attempts) * 100) : 0;
  const stars = accuracy >= 95 ? 3 : accuracy >= 80 ? 2 : 1;
  const message =
    stars === 3 ? 'Fantastisch! 🌟' : stars === 2 ? 'Super gemacht! 🎉' : 'Gut gemacht! 👍';

  const confetti = useMemo(
    () => Array.from({ length: 60 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 1.5,
      bg: ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#a855f7', '#ec4899'][i % 6],
      size: 6 + Math.random() * 8,
    })),
    [],
  );

  useEffect(() => {
    document.title = `Geschafft! ${score} Punkte – Notenlesen`;
    return () => { document.title = 'Notenlesen lernen'; };
  }, [score]);

  return (
    <div className="result" data-testid="result">
      <div className="confetti" aria-hidden="true">
        {confetti.map((c) => (
          <span
            key={c.id}
            style={{
              left: `${c.left}%`,
              animationDelay: `${c.delay}s`,
              backgroundColor: c.bg,
              width: c.size,
              height: c.size,
            }}
          />
        ))}
      </div>
      <h1>{message}</h1>
      <div className="stars" aria-label={`${stars} Sterne`}>
        {[1, 2, 3].map((s) => (
          <span key={s} className={s <= stars ? 'star on' : 'star'}>★</span>
        ))}
      </div>
      <div className="result-stats">
        <div><strong data-testid="result-score">{score}</strong> Punkte</div>
        <div>{accuracy}% Treffer</div>
        <div>{errors} Fehler</div>
      </div>
      <div className="result-actions">
        <button className="start-btn" onClick={onAgain} data-testid="again-btn">↻ Nochmal</button>
        <button className="link-btn" onClick={onExit} data-testid="result-exit-btn">Einstellungen</button>
      </div>
    </div>
  );
}
