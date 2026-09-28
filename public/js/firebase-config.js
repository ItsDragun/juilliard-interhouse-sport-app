/**
 * Firebase Configuration and Initialization
 * Project: ja-mega-26 (Juilliard Interhouse Sports Day)
 */

export const firebaseConfig = {
  apiKey: "AIzaSyB2PhuebmPvGujVkYW22Z1Xs9woZbt6UCY",
  authDomain: "ja-mega-26.firebaseapp.com",
  projectId: "ja-mega-26",
  storageBucket: "ja-mega-26.firebasestorage.app",
  messagingSenderId: "222899543608",
  appId: "1:222899543608:web:3fe8914d23dcd14ae010cd"
};

let app = null;
let auth = null;
let db = null;
let isFirebaseConnected = false;

export function initFirebase() {
  if (typeof window === "undefined" || !window.firebase) {
    console.warn("Firebase SDK not detected on window. Operating in local interactive simulation mode.");
    return { app: null, auth: null, db: null, isConnected: false };
  }

  try {
    if (!window.firebase.apps || !window.firebase.apps.length) {
      app = window.firebase.initializeApp(firebaseConfig);
    } else {
      app = window.firebase.app();
    }

    auth = window.firebase.auth();
    db = window.firebase.firestore();

    // Ensure any stale Firestore IndexedDB cache from prior sessions is purged
    if (typeof window !== "undefined" && window.indexedDB) {
      try {
        window.indexedDB.deleteDatabase("firestore/[DEFAULT]/ja-mega-26/main");
      } catch (e) {
        // Non-blocking
      }
    }

    isFirebaseConnected = true;
    console.log("[Firebase] initialized successfully for ja-mega-26!");
    return { app, auth, db, firestore: db, isConnected: true };
  } catch (error) {
    console.error("Firebase initialization failed:", error);
    return { app: null, auth: null, db: null, firestore: null, isConnected: false };
  }
}

export function getFirebaseInstances() {
  if (!app && typeof window !== "undefined" && window.firebase) {
    return initFirebase();
  }
  return { app, auth, db, firestore: db, isConnected: isFirebaseConnected };
}
