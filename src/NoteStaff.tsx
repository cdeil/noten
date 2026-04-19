import { useEffect, useRef } from 'react';
import { Accidental, Formatter, Renderer, Stave, StaveNote } from 'vexflow';
import type { Clef } from './notes';

interface Props {
  clef: Clef;
  vexKey: string;
  accidental?: '#' | 'b';
  feedback?: 'correct' | 'wrong' | null;
}

export function NoteStaff({ clef, vexKey, accidental, feedback }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    host.innerHTML = '';

    const width = 360;
    const height = 240;
    const renderer = new Renderer(host, Renderer.Backends.SVG);
    renderer.resize(width, height);
    const ctx = renderer.getContext();

    const stave = new Stave(20, 50, width - 40);
    stave.addClef(clef === 'treble' ? 'treble' : 'bass');
    stave.setContext(ctx).draw();

    const note = new StaveNote({ clef, keys: [vexKey], duration: 'w' });
    if (accidental) note.addModifier(new Accidental(accidental));
    if (feedback === 'correct') note.setStyle({ fillStyle: '#16a34a', strokeStyle: '#16a34a' });
    else if (feedback === 'wrong') note.setStyle({ fillStyle: '#dc2626', strokeStyle: '#dc2626' });

    Formatter.FormatAndDraw(ctx, stave, [note]);
  }, [clef, vexKey, accidental, feedback]);

  return (
    <div
      className={`staff ${feedback ?? ''}`}
      ref={ref}
      data-testid="note-staff"
      data-clef={clef}
      data-vexkey={vexKey}
      data-accidental={accidental ?? ''}
    />
  );
}
