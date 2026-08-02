import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-slate-50 px-4 dark:bg-[#0d0d0d]">
      <div className="text-center">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800">
          <Compass size={26} />
        </div>
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-50">404</h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">This page could not be found.</p>
        <Link to="/" className="mt-5 inline-flex h-10 items-center rounded-lg bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700">
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
