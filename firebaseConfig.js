import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApps, initializeApp } from "firebase/app";
import {
  getReactNativePersistence,
  GoogleAuthProvider,
  initializeAuth,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCd3dVBUPYvgrj_x0LCQCfrGFgQa-oZays",
  authDomain: "sleeptracker-d9fef.firebaseapp.com",
  projectId: "sleeptracker-d9fef",
  storageBucket: "sleeptracker-d9fef.firebasestorage.app",
  messagingSenderId: "210765465869",
  appId: "1:210765465869:web:296b72923091388c2f0844",
  measurementId: "G-L9279NYE9E",
};

const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

const googleProvider = new GoogleAuthProvider();
const db = getFirestore(app);

export { auth, db, googleProvider };

