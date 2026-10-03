// Keeps a student's edits to a lab in localStorage, keyed by a hash of the lab's starter code.
export const storageKey = (prefix, code) => {
  let h = 0;
  for (let i = 0; i < code.length; i++) h = (h * 31 + code.charCodeAt(i)) | 0;
  return `${prefix}:${h}`;
};

export const loadDraft = (key) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

/** Saves `value`, or removes the draft when it is null (back to the starter code). */
export const saveDraft = (key, value) => {
  try {
    if (value == null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    /* storage blocked */
  }
};
