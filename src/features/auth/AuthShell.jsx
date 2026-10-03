import { Flame, Headphones, ListChecks } from 'lucide-react';

/** Two-column auth layout: form on the left, motivation panel on the right. */
export function AuthShell({ title, subtitle, children }) {
  return (
    <div className="mx-auto grid min-h-[calc(100dvh-4rem)] max-w-6xl items-center gap-10 px-4 py-10 lg:grid-cols-2">
      <div className="card-soft mx-auto w-full max-w-md p-6 shadow-xl sm:p-8">
        <h1 className="text-2xl font-bold">{title}</h1>
        {subtitle && <p className="mt-1 text-base-content/60">{subtitle}</p>}
        <div className="mt-6">{children}</div>
      </div>
      <div className="hidden rounded-[2rem] bg-gradient-to-br from-primary to-secondary p-10 text-primary-content lg:block">
        <h2 className="text-3xl leading-snug font-bold">প্রতিদিন একটু একটু করে, ICT-তে A+</h2>
        <ul className="mt-8 space-y-5">
          {[
            [Headphones, 'প্রতিটি টপিক পড়ো অথবা শোনো'],
            [ListChecks, 'টপিক শেষে সাথে সাথে কুইজ'],
            [Flame, 'স্ট্রিক ধরে রাখো, ব্যাজ জেতো'],
          ].map(([Icon, text]) => (
            <li key={text} className="flex items-center gap-3 text-lg">
              <span className="grid size-10 place-items-center rounded-xl bg-white/20">
                <Icon className="size-5" />
              </span>
              {text}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function FieldError({ error }) {
  if (!error) return null;
  return <p className="mt-1 text-sm text-error">{error.message}</p>;
}
