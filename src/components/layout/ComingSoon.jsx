import { Link } from 'react-router';
import { Construction } from 'lucide-react';

export default function ComingSoon() {
  return (
    <div className="card-soft grid place-items-center p-12 text-center">
      <Construction className="size-12 text-warning" />
      <h1 className="mt-4 text-2xl font-bold">শীঘ্রই আসছে</h1>
      <p className="mt-2 max-w-sm text-base-content/60">এই ফিচারটি এখন তৈরি হচ্ছে। ততক্ষণ পড়াশোনা চালিয়ে যাও!</p>
      <Link to="/learn" className="btn btn-primary mt-6">
        পড়াশোনায় যাও
      </Link>
    </div>
  );
}
