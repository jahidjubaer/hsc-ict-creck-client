import { useCallback, useEffect, useRef, useState } from 'react';

const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;

function pickBanglaVoice() {
  const voices = synth?.getVoices() ?? [];
  // Only real Bangla voices qualify; the name bonus just prefers the better-sounding ones among them.
  const bangla = voices.filter((v) => /^bn\b/i.test(v.lang || ''));
  const score = (v) => (/^bn[-_]BD/i.test(v.lang) ? 4 : /^bn[-_]IN/i.test(v.lang) ? 3 : 2) + (/natural|online|google/i.test(v.name) ? 1 : 0);
  return bangla.sort((a, b) => score(b) - score(a))[0] ?? null;
}

/**
 * Browser text-to-speech over a list of chunks [{block, text}].
 * Returns playback state + controls. `index` is the chunk being spoken.
 */
export function useSpeech(chunks) {
  const supported = Boolean(synth);
  const [voice, setVoice] = useState(null);
  const [voicesLoaded, setVoicesLoaded] = useState(false);
  const [state, setState] = useState('idle'); // idle | playing | paused
  const [index, setIndex] = useState(0);
  const [rate, setRate] = useState(1);
  const runId = useRef(0); // invalidates callbacks of cancelled utterances

  useEffect(() => {
    if (!supported) return undefined;
    const load = () => {
      setVoice(pickBanglaVoice());
      setVoicesLoaded(true);
    };
    load();
    synth.addEventListener('voiceschanged', load);
    return () => synth.removeEventListener('voiceschanged', load);
  }, [supported]);

  const speakFrom = useCallback(
    (start) => {
      if (!supported || !chunks.length) return;
      synth.cancel();
      const id = ++runId.current;
      const speak = (i) => {
        if (id !== runId.current) return;
        if (i >= chunks.length) {
          setState('idle');
          setIndex(0);
          return;
        }
        setIndex(i);
        const u = new SpeechSynthesisUtterance(chunks[i].text);
        u.lang = voice?.lang || 'bn-BD';
        if (voice) u.voice = voice;
        u.rate = rate;
        u.onend = () => speak(i + 1);
        u.onerror = (e) => {
          if (e.error !== 'interrupted' && e.error !== 'canceled') speak(i + 1);
        };
        synth.speak(u);
      };
      setState('playing');
      speak(Math.max(0, Math.min(start, chunks.length - 1)));
    },
    [chunks, voice, rate, supported]
  );

  const play = () => {
    if (state === 'paused') {
      synth.resume();
      setState('playing');
    } else speakFrom(index);
  };
  const pause = () => {
    synth.pause();
    setState('paused');
  };
  const stop = useCallback(() => {
    runId.current++;
    synth?.cancel();
    setState('idle');
    setIndex(0);
  }, []);
  const skip = (delta) => speakFrom(index + delta);

  // Restart current chunk when speed changes mid-playback.
  const changeRate = (r) => {
    setRate(r);
    if (state === 'playing') setTimeout(() => speakFrom(index), 0);
  };

  useEffect(() => stop, [stop]); // stop speaking when leaving the page

  return {
    supported,
    hasBanglaVoice: Boolean(voice),
    voicesLoaded,
    state,
    index,
    activeBlock: state === 'idle' ? -1 : chunks[index]?.block ?? -1,
    progress: chunks.length ? (index + (state === 'idle' ? 0 : 1)) / chunks.length : 0,
    rate,
    play,
    pause,
    stop,
    skip,
    setRate: changeRate,
  };
}
