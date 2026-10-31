import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCXZpAhKibP-Cq02LKfb6KBxV3g0JZSaZ4",
  authDomain: "asha-sarthi.firebaseapp.com",
  projectId: "asha-sarthi",
  storageBucket: "asha-sarthi.firebasestorage.app",
  messagingSenderId: "724787417317",
  appId: "1:724787417317:web:cc977380be9885b903440c",
  measurementId: "G-NW8T73WKHR"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);