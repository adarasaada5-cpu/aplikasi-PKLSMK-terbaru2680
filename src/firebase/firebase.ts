/// <reference types="vite/client" />
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

let app;
let auth: any = null;
let db: any = null;
let isFirebaseActive = false;

// Check if there is a valid Firebase API Key in env or fallback config
const resolvedConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfig?.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfig?.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfig?.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfig?.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfig?.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfig?.appId,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || firebaseConfig?.measurementId,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || firebaseConfig?.firestoreDatabaseId,
};

const hasValidConfig =
  resolvedConfig &&
  resolvedConfig.apiKey &&
  resolvedConfig.apiKey.trim() !== "" &&
  resolvedConfig.apiKey !== "MY_GEMINI_API_KEY";

if (hasValidConfig) {
  try {
    app = getApps().length === 0 ? initializeApp(resolvedConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    isFirebaseActive = true;
    console.log("🔥 Firebase (firebase.ts) initialized successfully!");
  } catch (error) {
    console.error("⚠️ Failed to initialize Firebase in firebase.ts:", error);
  }
} else {
  console.info("📝 firebase.ts loaded in Preparation / Fallback mode.");
}

export { app, auth, db, isFirebaseActive };
export default app;
