import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// Mengambil konfigurasi dari file config.ts
import { resolvedConfig, hasValidConfig } from "./config"; 

let app: any;
let auth: any = null;
let db: any = null;
let isFirebaseActive = false;

if (hasValidConfig) {
  try {
    if (getApps().length === 0) {
      app = initializeApp(resolvedConfig);
      console.log("🔥 Firebase initialized successfully!");
    } else {
      app = getApp();
    }
    auth = getAuth(app);
    // Menggunakan firestoreDatabaseId jika ada, jika tidak, pakai default
    db = getFirestore(app, resolvedConfig.firestoreDatabaseId || undefined);
    isFirebaseActive = true;
  } catch (error) {
    console.error("⚠️ Failed to initialize Firebase:", error);
  }
} else {
  console.info("📝 Firebase in Fallback mode (no config).");
}

export { app, auth, db, isFirebaseActive };
export default app;