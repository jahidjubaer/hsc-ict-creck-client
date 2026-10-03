import { Link } from 'react-router';

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center bg-base-100 p-6 text-center">
      <div>
        <p className="text-gradient text-8xl font-bold">৪০৪</p>
        <h1 className="mt-4 text-2xl font-semibold">পাতাটি খুঁজে পাওয়া যায়নি</h1>
        <Link to="/" className="btn btn-primary mt-6">
          হোমে ফিরে যাও
        </Link>
      </div>
    </div>
  );
}
