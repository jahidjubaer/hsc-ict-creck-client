import { isRouteErrorResponse, Link, useRouteError } from 'react-router';

// After a new deploy, a tab opened earlier can ask for page chunks that no longer exist. Reload once to get the new version.
const CHUNK_ERROR = /dynamically imported module|Importing a module script failed|error loading dynamically/i;
const RELOAD_KEY = 'chunk-reload-at';

function reloadOnceForChunkError(error) {
  if (!CHUNK_ERROR.test(error?.message ?? '')) return false;
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY));
    if (last && Date.now() - last < 30_000) return false;
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch {
    return false;
  }
  window.location.reload();
  return true;
}

export function RouteError() {
  const error = useRouteError();
  if (reloadOnceForChunkError(error)) return null;
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
