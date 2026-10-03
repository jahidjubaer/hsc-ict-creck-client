import { Headphones, Pause, Play, SkipBack, SkipForward, Square } from 'lucide-react';
import { toBn } from '@/lib/bn';

const RATES = [0.75, 1, 1.25, 1.5];

/**
 * Narration controls. With `audioUrl`, plays the recorded file instead of browser TTS.
 * Browser TTS is offered only when the device has a Bangla voice (e.g. Edge, Chrome on Android).
 */
export function AudioBar({ speech, audioUrl, minutes }) {
  if (audioUrl) {
    return (
      <div className="card-soft flex items-center gap-3 p-3">
        <Headphones className="size-5 shrink-0 text-primary" />
        <audio controls preload="none" src={audioUrl} className="h-10 w-full" />
      </div>
    );
  }

  // Without a Bangla voice the browser reads Bangla text with an English voice, which is useless — hide it.
  if (!speech.supported || !speech.voicesLoaded || !speech.hasBanglaVoice) return null;
  const playing = speech.state === 'playing';

  return (
    <div className="card-soft p-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={playing ? speech.pause : speech.play}
          className="btn btn-primary btn-circle"
          aria-label={playing ? 'থামাও' : 'শোনো'}
        >
          {playing ? <Pause className="size-5" /> : <Play className="size-5" />}
        </button>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-sm font-semibold">
            <Headphones className="size-4 text-primary" />
            {speech.state === 'idle' ? `অডিওতে শোনো${minutes ? ` (~${toBn(minutes)} মিনিট)` : ''}` : playing ? 'শুনছো…' : 'বিরতি'}
          </p>
          <progress className="progress progress-primary h-1.5 w-full" value={speech.progress * 100} max={100} />
        </div>
        {speech.state !== 'idle' && (
          <div className="flex items-center">
            <button type="button" className="btn btn-ghost btn-sm btn-square" onClick={() => speech.skip(-1)} aria-label="আগের অংশ">
              <SkipBack className="size-4" />
            </button>
            <button type="button" className="btn btn-ghost btn-sm btn-square" onClick={() => speech.skip(1)} aria-label="পরের অংশ">
              <SkipForward className="size-4" />
            </button>
            <button type="button" className="btn btn-ghost btn-sm btn-square" onClick={speech.stop} aria-label="বন্ধ করো">
              <Square className="size-4" />
            </button>
          </div>
        )}
        <select
          className="select select-sm w-20"
          value={speech.rate}
          onChange={(e) => speech.setRate(Number(e.target.value))}
          aria-label="গতি"
        >
          {RATES.map((r) => (
            <option key={r} value={r}>
              {toBn(r)}x
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
