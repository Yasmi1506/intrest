// src/firebase/firebase.js
import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

/* ---------- YOUR FIREBASE CONFIG ---------- */
const firebaseConfig = {
  apiKey: "AIzaSyCsiHvIeqABuihB81fYC66G1YwgcMI_cDU",
  authDomain: "intrest-app-yasmin.firebaseapp.com",
  projectId: "intrest-app-yasmin",
  storageBucket: "intrest-app-yasmin.firebasestorage.app",
  messagingSenderId: "844464064068",
  appId: "1:844464064068:web:38835e9ad5ebc84b235e11",
  measurementId: "G-060CWF3B4L",
};
/* ------------------------------------------ */

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

/* ---------- GOOGLE PROVIDER ---------- */
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" }); // forces account chooser

/* ---------- HELPERS ---------- */
export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
export const signInWithGoogleRedirect = () => signInWithRedirect(auth, googleProvider);
export const getGoogleRedirectResult = () => getRedirectResult(auth);

export const registerWithEmail = (email, password) =>
  createUserWithEmailAndPassword(auth, email, password);

export const loginWithEmail = (email, password) =>
  signInWithEmailAndPassword(auth, email, password);

export const logout = () => signOut(auth);

export const onAuthChange = (callback) => onAuthStateChanged(auth, callback);