import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyC3asi5-hDHdy_3QpSSSz2CiGJ2aYZ0S34",
  authDomain: "vardant-872cb.firebaseapp.com",
  projectId: "vardant-872cb",
  storageBucket: "vardant-872cb.firebasestorage.app",
  messagingSenderId: "675356867042",
  appId: "1:675356867042:web:9e95cf9fbb5f3919d521bb",
  measurementId: "G-JSDN2TB6KR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Initialize analytics only if supported (not in SSR)
export const initAnalytics = async () => {
  if (await isSupported()) {
    return getAnalytics(app);
  }
  return null;
};

export default app;
