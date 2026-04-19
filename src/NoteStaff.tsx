import { useEffect, useRef } from 'react';
import {
  Accidental,
  Formatter, Renderer, Stave, StaveNote, Voice,
} from 'vexflow';
import type { Pitch, Clef } from './notes';
import { germanShortName, midiToNaturalPitch } from './notes';

export interface OrientationRef {
  midi: number;
}

interface SingleProps {
  mode: 'single';
  clef: Clef;
  pitch: Pitch;
  feedback?: 'correct' | 'wrong' | null;
  references?: OrientationRef[];
  width?: number;
  height?: number;
  onRefClick?: (midi: number) => void;
}

interface SheetProps {
  mode: 'sheet';
  clef: Clef;
  pitches: Pitch[];        // window of practice notes
  currentIndex: number;
  feedback?: 'correct' | 'wrong' | null;
  references?: OrientationRef[];
  width?: number;
  height?: number;
  onRefClick?: (midi: number) => void;
}

type Props = SingleProps | SheetProps;

const REF_FILL = '#1d4ed8';      // blue for orientation tones
const PRACTICE_FILL = '#0f172a';
const PAST_FILL = '#94a3b8';

export function NoteStaff(props: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const width = props.width ?? 760;
  const height = props.height ?? 220;

  const refsKey = (props.references ?? []).map((r) => r.midi).join(',');
  const pitchesKey = props.mode === 'sheet'
    ? props.pitches.map((p) => p.vexKey + (p.accidental ?? '')).join('|')
    : props.pitch.vexKey + (props.pitch.accidental ?? '');
  const currentKey = props.mode === 'sheet' ? props.currentIndex : 0;

  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    host.innerHTML = '';

    const renderer = new Renderer(host, Renderer.Backends.SVG);
    renderer.resize(width, height);
    const ctx = renderer.getContext();

    const stave = new Stave(10, 30, width - 20);
    stave.addClef(props.clef === 'treble' ? 'treble' : 'bass');
    stave.setContext(ctx).draw();

    const refs = props.references ?? [];
    // Sort refs from low (high midi → bottom of staff is low pitch) ascending — VexFlow chord requires keys low→high.
    const refsSorted = [...refs].sort((a, b) => a.midi - b.midi);
    const refKeys = refsSorted.map((r) => midiToNaturalPitch(r.midi, props.clef).vexKey);
    const refChord = refsSorted.length > 0
      ? new StaveNote({ clef: props.clef, keys: refKeys, duration: 'q' })
      : null;
    if (refChord) {
      refChord.setStyle({ fillStyle: REF_FILL, strokeStyle: REF_FILL });
    }

    const practicePitches: Pitch[] = props.mode === 'sheet' ? props.pitches : [props.pitch];
    const currentIdx = props.mode === 'sheet' ? props.currentIndex : 0;

    const practiceNotes = practicePitches.map((p, i) => {
      const dur = props.mode === 'sheet' ? 'q' : 'w';
      const n = new StaveNote({ clef: props.clef, keys: [p.vexKey], duration: dur });
      if (p.accidental) n.addModifier(new Accidental(p.accidental));
      if (i === currentIdx) {
        const color = props.feedback === 'wrong' ? '#dc2626'
                    : props.feedback === 'correct' ? '#16a34a'
                    : '#0f172a';
        n.setStyle({ fillStyle: color, strokeStyle: color });
      } else if (i < currentIdx) {
        n.setStyle({ fillStyle: PAST_FILL, strokeStyle: PAST_FILL });
      } else {
        n.setStyle({ fillStyle: PRACTICE_FILL, strokeStyle: PRACTICE_FILL });
      }
      return n;
    });

    const allNotes = [...(refChord ? [refChord] : []), ...practiceNotes];
    const beats = allNotes.length || 1;
    const voice = new Voice({ num_beats: beats, beat_value: 4 }).setStrict(false);
    voice.addTickables(allNotes);
    new Formatter().joinVoices([voice]).format([voice], width - 80);
    voice.draw(ctx, stave);

    // Render German labels next to each ref note in the chord, plus invisible click overlays.
    if (refChord && refsSorted.length > 0) {
      const svg = host.querySelector('svg');
      if (svg) {
        // @ts-ignore VexFlow note exposes getAbsoluteX
        const x = refChord.getAbsoluteX();
        // @ts-ignore — getYs returns one Y per key in the chord
        const ys: number[] = refChord.getYs();
        refsSorted.forEach((r, i) => {
          const y = ys[i];
          const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          label.setAttribute('x', String(x + 18));
          label.setAttribute('y', String(y + 5));
          label.setAttribute('fill', REF_FILL);
          label.setAttribute('font-family', 'serif');
          label.setAttribute('font-size', '15');
          label.setAttribute('font-style', 'italic');
          label.setAttribute('data-testid', `ref-label-${r.midi}`);
          label.textContent = germanShortName(r.midi);
          svg.appendChild(label);

          if (props.onRefClick) {
            const overlay = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            overlay.setAttribute('x', String(x - 10));
            overlay.setAttribute('y', String(y - 10));
            overlay.setAttribute('width', '50');
            overlay.setAttribute('height', '20');
            overlay.setAttribute('fill', 'transparent');
            overlay.style.cursor = 'pointer';
            overlay.setAttribute('data-testid', `ref-overlay-${r.midi}`);
            overlay.addEventListener('pointerdown', (e) => {
              e.preventDefault();
              props.onRefClick!(r.midi);
            });
            svg.appendChild(overlay);
          }
        });
      }
    }
  }, [props.clef, refsKey, pitchesKey, currentKey, props.feedback, width, height, props.onRefClick]);

  const dataPitch = props.mode === 'sheet'
    ? props.pitches[props.currentIndex]
    : props.pitch;

  return (
    <div
      className={`staff ${props.mode === 'sheet' ? 'sheet' : ''} ${props.feedback ?? ''}`}
      ref={ref}
      data-testid="note-staff"
      data-clef={props.clef}
      data-vexkey={dataPitch?.vexKey ?? ''}
      data-accidental={dataPitch?.accidental ?? ''}
    />
  );
}
