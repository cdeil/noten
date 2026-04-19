import { useEffect, useRef } from 'react';
import {
  Accidental,
  Formatter,
  Renderer,
  Stave,
  StaveNote,
  Voice,
} from 'vexflow';
import type { Pitch, Clef } from './notes';
import { germanShortName } from './notes';
import type { NoteDuration } from './songs';

export interface OrientationRef {
  midi: number;
}

export type NoteState = 'idle' | 'current' | 'perfect' | 'good' | 'miss' | 'past';

interface BaseProps {
  clef: Clef;
  feedback?: 'correct' | 'wrong' | null;
  references?: OrientationRef[];
  width?: number;
  height?: number;
  onRefClick?: (midi: number) => void;
  noteStates?: NoteState[];
  rests?: boolean[];
  measureBreakIndices?: number[];
  markerIndex?: number | null;
  activeIndex?: number | null;
}

interface SingleProps extends BaseProps {
  mode: 'single';
  pitch: Pitch;
  duration?: NoteDuration;
}

interface SheetProps extends BaseProps {
  mode: 'sheet';
  pitches: Pitch[];
  durations?: NoteDuration[];
  currentIndex: number;
}

type Props = SingleProps | SheetProps;

const REF_FILL = '#94a3b8';
const PRACTICE_FILL = '#0f172a';
const PAST_FILL = '#94a3b8';
const PERFECT_FILL = '#16a34a';
const GOOD_FILL = '#f59e0b';
const MISS_FILL = '#dc2626';
const CURRENT_FILL = '#2563eb';
const REF_NOTE_RX = 6.1;
const REF_NOTE_RY = 4.55;

function durationToBeats(duration: NoteDuration): number {
  switch (duration) {
    case 'w': return 4;
    case 'h': return 2;
    case 'q': return 1;
  }
}

function getAbsoluteX(note: InstanceType<typeof StaveNote>): number {
  return note.getAbsoluteX();
}

function midiToDiatonicStep(midi: number): number {
  const pitchClass = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  const stepByPc: Record<number, number> = {
    0: 0,
    2: 1,
    4: 2,
    5: 3,
    7: 4,
    9: 5,
    11: 6,
  };
  return octave * 7 + (stepByPc[pitchClass] ?? 0);
}

function getHelperLine(midi: number, clef: Clef): number {
  const topLineMidi = clef === 'treble' ? 77 : 57;
  return (midiToDiatonicStep(topLineMidi) - midiToDiatonicStep(midi)) / 2;
}

function getStateColors(state: NoteState | undefined, feedback?: 'correct' | 'wrong' | null) {
  if (state === 'perfect') return { fillStyle: PERFECT_FILL, strokeStyle: PERFECT_FILL };
  if (state === 'good') return { fillStyle: GOOD_FILL, strokeStyle: GOOD_FILL };
  if (state === 'miss') return { fillStyle: MISS_FILL, strokeStyle: MISS_FILL };
  if (state === 'past') return { fillStyle: PAST_FILL, strokeStyle: PAST_FILL };
  if (state === 'current') {
    const color = feedback === 'wrong'
      ? MISS_FILL
      : feedback === 'correct'
        ? PERFECT_FILL
        : CURRENT_FILL;
    return { fillStyle: color, strokeStyle: color };
  }
  return { fillStyle: PRACTICE_FILL, strokeStyle: PRACTICE_FILL };
}

