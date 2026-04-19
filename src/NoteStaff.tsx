import { useEffect, useRef } from 'react';
import { Accidental, Annotation, AnnotationVerticalJustify, Formatter, Renderer, Stave, StaveNote } from 'vexflow';
import type { Clef } from './notes';

interface Props {
  clef: Clef;
  vexKey: string;
  accidental?: '#' | 'b';
  feedback?: 'correct' | 'wrong' | null;
  label?: string;        // optional German name printed under the note
  width?: number;
  height?: number;
}

export function NoteStaff({
  clef, vexKey, accidental, feedback, label,
  width = 360, height = 220,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    host.innerHTML = '';

    const renderer = new Renderer(host, Renderer.Backends.SVG);
    renderer.resize(width, height);
    const ctx = renderer.getContext();

    const stave = new Stave(20, 40, width - 40);
    stave.addClef(clef === 'treble' ? 'treble' : 'bass');
    stave.setContext(ctx).draw();

    const note = new StaveNote({ clef, keys: [vexKey], duration: 'w' });
    if (accidental) note.addModifier(new Accidental(accidental));
    if (feedback === 'correct') note.setStyle({ fillStyle: '#16a34a', strokeStyle: '#16a34a' });
    else if (feedback === 'wrong') note.setStyle({ fillStyle: '#dc2626', strokeStyle: '#dc2626' });
    if (label) {
      const ann = new Annotation(label).setVerticalJustification(AnnotationVerticalJustify.BOTTOM);
      // @ts-ignore — older VexFlow typings
      ann.setFont('sans-serif', 14, 'normal');
      note.addModifier(ann);
    }

    Formatter.FormatAndDraw(ctx, stave, [note]);
  }, [clef, vexKey, accidental, feedback, label, width, height]);

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
