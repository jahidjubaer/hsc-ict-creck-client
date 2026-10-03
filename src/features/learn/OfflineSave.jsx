import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { CheckCircle2, CloudDownload } from 'lucide-react';
import { api } from '@/lib/api';
import { toBn } from '@/lib/bn';
import { cachedTopicSlugs, saveChapterOffline } from '@/lib/offline';

/** Downloads every readable topic of the chapter into the offline cache (works only once the service worker is active). */
export function OfflineSave({ chapterSlug, topics }) {
  const readable = topics.filter((t) => t.published && !t.locked);
  const [saved, setSaved] = useState(null);
  const [progress, setProgress] = useState(null);
  const active = typeof navigator !== 'undefined' && !!navigator.serviceWorker?.controller;

  useEffect(() => {
    if (active) cachedTopicSlugs(chapterSlug).then(setSaved);
  }, [active, chapterSlug]);

  if (!active || !readable.length || !saved) return null;
  const savedCount = readable.filter((t) => saved.has(t.slug)).length;
  const all = savedCount === readable.length;

  const save = async () => {
    setProgress(0);
    const { failed } = await saveChapterOffline((slug) => api.get(`/chapters/${chapterSlug}/topics/${slug}`), readable, (n) => setProgress(n));
    setProgress(null);
    setSaved(await cachedTopicSlugs(chapterSlug));
    if (failed) toast.error(`${toBn(failed)}টি টপিক সেভ হয়নি — ইন্টারনেট দেখে আবার চেষ্টা করো`);
    else toast.success('পুরো অধ্যায় অফলাইনে পড়ার জন্য সেভ হয়েছে');
  };

  return (
    <div className="card-soft p-5">
      <h2 className="flex items-center gap-2 font-bold">
        <CloudDownload className="size-5 text-primary" /> অফলাইনে পড়ো
      </h2>
      <p className="mt-2 text-sm text-base-content/70">
        {all ? (
          <span className="flex items-center gap-1 text-success">
            <CheckCircle2 className="size-4" /> সব টপিক সেভ করা আছে — ইন্টারনেট ছাড়াও পড়তে পারবে।
          </span>
        ) : (
          `ইন্টারনেট ছাড়া পড়তে অধ্যায়টি সেভ করে রাখো (${toBn(savedCount)}/${toBn(readable.length)} সেভ করা)।`
        )}
      </p>
      {progress !== null ? (
        <progress className="progress progress-primary mt-3 w-full" value={progress} max={readable.length} />
      ) : (
        <button type="button" className="btn btn-outline btn-sm mt-3 w-full" onClick={save}>
          <CloudDownload className="size-4" /> {all ? 'আবার সেভ করো (আপডেট)' : 'অধ্যায়টি সেভ করো'}
        </button>
      )}
    </div>
  );
}
