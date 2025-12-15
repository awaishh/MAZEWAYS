// src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // <--- 1. Import the Database tool

const firebaseConfig = {
  apiKey: "AIzaSyABEx5yHvHHuLXI25qSPrJursqxW2eeUqg",
  authDomain: "portalmaze-70b21.firebaseapp.com",
  projectId: "portalmaze-70b21",
  storageBucket: "portalmaze-70b21.firebasestorage.app",
  messagingSenderId: "396800813008",
  appId: "1:396800813008:web:92b79967e0c887063d7bd5",
  measurementId: "G-9E94JD2MKS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Export Database (THIS IS WHAT WAS MISSING!)
export const db = getFirestore(app);