import { useEffect, useRef } from 'react';
import { Accidental, Formatter, Renderer, Stave, StaveNote, Voice } from 'vexflow';
import type { Pitch, Clef } from './notes';

interface Props {
  clef: Clef;
  pitches: Pitch[];      // window of notes to display
  currentIndex: number;  // index within pitches that is the "active" note
  feedback?: 'correct' | 'wrong' | null;
  width?: number;
  height?: number;
}

// Renders multiple notes on a single stave with the active note highlighted in red.
// Past notes are dimmed; upcoming notes are black. Used in "Notenblatt" display mode.
export function SheetMusicStaff({
  clef, pitches, currentIndex, feedback,
  width = 760, height = 220,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    host.innerHTML = '';
    if (pitches.length === 0) return;

    const renderer = new Renderer(host, Renderer.Backends.SVG);
    renderer.resize(width, height);
    const ctx = renderer.getContext();

    const stave = new Stave(10, 40, width - 20);
    stave.addClef(clef === 'treble' ? 'treble' : 'bass');
    stave.setContext(ctx).draw();

    const staveNotes = pitches.map((p, i) => {
      const n = new StaveNote({ clef, keys: [p.vexKey], duration: 'q' });
      if (p.accidental) n.addModifier(new Accidental(p.accidental));
      if (i === currentIndex) {
        const color = feedback === 'wrong' ? '#dc2626'
                    : feedback === 'correct' ? '#16a34a'
                    : '#1d4ed8';
        n.setStyle({ fillStyle: color, strokeStyle: color });
      } else if (i < currentIndex) {
        n.setStyle({ fillStyle: '#94a3b8', strokeStyle: '#94a3b8' });
      } else {
        n.setStyle({ fillStyle: '#0f172a', strokeStyle: '#0f172a' });
      }
      return n;
    });

    const voice = new Voice({ num_beats: pitches.length, beat_value: 4 }).setStrict(false);
    voice.addTickables(staveNotes);
    new Formatter().joinVoices([voice]).format([voice], width - 80);
    voice.draw(ctx, stave);
  }, [clef, pitches, currentIndex, feedback, width, height]);

  return (
    <div
      className={`staff sheet ${feedback ?? ''}`}
      ref={ref}
      data-testid="note-staff"
      data-clef={clef}
      data-vexkey={pitches[currentIndex]?.vexKey ?? ''}
      data-accidental={pitches[currentIndex]?.accidental ?? ''}
    />
  );
}
