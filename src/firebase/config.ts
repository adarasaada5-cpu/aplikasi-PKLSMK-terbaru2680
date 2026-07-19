/// <reference types="vite/client" />
/**
 * Firebase Configuration Loader
 * Hanya menyiapkan konfigurasi, inisialisasi dilakukan di firebase.ts
 */

import firebaseConfig from "../../firebase-applet-config.json";

// Check if there is a valid Firebase API Key in env or fallback config
export const resolvedConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfig?.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfig?.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfig?.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfig?.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfig?.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfig?.appId,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || firebaseConfig?.measurementId,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || firebaseConfig?.firestoreDatabaseId,
};

export const hasValidConfig =
  resolvedConfig &&
  resolvedConfig.apiKey &&
  resolvedConfig.apiKey.trim() !== "" &&
  resolvedConfig.apiKey !== "MY_GEMINI_API_KEY";