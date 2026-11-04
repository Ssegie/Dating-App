// Browser-side Firebase. Only used when NEXT_PUBLIC_DEV_AUTH is not "true".
import { initializeApp, getApps } from "firebase/app";
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";

function app() {
  if (!getApps().length) {
    initializeApp({
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    });
  }
  return getAuth();
}
export const authListen = (cb) => onAuthStateChanged(app(), cb);
export const loginGoogle = () => signInWithPopup(app(), new GoogleAuthProvider());
export const logout = () => signOut(app());
export const idToken = async () => {
  const u = app().currentUser;
  return u ? u.getIdToken() : null;
};
