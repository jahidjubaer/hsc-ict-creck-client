import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';

// Firebase is used only for "Continue with Google": the ID token goes to our API, which runs its own session.
const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const auth = getAuth(initializeApp(config));
auth.languageCode = 'bn';

/** Opens the Google account picker; resolves with a Firebase ID token, or null if the student closed it. */
export async function googleIdToken() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  try {
    const { user } = await signInWithPopup(auth, provider);
    const token = await user.getIdToken();
    signOut(auth).catch(() => {}); // our own session takes over from here
    return token;
  } catch (err) {
    if (['auth/popup-closed-by-user', 'auth/cancelled-popup-request', 'auth/user-cancelled'].includes(err?.code)) return null;
    throw err;
  }
}
