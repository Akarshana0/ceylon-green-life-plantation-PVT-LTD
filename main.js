// ============================================================================
// Ceylon Green Life Plantation (Pvt) Ltd — Firebase configuration
// ============================================================================
// This is the config block generated when you registered the web app in the
// Firebase Console. It is safe to keep this public in client-side code —
// Firebase projects are protected by Security Rules (see firestore.rules and
// storage.rules), not by hiding this object.
// ============================================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import { getAnalytics, isSupported as analyticsIsSupported } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-analytics.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-storage.js";

export const firebaseConfig = {
  apiKey: "AIzaSyDceDRCfacmozXjUzeerDhGqApRQOLpaKQ",
  authDomain: "ceylon-green-life-planta-ee32e.firebaseapp.com",
  projectId: "ceylon-green-life-planta-ee32e",
  storageBucket: "ceylon-green-life-planta-ee32e.firebasestorage.app",
  messagingSenderId: "806884498173",
  appId: "1:806884498173:web:0d47da2769d331bba3fc94",
  measurementId: "G-T6P1KHZ6B9"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Analytics only works over https (GitHub Pages is https, so this is fine),
// but it will silently fail on file:// during local testing — guard it.
analyticsIsSupported().then((ok) => { if (ok) getAnalytics(app); }).catch(() => {});
