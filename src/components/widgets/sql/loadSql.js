import initSqlJs from 'sql.js';
import wasmUrl from 'sql.js/dist/sql-wasm-browser.wasm?url';

// SQLite compiled to WebAssembly (~650 KB), downloaded once when the first SQL lab opens.
let promise;
export const loadSql = () => {
  promise ??= initSqlJs({ locateFile: () => wasmUrl }).catch((e) => {
    promise = undefined;
    throw e;
  });
  return promise;
};
