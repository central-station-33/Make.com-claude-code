import {
  signInWithEmailLink,
  sendSignInLinkToEmail,
  signInWithPopup,
  GithubAuthProvider,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  confirmPasswordReset,
  isSignInWithEmailLink,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { auth } from './config';

const githubProvider = new GithubAuthProvider();

/** Magic-link: send the sign-in email */
export async function sendMagicLink(email: string, redirectUrl: string) {
  const actionCodeSettings = {
    url: redirectUrl,
    handleCodeInApp: true,
  };
  await sendSignInLinkToEmail(auth, email, actionCodeSettings);
  window.localStorage.setItem('emailForSignIn', email);
}

/** Magic-link: complete sign-in when user lands on the link */
export async function completeMagicLinkSignIn(email: string, href: string) {
  if (!isSignInWithEmailLink(auth, href)) {
    throw new Error('Invalid sign-in link');
  }
  return signInWithEmailLink(auth, email, href);
}

/** GitHub OAuth — opens a popup */
export async function signInWithGitHub() {
  return signInWithPopup(auth, githubProvider);
}

/** Sign out */
export async function signOut() {
  await firebaseSignOut(auth);
}

/** Send password reset email */
export async function sendPasswordReset(email: string, redirectUrl: string) {
  await sendPasswordResetEmail(auth, email, { url: redirectUrl });
}

/** Confirm new password using the reset code from the URL */
export async function confirmNewPassword(oobCode: string, newPassword: string) {
  await confirmPasswordReset(auth, oobCode, newPassword);
}

/** Get current user synchronously */
export function getCurrentUser(): User | null {
  return auth.currentUser;
}

/** Subscribe to auth state changes */
export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}