export function NoteStaff(props: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const width = props.width ?? 760;
  const height = props.height ?? 220;

  const refsKey = (props.references ?? []).map((r) => r.midi).join(',');
  const pitchesKey = props.mode === 'sheet'
    ? props.pitches.map((p) => p.vexKey + (p.accidental ?? '')).join('|')
    : props.pitch.vexKey + (props.pitch.accidental ?? '');
  const durationsKey = props.mode === 'sheet'
    ? (props.durations ?? []).join('|')
    : props.duration ?? 'w';
  const noteStatesKey = (props.noteStates ?? []).join('|');
  const restsKey = (props.rests ?? []).map((value) => String(value)).join('|');
  const measureBreaksKey = (props.measureBreakIndices ?? []).join('|');
  const markerKey = props.markerIndex ?? -1;
  const activeKey = props.activeIndex ?? -1;

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
    const practicePitches = props.mode === 'sheet' ? props.pitches : [props.pitch];
    const practiceDurations = props.mode === 'sheet'
      ? props.durations ?? practicePitches.map(() => 'q' as const)
      : [props.duration ?? 'w'];
    const currentIdx = props.mode === 'sheet' ? props.currentIndex : 0;
    const rests = props.rests ?? practicePitches.map(() => false);
    const noteStates = props.noteStates ?? practicePitches.map((_, index) => (
      index < currentIdx ? 'past' : index === currentIdx ? 'current' : 'idle'
    ));

    const refSpacer = refs.length > 0
      ? new StaveNote({ clef: props.clef, keys: ['b/4'], duration: 'w' }).setStyle({
        fillStyle: 'transparent',
        strokeStyle: 'transparent',
      })
      : null;

    const practiceNotes = practicePitches.map((pitch, index) => {
      const duration = practiceDurations[index] ?? 'q';
      const isRest = rests[index] ?? false;
      const note = new StaveNote({
        clef: props.clef,
        keys: [isRest ? 'b/4' : pitch.vexKey],
        duration: isRest ? `${duration}r` : duration,
      });
      if (!isRest && pitch.accidental) note.addModifier(new Accidental(pitch.accidental));
      note.setStyle(getStateColors(noteStates[index], props.feedback));
      return note;
    });

    const allNotes = refSpacer ? [refSpacer, ...practiceNotes] : practiceNotes;
    if (allNotes.length === 0) return;

    const totalBeats = [
      ...(refSpacer ? [4] : []),
      ...practiceDurations.map(durationToBeats),
    ].reduce((sum, beats) => sum + beats, 0);

    const formatWidth = props.mode === 'sheet'
      ? Math.max(240, width - 80)
      : Math.min(width - 80, refs.length > 0 ? 120 : 160);

    const voice = new Voice({ num_beats: totalBeats, beat_value: 4 }).setStrict(false);
    voice.addTickables(allNotes);
    new Formatter().joinVoices([voice]).format([voice], formatWidth);
    voice.draw(ctx, stave);

    const svg = host.querySelector('svg');
    if (!svg) return;

    if (refs.length > 0 && refSpacer) {
      const anchorX = getAbsoluteX(refSpacer) + 4;
      svg.querySelectorAll('g.vf-stavenote[fill="transparent"][stroke="transparent"]').forEach((node) => {
        node.remove();
      });

      refs.forEach((reference) => {
        const helperLine = getHelperLine(reference.midi, props.clef);
        const y = stave.getYForLine(helperLine);

        const outer = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        outer.setAttribute('cx', String(anchorX));
        outer.setAttribute('cy', String(y));
        outer.setAttribute('rx', String(REF_NOTE_RX));
        outer.setAttribute('ry', String(REF_NOTE_RY));
        outer.setAttribute('fill', REF_FILL);
        outer.setAttribute('transform', `rotate(-18 ${anchorX} ${y})`);
        outer.setAttribute('stroke', 'none');
        outer.setAttribute('data-testid', `ref-head-${reference.midi}`);
        svg.appendChild(outer);

        if (helperLine < 0) {
          const ledgerCount = Math.floor(-helperLine);
          for (let line = -1; line >= -ledgerCount; line -= 1) {
            const ledger = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            ledger.setAttribute('x1', String(anchorX - 16));
            ledger.setAttribute('x2', String(anchorX + 16));
            ledger.setAttribute('y1', String(stave.getYForLine(line)));
            ledger.setAttribute('y2', String(stave.getYForLine(line)));
            ledger.setAttribute('stroke', '#475569');
            ledger.setAttribute('stroke-width', '2');
            ledger.setAttribute('data-testid', `ref-ledger-${reference.midi}-${Math.abs(line)}`);
            svg.appendChild(ledger);
          }
        } else if (helperLine > 4) {
          const ledgerCount = Math.floor(helperLine - 4);
          for (let line = 5; line <= 4 + ledgerCount; line += 1) {
            const ledger = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            ledger.setAttribute('x1', String(anchorX - 16));
            ledger.setAttribute('x2', String(anchorX + 16));
            ledger.setAttribute('y1', String(stave.getYForLine(line)));
            ledger.setAttribute('y2', String(stave.getYForLine(line)));
            ledger.setAttribute('stroke', '#475569');
            ledger.setAttribute('stroke-width', '2');
            ledger.setAttribute('data-testid', `ref-ledger-${reference.midi}-${line}`);
            svg.appendChild(ledger);
          }
        }

        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', String(anchorX + 14));
        label.setAttribute('y', String(y + 5));
        label.setAttribute('fill', REF_FILL);
        label.setAttribute('font-family', 'serif');
        label.setAttribute('font-size', '14');
        label.setAttribute('font-style', 'italic');
        label.setAttribute('data-testid', `ref-label-${reference.midi}`);
        label.textContent = germanShortName(reference.midi);
        svg.appendChild(label);

        if (props.onRefClick) {
          const hit = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          hit.setAttribute('x', String(anchorX - 14));
          hit.setAttribute('y', String(y - 12));
          hit.setAttribute('width', '36');
          hit.setAttribute('height', '24');
          hit.setAttribute('fill', 'transparent');
          hit.setAttribute('stroke', 'none');
          hit.setAttribute('data-testid', `ref-hit-${reference.midi}`);
          hit.style.cursor = 'pointer';
          hit.addEventListener('pointerdown', (event) => {
            event.preventDefault();
            props.onRefClick?.(reference.midi);
          });
          svg.appendChild(hit);
        }
      });
    }

    (props.measureBreakIndices ?? []).forEach((index) => {
      const target = practiceNotes[index];
      if (!target) return;
      const x = getAbsoluteX(target) - 18;
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', String(x));
      line.setAttribute('x2', String(x));
      line.setAttribute('y1', String(stave.getYForLine(0)));
      line.setAttribute('y2', String(stave.getYForLine(4)));
      line.setAttribute('stroke', '#64748b');
      line.setAttribute('stroke-width', '1.5');
      line.setAttribute('data-testid', `measure-break-${index}`);
      svg.appendChild(line);
    });

    if (props.markerIndex !== null && props.markerIndex !== undefined) {
      const markerTarget = practiceNotes[props.markerIndex];
      if (markerTarget) {
        const x = getAbsoluteX(markerTarget) + 6;
        const y = stave.getYForLine(4) + 26;
        const marker = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        marker.setAttribute('d', `M ${x - 10} ${y} L ${x + 10} ${y} L ${x} ${y - 14} Z`);
        marker.setAttribute('fill', '#f59e0b');
        marker.setAttribute('stroke', 'none');
        marker.setAttribute('data-testid', 'rhythm-marker');
        svg.appendChild(marker);
      }
    }
  }, [
    props.clef,
    refsKey,
    pitchesKey,
    durationsKey,
    noteStatesKey,
    restsKey,
      measureBreaksKey,
      markerKey,
      activeKey,
      props.feedback,
      width,
      height,
      props.onRefClick,
  ]);

  const dataPitch = props.mode === 'sheet'
    ? props.pitches[props.currentIndex]
    : props.pitch;
  const dataDuration = props.mode === 'sheet'
    ? props.durations?.[props.currentIndex] ?? 'q'
    : props.duration ?? 'w';

  return (
    <div
      className={`staff ${props.mode === 'sheet' ? 'sheet' : ''} ${props.feedback ?? ''}`}
      ref={ref}
      data-testid="note-staff"
      data-clef={props.clef}
      data-vexkey={dataPitch?.vexKey ?? ''}
      data-accidental={dataPitch?.accidental ?? ''}
      data-duration={dataDuration}
      data-note-states={(props.noteStates ?? []).join(',')}
      data-marker-index={props.markerIndex ?? ''}
      data-active-note-index={props.activeIndex ?? ''}
    />
  );
}
