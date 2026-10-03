import { isRouteErrorResponse, Link, useRouteError } from 'react-router';

export function RouteError() {
  const error = useRouteError();
  const message = isRouteErrorResponse(error) ? `${error.status} ${error.statusText}` : error?.message;
  return (
    <div className="grid min-h-dvh place-items-center p-6 text-center">
      <div className="max-w-md">
        <h1 className="text-3xl font-bold">দুঃখিত, একটা সমস্যা হয়েছে</h1>
        <p className="mt-2 text-base-content/60">{message}</p>
        <div className="mt-6 flex justify-center gap-2">
          <button className="btn" onClick={() => window.location.reload()}>
            আবার চেষ্টা করো
          </button>
          <Link to="/" className="btn btn-primary">
            হোমে যাও
          </Link>
        </div>
      </div>
    </div>
  );
}
