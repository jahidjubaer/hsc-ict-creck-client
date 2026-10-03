import { Link } from 'react-router';
import { useSeo } from '@/lib/seo';

/** Any address the app doesn't know (mistyped or old links): shown inside the app shell, open to visitors, kept out of search. */
export default function NotFound() {
  useSeo({ title: 'পাতাটি খুঁজে পাওয়া যায়নি', noindex: true });
  return (
    <div className="card-soft grid place-items-center p-12 text-center">
      <p className="text-gradient text-7xl font-bold">৪০৪</p>
      <h1 className="mt-4 text-2xl font-bold">পাতাটি খুঁজে পাওয়া যায়নি</h1>
      <p className="mt-2 max-w-sm text-base-content/60">ঠিকানাটি ভুল বা পুরোনো হতে পারে। নিচের যেকোনো জায়গা থেকে আবার শুরু করো।</p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Link to="/learn" className="btn btn-primary">
          পড়াশোনায় যাও
        </Link>
        <Link to="/" className="btn btn-ghost">
          হোম পেজ
        </Link>
      </div>
    </div>
  );
}
